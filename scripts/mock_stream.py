"""
Mock Stream Generator
Generates fake threats and injects them into the system
"""
import requests
import json
import time
import random
from datetime import datetime

API_BASE = "http://localhost:8000/api/scan"

# Sample threat content templates
THREAT_TEMPLATES = [
    "Breaking news: Major event happening now! Share immediately!",
    "URGENT: Your account needs verification. Click here now!",
    "Important announcement: This affects everyone. Spread the word!",
    "Exclusive information: Only for trusted members. Forward this message.",
    "Alert: Critical update required. Act now before it's too late!",
]

PLATFORMS = ["twitter", "telegram", "reddit", "facebook", "whatsapp"]


def generate_mock_threat():
    """Generate a mock threat with AI-like characteristics"""
    template = random.choice(THREAT_TEMPLATES)
    platform = random.choice(PLATFORMS)
    
    # Add some AI-like patterns
    if random.random() > 0.5:
        # Repetitive pattern
        content = f"{template} {template}"
    else:
        content = template
    
    return {
        "content": content,
        "source_platform": platform,
        "metadata": {
            "timestamp": datetime.utcnow().isoformat(),
            "generated_by": "mock_stream"
        }
    }


def inject_threat():
    """Inject a single threat into the system"""
    threat = generate_mock_threat()
    
    try:
        response = requests.post(API_BASE, json=threat, timeout=5)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Threat injected: Risk Score = {result.get('risk_score', 0):.2f}")
            return True
        else:
            print(f"❌ Failed to inject threat: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error injecting threat: {str(e)}")
        return False


def main():
    """Main loop for continuous threat injection"""
    print("🚨 Starting Mock Threat Stream")
    print("⚠️  This will continuously inject fake threats into the system")
    print("Press Ctrl+C to stop\n")
    
    interval = 2  # seconds between injections
    
    try:
        while True:
            inject_threat()
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n🛑 Mock stream stopped")


if __name__ == "__main__":
    main()

