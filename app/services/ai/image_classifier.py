"""
Image Classification Service
Detects if image is AI-generated vs real/human-captured

Uses simple heuristic-based approach (can be upgraded to ML model later)
"""
import io
from PIL import Image
import numpy as np
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class ImageClassifier:
    """
    Classify images as AI-generated or real.
    
    Current implementation: Heuristic-based
    Future: Replace with CNN model (ResNet/EfficientNet)
    """
    
    def __init__(self):
        self.ai_threshold = 0.6  # Confidence threshold
    
    def analyze(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Analyze image to detect if AI-generated.
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            {
                "is_ai_generated": bool,
                "confidence": float (0-1),
                "details": str,
                "artifacts": list
            }
        """
        try:
            # Load image
            img = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Get image properties
            width, height = img.size
            arr = np.array(img)
            
            # Heuristic checks for AI-generated content
            artifacts = []
            ai_indicators = 0
            total_checks = 5
            
            # Check 1: Extremely uniform regions (AI signature)
            std_dev = np.std(arr)
            if std_dev < 30:  # Too uniform
                artifacts.append("Extremely uniform pixel distribution")
                ai_indicators += 1
            elif std_dev > 150:  # Too varied (some GANs)
                artifacts.append("Unnaturally high pixel variance")
                ai_indicators += 0.5
            
            # Check 2: Perfect symmetry (common in AI)
            left_half = arr[:, :width//2]
            right_half = np.fliplr(arr[:, width//2:])
            if left_half.shape == right_half.shape:
                symmetry_diff = np.mean(np.abs(left_half.astype(float) - right_half.astype(float)))
                if symmetry_diff < 5:  # Almost perfect symmetry
                    artifacts.append("Perfect bilateral symmetry detected")
                    ai_indicators += 1
            
            # Check 3: Aspect ratio analysis (AI often uses specific ratios)
            aspect_ratio = width / height
            ai_ratios = [1.0, 1.5, 0.666, 2.0, 0.5]  # Common AI generation ratios
            if any(abs(aspect_ratio - r) < 0.01 for r in ai_ratios):
                artifacts.append(f"Aspect ratio {aspect_ratio:.2f} matches common AI generation")
                ai_indicators += 0.3
            
            # Check 4: Resolution analysis (AI often uses power-of-2)
            if (width % 64 == 0 and height % 64 == 0) or (width == height and width in [256, 512, 1024, 2048]):
                artifacts.append(f"Resolution {width}x{height} matches AI training dimensions")
                ai_indicators += 0.5
            
            # Check 5: EXIF metadata check (AI-generated usually lacks camera metadata)
            exif = img.getexif()
            if exif is None or len(exif) == 0:
                artifacts.append("No EXIF metadata (common in AI-generated)")
                ai_indicators += 0.7
            else:
                # Has EXIF - likely real camera
                artifacts.append("EXIF metadata present (real camera signature)")
                ai_indicators -= 0.5
            
            # Calculate confidence
            confidence = min(1.0, max(0.0, ai_indicators / total_checks))
            is_ai = confidence >= self.ai_threshold
            
            # Add natural patterns if low AI score
            if not artifacts:
                artifacts.append("Normal image characteristics detected")
            
            details = f"Image analysis: {width}x{height}px, std_dev={std_dev:.1f}"
            if exif and len(exif) > 0:
                details += ", EXIF present"
            
            logger.info(f"Image classified: AI={is_ai}, confidence={confidence:.2f}")
            
            return {
                "is_ai_generated": is_ai,
                "confidence": round(confidence, 3),
                "details": details,
                "artifacts": artifacts,
                "dimensions": {"width": width, "height": height},
                "has_exif": exif is not None and len(exif) > 0,
            }
            
        except Exception as e:
            logger.error(f"Image analysis failed: {e}")
            return {
                "is_ai_generated": False,
                "confidence": 0.0,
                "details": f"Analysis failed: {str(e)}",
                "artifacts": ["Error during analysis"],
                "error": str(e)
            }


# Global instance
image_classifier = ImageClassifier()
