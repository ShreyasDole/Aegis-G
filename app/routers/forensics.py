"""
Forensics Router
Deep dive analysis using Gemini 2.5 Flash
"""
from fastapi import APIRouter, HTTPException
from app.services.gemini.client import GeminiClient

router = APIRouter()


@router.post("/{threat_id}")
async def analyze_forensics(threat_id: int, include_image: bool = False):
    """
    Deep forensic analysis of flagged content
    Uses Gemini 2.5 Flash for advanced reasoning
    """
    try:
        gemini_client = GeminiClient()
        
        # Perform deep analysis
        analysis = await gemini_client.forensic_analysis(
            threat_id=threat_id,
            include_image=include_image
        )
        
        return {
            "threat_id": threat_id,
            "analysis": analysis,
            "entities": analysis.get("entities", {}),
            "attribution": analysis.get("attribution", {}),
            "recommendations": analysis.get("recommendations", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forensic analysis failed: {str(e)}")


@router.get("/{threat_id}/summary")
async def get_forensic_summary(threat_id: int):
    """Get summary of forensic analysis"""
    # In production, fetch from database
    return {
        "threat_id": threat_id,
        "summary": "Forensic analysis summary will be generated here",
        "status": "pending"
    }

