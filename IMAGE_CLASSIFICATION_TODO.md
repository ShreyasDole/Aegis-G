# IMAGE CLASSIFICATION - NOT IMPLEMENTED

## Problem:
Frontend sends image as base64 IN TEXT field.
Backend treats it as TEXT, not as actual image.
Gemini gets "Image provided: true/false" (useless boolean).

## What's needed:
1. Separate image field in ScanRequest schema
2. Image classification model (real vs AI-generated)
3. Options:
   - Train CNN classifier (ResNet/EfficientNet)
   - Use pre-trained detector (fake-image-detection)
   - Use Gemini Vision API with actual image bytes

## Current flow (BROKEN):
```
Frontend:
  image -> base64 -> concat to text field
  content = "text\n[IMAGE_ATTACHMENT: file.png]\ndata:image/png;base64,iVBOR..."

Backend:
  treats entire string as TEXT
  passes to NLP model (meaningless)
  
Gemini:
  gets "Image provided: true" (just a boolean, no actual image)
```

## Correct flow:
```
Frontend:
  text -> content field
  image -> separate image field OR multipart upload
  
Backend:
  if image exists:
    - extract image bytes
    - run image classifier model
    - detect if AI-generated
  pass text to NLP
  
Gemini (if used):
  send actual image bytes via Vision API
  get real analysis
```

## Quick fix for testing:
Add multipart upload endpoint:

```python
@router.post("/scan/with-image")
async def scan_with_image(
    content: str = Form(""),
    image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    result = {"text_analysis": None, "image_analysis": None}
    
    if content:
        result["text_analysis"] = await orchestrator.process_incoming_threat(...)
    
    if image:
        image_bytes = await image.read()
        # TODO: run image classifier
        result["image_analysis"] = {
            "is_ai_generated": False,  # placeholder
            "confidence": 0.0
        }
    
    return result
```

## Models for image classification:
1. CLIP-based (OpenAI)
2. fake-image-detection (Hugging Face)
3. GAN-detector
4. Gemini Vision API (cloud)
