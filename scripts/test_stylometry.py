#!/usr/bin/env python3
"""
Test Script for Stylometry Engine
Validates Agent 1: Forensic Investigator functionality
"""
import sys
import os
import importlib.util

# Direct import to avoid __init__ dependencies
def import_module_from_file(module_name, file_path):
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module

# Get the stylometry module path
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, '..'))
stylometry_path = os.path.join(project_root, 'app', 'services', 'ai', 'stylometry.py')

# Import stylometry module directly
stylometry = import_module_from_file('stylometry', stylometry_path)
forensic_investigator = stylometry.forensic_investigator
detect_adversarial_patterns = stylometry.detect_adversarial_patterns


def print_separator():
    print("\n" + "=" * 80 + "\n")


def test_ai_generated_text():
    """Test with AI-like text (uniform sentences, low variance)"""
    print("[AI] TEST 1: AI-Generated Text (Uniform Sentence Length)")
    print_separator()
    
    ai_text = """
    The system processes data efficiently. It performs tasks with precision.
    The algorithm optimizes workflows automatically. It delivers consistent results.
    The platform integrates seamlessly with tools. It provides real-time analytics.
    The framework supports scalable architectures. It enables rapid development.
    """
    
    print("TEXT:")
    print(ai_text)
    print_separator()
    
    result = forensic_investigator.analyze(ai_text)
    
    print("ANALYSIS RESULTS:")
    print(f"  • Is AI Generated: {result['is_ai']}")
    print(f"  • Risk Score: {result['risk_score']:.3f}")
    print(f"  • Burstiness: {result['burstiness']:.2f}")
    print(f"  • Perplexity: {result['perplexity']:.2f}")
    print(f"  • Artifacts: {', '.join(result['artifacts'])}")
    print(f"  • Details: {result['details']}")
    print_separator()
    
    # Validation
    assert result['is_ai'] == True, "Should detect AI content"
    assert result['risk_score'] > 0.5, "Risk score should be elevated"
    assert result['burstiness'] < 3.0, "Burstiness should be low"
    
    print("[PASS] TEST 1 PASSED: AI content correctly identified\n")
    return result


def test_human_text():
    """Test with human-like text (varied sentences, high variance)"""
    print("[HUMAN] TEST 2: Human-Written Text (Varied Sentence Length)")
    print_separator()
    
    human_text = """
    I love coding! Sometimes I write really long, detailed sentences that explore 
    complex ideas and ramble on about various technical concepts, implementation 
    strategies, and architectural decisions that need to be carefully considered 
    when building production systems. Short one. And then I might write something 
    medium-length that balances between brevity and detail. Boom! Another quick thought.
    This variation in my writing style is natural and reflects how humans actually 
    communicate when they're not constrained by formal structure or AI training.
    """
    
    print("TEXT:")
    print(human_text)
    print_separator()
    
    result = forensic_investigator.analyze(human_text)
    
    print("ANALYSIS RESULTS:")
    print(f"  • Is AI Generated: {result['is_ai']}")
    print(f"  • Risk Score: {result['risk_score']:.3f}")
    print(f"  • Burstiness: {result['burstiness']:.2f}")
    print(f"  • Perplexity: {result['perplexity']:.2f}")
    print(f"  • Artifacts: {', '.join(result['artifacts'])}")
    print(f"  • Details: {result['details']}")
    print_separator()
    
    # Validation
    assert result['is_ai'] == False, "Should NOT detect as AI content"
    assert result['burstiness'] > 5.0, "Burstiness should be high"
    
    print("[PASS] TEST 2 PASSED: Human content correctly identified\n")
    return result


