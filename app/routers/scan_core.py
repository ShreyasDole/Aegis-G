# app/routers/scan_core.py
"""Core Scan API endpoint (Phase 1)

Provides an end‑to‑end flow that:
1. Classifies intent (chat vs analysis)
2. For chat: responds with chatbot message
3. For analysis: normalises input, runs DeBERTa, returns risk score
4. For images: runs image classifier
"""

from fastapi import APIRouter, Depends, Request, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.schemas.detection import ScanRequest, ScanResponse
from app.models.database import get_db
from app.services.ai.orchestrator import orchestrator
from app.services.ai.intent_classifier import classify_intent
from app.services.ai.image_classifier import image_classifier

router = APIRouter()

# Chatbot responses
CHAT_RESPONSES = {
    "hi": "Hello! I'm AEGIS-G Forensic Scanner. Send me text or images to analyze for AI-generated content, adversarial patterns, or threats.",
    "hello": "Hi there! Ready to analyze content for AI generation and threats. What would you like me to scan?",
    "thanks": "You're welcome! Let me know if you need anything else analyzed.",
    "how are you": "I'm functioning optimally! Ready to scan content whenever you need.",
    "default": "I'm AEGIS-G Scanner. To analyze content, send me text (>20 chars) or say 'analyze this: [content]'."
}

@router.post("/core", response_model=ScanResponse, status_code=status.HTTP_200_OK)
async def core_scan(
    request: ScanRequest,
    req: Request,
    db: Session = Depends(get_db),
):
    """Run the Phase 1 detection pipeline.

    The client can optionally set the ``X-Inference-Mode`` header to ``local``
    (default) or ``cloud``. ``local`` forces the ONNX/CPU path; ``cloud`` falls
    back to the Gemini client as implemented in the orchestrator.
    """
    content = request.content
    
    # Check intent: chat vs analysis
    intent = classify_intent(content)
    
    if intent == "chat":
        # Respond like chatbot
        response_text = CHAT_RESPONSES.get(content.lower().strip(), CHAT_RESPONSES["default"])
        return ScanResponse(
            content_hash="",
            risk_score=0.0,
            is_ai_generated=False,
            confidence=1.0,
            detected_model="",
            timestamp=None,
            recommendation=response_text,
            denoised_text="",
            attribution={},
            explainability=[],
            rag_memory=[],
        )
    
    # Run full analysis
    mode = (req.headers.get("X-Inference-Mode") or "local").lower()
    payload = {
        "content": content,
        "source_platform": request.source_platform or "web",
        "username": request.username or "anonymous",
    }
    try:
        result = await orchestrator.process_incoming_threat(payload, db, mode=mode)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Phase 1 processing failed: {str(e)}"
        )

    # The orchestrator now returns a dict with denoised_text, risk_score and attribution.
    return ScanResponse(
        content_hash=result.get("content_hash", ""),
        risk_score=result.get("risk_score", 0.0),
        is_ai_generated=result.get("is_ai_generated", False),
        confidence=result.get("confidence", 0.0),
        detected_model=result.get("detected_model", ""),
        timestamp=result.get("timestamp"),
        recommendation=result.get("recommendation", ""),
        # Extra fields for UI mapping
        denoised_text=result.get("denoised_text", ""),
        attribution=result.get("attribution", {}),
        explainability=result.get("explainability", []),
        rag_memory=result.get("rag_memory", []),
    )


@router.post("/test-image", status_code=status.HTTP_200_OK)
async def test_image_upload(
    image: Optional[UploadFile] = File(None),
):
    """Simple test endpoint for image upload"""
    if not image:
        return {"error": "No image provided"}
    
    try:
        image_bytes = await image.read()
        result = image_classifier.analyze(image_bytes)
        return {
            "success": True,
            "filename": image.filename,
            "size": len(image_bytes),
            "analysis": result
        }
    except Exception as e:
        import traceback
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }


