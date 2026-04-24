import asyncio
import os
import io
from app.models.database import SessionLocal, engine, Base
from app.services.ai.orchestrator import orchestrator
from PIL import Image

async def test_multimodal():
    db = SessionLocal()
    
    print("--- TESTING TEXT CAPABILITY ---")
    payload_text = {
        "content": "Compose a detailed essay about the structural integrity of steel beams. - ChatGPT",
        "username": "tester",
        "source_platform": "web"
    }
    
    try:
        res = await orchestrator.process_incoming_threat(payload_text, db, mode="cloud")
        print("TEXT RESULT:", res.get("is_ai_generated"), res.get("forensics", {}).get("risk_score"))
        if "attribution" in res.get("forensics", {}):
            print("ATTRIBUTION FOUND:", res["forensics"]["attribution"])
    except Exception as e:
        print("TEXT ERROR:", e)

    print("\n--- TESTING IMAGE CAPABILITY ---")
    img = Image.new('RGB', (100, 100), color = 'red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_bytes = img_byte_arr.getvalue()

    payload_img = {
        "content": "Analyze this suspicious image I found.",
        "media_bytes": img_bytes,
        "mime_type": "image/jpeg",
        "username": "tester_img",
        "source_platform": "web"
    }
    
    try:
        res2 = await orchestrator.process_incoming_threat(payload_img, db, mode="cloud")
        print("IMAGE RESULT:", res2.get("is_ai_generated"), res2.get("forensics", {}).get("risk_score"))
        if "attribution" in res2.get("forensics", {}):
            print("ATTRIBUTION FOUND:", res2["forensics"]["attribution"])
    except Exception as e:
        print("IMAGE ERROR:", e)
        
    db.close()

if __name__ == "__main__":
    asyncio.run(test_multimodal())
