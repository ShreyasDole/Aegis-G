import os
import sys

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.services.ai.onnx_runtime import ONNXAttributor
import json

def run_tests():
    attributor = ONNXAttributor()

    test_cases = [
        {
            "name": "Short Human Chat",
            "text": "hey bro what's up catching the game tonight?",
            "expected_ai_high": False
        },
        {
            "name": "Human Rant (Contains misleading keywords)",
            "text": "I absolutely despise artificial intelligence and GPT systems! Human intelligence and emotional authenticity are what make clean, real art. We shouldn't rely on a 100-line algorithm to tell us what to do.",
            "expected_ai_high": False
        },
        {
            "name": "AI Essay Prompt (Simulated)",
            "text": "Here is a 100-line report on artificial intelligence written in a structured format as requested. Artificial intelligence (AI) is transforming the human experience...",
            "expected_ai_high": True
        },
        {
            "name": "Standard GPT Response",
            "text": "Certainly! Here is a cleaner version of the code that encapsulates the logic perfectly. Please let me know if you need any further assistance.",
            "expected_ai_high": True
        },
        {
            "name": "Long Human Text",
            "text": "Anyway, yesterday I was walking down the street and I saw a dog chasing its own tail. It was hilarious! People were looking at it and laughing. I decided to buy a coffee, and the barista was super nice and gave me a free pastry. Best day ever.",
            "expected_ai_high": False
        }
    ]

    results = []
    
    for i, tc in enumerate(test_cases):
        result = attributor.predict(tc['text'])
        ai_prob = sum(v for k, v in result.items() if k != "human")
        expected = tc['expected_ai_high']
        actual = ai_prob > 0.5
        
        results.append({
            "name": tc['name'],
            "ai_prob": ai_prob,
            "human_prob": result.get("human", 0.0),
            "expected_ai": expected,
            "actual_ai": actual,
            "passed": expected == actual
        })

    with open("test_results.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    run_tests()