@router.post("/with-image", status_code=status.HTTP_200_OK)
async def scan_with_image(
    request: Request,
    content: Optional[str] = Form(""),
    image: Optional[UploadFile] = File(None),
    source_platform: Optional[str] = Form("web"),
    username: Optional[str] = Form("anonymous"),
):
    """
    Scan content with optional image attachment.
    
    Multipart form-data endpoint that accepts:
    - content: text to analyze
    - image: image file (optional)
    - source_platform: platform identifier
    - username: user identifier
    
    Note: DB not required for basic scanning
    """
    result = {
        "text_analysis": None,
        "image_analysis": None,
        "combined_risk": 0.0,
        "timestamp": datetime.utcnow()
    }
    
    # Analyze text if provided
    if content and len(content.strip()) > 0:
        intent = classify_intent(content)
        
        if intent == "chat":
            # Return chatbot response
            response_text = CHAT_RESPONSES.get(content.lower().strip(), CHAT_RESPONSES["default"])
            result["text_analysis"] = {
                "recommendation": response_text,
                "is_chat": True
            }
        else:
            # Full NLP analysis - use None for db to make it optional
            mode = (request.headers.get("X-Inference-Mode") or "local").lower()
            payload = {
                "content": content,
                "source_platform": source_platform,
                "username": username,
            }
            try:
                # Pass None for db - orchestrator should handle gracefully
                text_result = await orchestrator.process_incoming_threat(payload, None, mode=mode)
                result["text_analysis"] = {
                    "risk_score": text_result.get("risk_score", 0.0),
                    "is_ai_generated": text_result.get("is_ai_generated", False),
                    "detected_model": text_result.get("detected_model", ""),
                    "recommendation": text_result.get("recommendation", ""),
                    "attribution": text_result.get("attribution", {}),
                    "explainability": text_result.get("explainability", []),
                    "rag_memory": text_result.get("rag_memory", []),
                }
            except Exception as e:
                result["text_analysis"] = {"error": str(e), "risk_score": 0.0}
    
    # Analyze image if provided
    if image:
        try:
            image_bytes = await image.read()
            img_result = image_classifier.analyze(image_bytes)
            result["image_analysis"] = {
                "is_ai_generated": img_result.get("is_ai_generated", False),
                "confidence": img_result.get("confidence", 0.0),
                "details": img_result.get("details", ""),
                "artifacts": img_result.get("artifacts", []),
                "dimensions": img_result.get("dimensions", {}),
                "has_exif": img_result.get("has_exif", False),
                "filename": image.filename,
                "size": len(image_bytes),
            }
        except Exception as e:
            result["image_analysis"] = {"error": str(e), "confidence": 0.0}
    
    # Calculate combined risk
    text_risk = result["text_analysis"].get("risk_score", 0.0) if result["text_analysis"] and not result["text_analysis"].get("is_chat") else 0.0
    image_risk = result["image_analysis"].get("confidence", 0.0) if result["image_analysis"] and result["image_analysis"].get("is_ai_generated") else 0.0
    
    # Weighted combination (text more important than image)
    if text_risk > 0 and image_risk > 0:
        result["combined_risk"] = (text_risk * 0.7) + (image_risk * 0.3)
    else:
        result["combined_risk"] = max(text_risk, image_risk)
    
    result["is_ai_generated"] = result["combined_risk"] >= 0.4
    result["recommendation"] = _get_recommendation(result["combined_risk"], result["text_analysis"], result["image_analysis"])
    
    return result


def _get_recommendation(risk: float, text_analysis: dict, image_analysis: dict) -> str:
    """Generate recommendation based on combined analysis"""
    if text_analysis and text_analysis.get("is_chat"):
        return text_analysis.get("recommendation", "")
    
    if risk >= 0.7:
        return "HIGH RISK: Block content and flag for review"
    elif risk >= 0.4:
        return "MEDIUM RISK: Review recommended"
    
    parts = []
    if image_analysis and image_analysis.get("is_ai_generated"):
        parts.append("Image appears AI-generated")
    if text_analysis and text_analysis.get("is_ai_generated"):
        parts.append("Text appears AI-generated")
    
    if parts:
        return f"LOW RISK: {', '.join(parts)}"
    
    return "Content appears authentic"

