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
from app.services.ai.audio_classifier import audio_classifier

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
    db: Session = Depends(get_db),
):
    """
    Scan content with optional image attachment.
    
    Multipart form-data endpoint that accepts:
    - content: text to analyze
    - image: image file (optional)
    - source_platform: platform identifier
    - username: user identifier
    """
    result = {
        "text_analysis": None,
        "image_analysis": None,
        "audio_analysis": None,
        "combined_risk": 0.0,
        "timestamp": datetime.utcnow()
    }
    
    intent = classify_intent(content or "")
    if intent == "chat" and not image:
        response_text = CHAT_RESPONSES.get((content or "").lower().strip(), CHAT_RESPONSES["default"])
        result["text_analysis"] = {
            "recommendation": response_text,
            "is_chat": True,
            "risk_score": 0.0
        }
        return result
    # Full NLP & Multimodal Analysis
    media_bytes = None
    mime_type = None
    if image:
        media_bytes = await image.read()
        mime_type = image.content_type or "image/jpeg"
        # Audio extensions
        if (image.filename or "").lower().endswith(('.mp3', '.wav', '.ogg', '.m4a')):
            mime_type = "audio/mp3"
            
    mode = (request.headers.get("X-Inference-Mode") or "cloud").lower()
    payload = {
        "content": content,
        "source_platform": source_platform,
        "username": username,
        "media_bytes": media_bytes,
        "mime_type": mime_type
    }
    
    try:
        # Pass real DB session so it saves to PGVector & Neo4j via Orchestrator
        text_result = await orchestrator.process_incoming_threat(payload, db, mode="cloud")
        
        # Populate the parent UI variables mapping
        result["combined_risk"] = text_result.get("risk_score", 0.0)
        result["is_ai_generated"] = text_result.get("is_ai_generated", False)
        result["recommendation"] = text_result.get("recommendation", "Review content")
        
        # The frontend maps ALL explanations from `data.text_analysis`. Let's populate it here
        # so frontend parses image/audio/text outputs seamlessly
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
        import traceback
        result["text_analysis"] = {"error": str(e), "traceback": traceback.format_exc(), "risk_score": 0.0}
    
    return result


def _get_recommendation(risk: float, text_analysis: dict, image_analysis: dict, audio_analysis: dict = None) -> str:
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
    if audio_analysis and audio_analysis.get("is_ai_generated"):
        parts.append("Audio appears AI-generated")
    
    if parts:
        return f"LOW RISK: {', '.join(parts)}"
    
    return "Content appears authentic"

@router.post("/seed_demo")
async def trigger_botnet_seeder(db: Session = Depends(get_db)):
    from app.services.ai.orchestrator import orchestrator
    import asyncio
    
    NARRATIVES = [
        {
            "id": "ELECTION_DISINFO_B",
            "content": "URGENT LEAK! Found thousands of discarded ballots in the river near the 43rd district polling center! The establishment AI is actively covering this up. Share immediately before they take this down! #ElectionFraud #WakeUp",
            "platform": "twitter",
            "nodes": ["FreedomPatriot_99", "TruthSeeker_Bot1", "TruthSeeker_Bot2", "Echo_Chamber_X", "AngryVoter_2024"]
        },
        {
            "id": "BTC_SCAM_01",
            "content": "Elon Musk is doubling all Bitcoin sent to the official Tesla reserve wallet for the next 2 hours only! Send BTC to 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa and receive 2x back instantly! Validated by X safety.",
            "platform": "telegram",
            "nodes": ["CryptoKing_Origin", "Alpha_Ape_G", "Moon_Signals_Bot", "Tesla_Giveaway_Admin", "Whale_Alert_Fake"]
        },
        {
            "id": "RANSOM_GIST_99",
            "content": "Download the new firmware update for Log4j vulnerability patch here: http://malicious-gist-patch.com/setup.exe. Failure to update will result in immediate compromised network states.",
            "platform": "github",
            "nodes": ["Sec_Admin_001", "DevOps_Alerts", "Security_Bot_Net", "IT_Updates_Daily"]
        }
    ]

    async def _inject():
        for narrative in NARRATIVES:
            for username in narrative["nodes"]:
                payload = {
                    "content": narrative["content"],
                    "source_platform": narrative["platform"],
                    "username": username
                }
                try:
                    await orchestrator.process_incoming_threat(payload, db, mode="local")
                except Exception as e:
                    pass
                await asyncio.sleep(0.5)

    asyncio.create_task(_inject())
    return {"status": "seeding_initiated", "message": "Botnet data injection has started in the background."}

