"""
Test Gemini API Connectivity
Quick check to verify Gemini API is working
"""
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

def test_gemini():
    """Test Gemini API connection"""
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        print("❌ GEMINI_API_KEY not found in environment variables")
        print("   Please set it in your .env file")
        return False
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        response = model.generate_content("Say 'Hello' if you can read this.")
        
        if response.text:
            print("✅ Gemini API connection successful!")
            print(f"   Response: {response.text}")
            return True
        else:
            print("❌ Gemini API returned empty response")
            return False
            
    except Exception as e:
        print(f"❌ Gemini API test failed: {str(e)}")
        return False


if __name__ == "__main__":
    test_gemini()

