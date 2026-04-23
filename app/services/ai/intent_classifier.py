# app/services/ai/intent_classifier.py
"""
Intent Classifier - determines if user wants chat or analysis
"""
import re

CASUAL_PATTERNS = [
    r"^(hi|hello|hey|thanks|thank you|ok|okay|got it|sure|yes|no|bye)[\s!.]*$",
    r"^how are you",
    r"^what(\'s| is) up",
]

ANALYSIS_TRIGGERS = [
    "analyze",
    "check this",
    "scan this",
    "is this ai",
    "detect",
    "review this",
]

def classify_intent(text: str) -> str:
    """
    Returns: "chat" | "analysis"
    
    Logic:
    - If matches casual pattern -> "chat"
    - If < 20 chars and no trigger -> "chat"
    - If contains analysis trigger -> "analysis"
    - If > 50 chars -> "analysis"
    - Default -> "chat"
    """
    text_lower = text.lower().strip()
    
    # Check casual patterns
    for pattern in CASUAL_PATTERNS:
        if re.match(pattern, text_lower, re.IGNORECASE):
            return "chat"
    
    # Check if too short (probably chat)
    if len(text) < 20:
        # Unless has analysis trigger
        if any(trigger in text_lower for trigger in ANALYSIS_TRIGGERS):
            return "analysis"
        return "chat"
    
    # Check for explicit analysis triggers
    if any(trigger in text_lower for trigger in ANALYSIS_TRIGGERS):
        return "analysis"
    
    # Long text = probably analysis
    if len(text) > 50:
        return "analysis"
    
    # Default to chat for safety
    return "chat"