def test_adversarial_patterns():
    """Test adversarial pattern detection (Leetspeak, obfuscation)"""
    print("[ADVERSARIAL] TEST 3: Adversarial Pattern Detection (FR-02)")
    print_separator()
    
    # Test Case 1: Leetspeak
    leetspeak_text = "The 3l3cti0n was h4ck3d by 4dv3rs4ry actors."
    print("TEXT 1 (Leetspeak):")
    print(leetspeak_text)
    
    result1 = detect_adversarial_patterns(leetspeak_text)
    print(f"\n  • Adversarial Detected: {result1['adversarial_detected']}")
    print(f"  • Patterns: {result1['patterns']}")
    print(f"  • Severity: {result1['severity']}")
    
    assert result1['adversarial_detected'] == True, "Should detect Leetspeak"
    print("\n[PASS] Leetspeak detection PASSED")
    
    # Test Case 2: Symbol substitution
    print_separator()
    symbol_text = "Contact @dmin for p@ssword reset on $ystem."
    print("TEXT 2 (Symbol Substitution):")
    print(symbol_text)
    
    result2 = detect_adversarial_patterns(symbol_text)
    print(f"\n  • Adversarial Detected: {result2['adversarial_detected']}")
    print(f"  • Patterns: {result2['patterns']}")
    print(f"  • Severity: {result2['severity']}")
    
    assert result2['adversarial_detected'] == True, "Should detect symbol substitution"
    print("\n[PASS] Symbol substitution detection PASSED")
    
    # Test Case 3: Clean text (no patterns)
    print_separator()
    clean_text = "This is a normal sentence with no obfuscation techniques applied."
    print("TEXT 3 (Clean Text):")
    print(clean_text)
    
    result3 = detect_adversarial_patterns(clean_text)
    print(f"\n  • Adversarial Detected: {result3['adversarial_detected']}")
    print(f"  • Patterns: {result3['patterns']}")
    print(f"  • Severity: {result3['severity']}")
    
    assert result3['adversarial_detected'] == False, "Should NOT detect patterns in clean text"
    print("\n[PASS] Clean text validation PASSED")
    
    print_separator()
    print("[PASS] TEST 3 PASSED: All adversarial pattern tests successful\n")


def test_full_analysis_with_adversarial():
    """Test full stylometry analysis with adversarial content"""
    print("[FULL] TEST 4: Full Analysis with Adversarial Content")
    print_separator()
    
    adversarial_text = """
    The 3l3cti0n system was compromised. The attack was coordinated. 
    The h4ck3r used advanced techniques. The breach was detected quickly.
    The @dmin responded immediately. The system was secured rapidly.
    """
    
    print("TEXT:")
    print(adversarial_text)
    print_separator()
    
    result = forensic_investigator.analyze(adversarial_text)
    
    print("FULL ANALYSIS RESULTS:")
    print(f"  • Is AI Generated: {result['is_ai']}")
    print(f"  • Risk Score: {result['risk_score']:.3f}")
    print(f"  • Burstiness: {result['burstiness']:.2f}")
    print(f"  • Perplexity: {result['perplexity']:.2f}")
    print(f"  • Adversarial Detected: {result['adversarial_detected']}")
    print(f"  • Adversarial Patterns: {result['adversarial_patterns']}")
    print(f"  • Artifacts: {', '.join(result['artifacts'])}")
    print(f"  • Details: {result['details']}")
    print_separator()
    
    # Validation
    assert result['adversarial_detected'] == True, "Should detect adversarial patterns"
    assert 'Leetspeak' in str(result['adversarial_patterns']), "Should identify Leetspeak"
    
    print("[PASS] TEST 4 PASSED: Adversarial content analysis successful\n")


def run_all_tests():
    """Run complete test suite"""
    print("\n")
    print("=" * 80)
    print(" " * 20 + "STYLOMETRY ENGINE TEST SUITE")
    print(" " * 22 + "Agent 1: Forensic Investigator")
    print("=" * 80)
    print("\n")
    
    try:
        # Run all tests
        ai_result = test_ai_generated_text()
        human_result = test_human_text()
        test_adversarial_patterns()
        test_full_analysis_with_adversarial()
        
        # Summary
        print("\n")
        print("=" * 80)
        print(" " * 30 + "TEST SUMMARY")
        print("=" * 80)
        print("\n")
        print("[SUCCESS] All 4 tests PASSED successfully!")
        print("\nPerformance Summary:")
        print(f"  * AI Text Detection: {ai_result['is_ai']} (Risk: {ai_result['risk_score']:.3f})")
        print(f"  * Human Text Detection: {human_result['is_ai']} (Risk: {human_result['risk_score']:.3f})")
        print(f"  * Adversarial Detection: FUNCTIONAL")
        print(f"  * Burstiness Calculation: FUNCTIONAL")
        print(f"  * Perplexity Estimation: FUNCTIONAL")
        print("\n")
        print("[READY] Agent 1 (Forensic Investigator) is ready for production!")
        print("\n")
        
        return True
        
    except AssertionError as e:
        print(f"\n[FAIL] TEST FAILED: {str(e)}")
        return False
    except Exception as e:
        print(f"\n[ERROR] ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)

