"""
Gemini Prompts Loader
Loads system instructions from text files for easy AI personality tweaking
"""
from pathlib import Path


def _load_prompt(filename: str) -> str:
    """Load a prompt from a text file"""
    prompt_dir = Path(__file__).parent / "prompts"
    prompt_path = prompt_dir / filename
    
    if not prompt_path.exists():
        # Fallback to default if file doesn't exist
        return ""
    
    with open(prompt_path, 'r', encoding='utf-8') as f:
        return f.read().strip()


# Load prompts from text files
DETECTION_PROMPT = _load_prompt("sentinel_prompt.txt")
FORENSIC_PROMPT = _load_prompt("forensic_prompt.txt")
PRIVACY_REDACTION_PROMPT = _load_prompt("redactor_prompt.txt")


# Fallback prompts if files are missing
if not DETECTION_PROMPT:
    DETECTION_PROMPT = """
    You are an AI content detection expert. Analyze text for signs of AI generation.
    Focus on perplexity, burstiness, repetitive patterns, and statistical anomalies.
    Respond with structured JSON analysis.
    """

if not FORENSIC_PROMPT:
    FORENSIC_PROMPT = """
    You are a forensic analyst specializing in threat intelligence.
    Perform deep analysis including entity extraction, attribution, and threat actor identification.
    Provide detailed, actionable intelligence.
    """

if not PRIVACY_REDACTION_PROMPT:
    PRIVACY_REDACTION_PROMPT = """
    You are a privacy compliance officer. Redact PII from threat reports.
    Remove names, emails, phones, addresses, and other PII while maintaining intelligence value.
    """

