"""
Stylometry Service - Agent 1: Forensic Investigator
Analyzes text for AI-generated content using Perplexity and Burstiness metrics
"""
import numpy as np
import re
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class ForensicInvestigator:
    """
    Agent 1: Forensic Investigator
    Focus: Stylometric Fingerprinting (Perplexity & Burstiness)
    
    Core Capabilities:
    - Calculate Burstiness (variance in sentence length)
    - Calculate Perplexity (text predictability)
    - Detect adversarial patterns (Leetspeak, obfuscation)
    - Generate risk scores for AI-generated content
    """
    
    def __init__(self):
        self.burstiness_threshold = 3.0  # Low burstiness indicates AI
        self.high_risk_threshold = 0.75
        self.medium_risk_threshold = 0.50
    
    def analyze(self, text: str) -> Dict[str, Any]:
        """
        Main analysis method that combines all stylometric features.
        
        Args:
            text: The content to analyze
            
        Returns:
            Dictionary containing:
                - is_ai: Boolean flag for AI-generated content
                - risk_score: Float 0.0-1.0
                - perplexity: Predictability metric
                - burstiness: Sentence length variance
                - artifacts: List of detected AI artifacts
                - details: Human-readable explanation
        """
        logger.info(f"🔬 Agent 1 analyzing text ({len(text)} chars)")
        
        # Validate input
        if not text or len(text.strip()) < 10:
            return {
                "is_ai": False,
                "risk_score": 0.0,
                "perplexity": 0,
                "burstiness": 0,
                "artifacts": [],
                "details": "Insufficient text for analysis (minimum 10 characters required)"
            }
        
        # Clean and tokenize text
        sentences = self._extract_sentences(text)
        
        if len(sentences) < 2:
            return {
                "is_ai": False,
                "risk_score": 0.0,
                "perplexity": 0,
                "burstiness": 0,
                "artifacts": [],
                "details": "Insufficient sentences for stylometric analysis (minimum 2 required)"
            }
        
        # Calculate metrics
        burstiness = self._calculate_burstiness(sentences)
        perplexity = self._estimate_perplexity(text, sentences)
        adversarial_analysis = self._detect_adversarial_patterns(text)
        
        # Compute final risk score
        risk_score = self._compute_risk_score(
            burstiness, 
            perplexity, 
            adversarial_analysis
        )
        
        # Determine if AI-generated
        is_ai = risk_score >= self.medium_risk_threshold
        
        # Build artifacts list
        artifacts = self._compile_artifacts(
            burstiness, 
            perplexity, 
            adversarial_analysis
        )
        
        # Generate human-readable explanation
        details = self._generate_explanation(
            is_ai, 
            risk_score, 
            burstiness, 
            perplexity, 
            adversarial_analysis
        )
        
        logger.info(f"✅ Agent 1 complete: AI={is_ai}, Risk={risk_score:.2f}")
        
        # Native Python floats only — np.float64 breaks FastAPI/Starlette JSON encoding (500).
        return {
            "is_ai": bool(is_ai),
            "risk_score": float(round(float(risk_score), 3)),
            "perplexity": float(round(float(perplexity), 2)),
            "burstiness": float(round(float(burstiness), 2)),
            "artifacts": list(artifacts),
            "details": details,
            "adversarial_detected": bool(adversarial_analysis["adversarial_detected"]),
            "adversarial_patterns": list(adversarial_analysis["patterns"]),
        }
    
    def _extract_sentences(self, text: str) -> list:
        """Split text into sentences using common delimiters."""
        # Split on sentence boundaries
        sentences = re.split(r'[.!?]+\s+', text)
        # Clean and filter
        sentences = [s.strip() for s in sentences if len(s.strip()) > 0]
        return sentences
    
    def _calculate_burstiness(self, sentences: list) -> float:
        """
        Calculate Burstiness: Variance in sentence length.
        
        AI-generated text typically has very uniform sentence lengths (LOW burstiness).
        Human text has more variation (HIGH burstiness).
        
        Formula: Standard deviation of word counts per sentence
        """
        sentence_lengths = [len(s.split()) for s in sentences]
        
        if len(sentence_lengths) <= 1:
            return 0.0
        
        # Calculate standard deviation as burstiness metric
        return float(np.std(sentence_lengths))
    
    def _estimate_perplexity(self, text: str, sentences: list) -> float:
        """
        Estimate Perplexity: How predictable the text is.
        
        Low perplexity = Predictable (AI)
        High perplexity = Unpredictable (Human)
        
        NOTE: This is a simplified heuristic. In production, use:
        - DistilRoBERTa-base for CPU (Prisha's local model)
        - DeBERTa-v3 for GPU/Cloud
        - Gemini API for enterprise
        
        Heuristic: Calculate based on vocabulary richness, sentence structure variance,
        and word pattern repetition
        """
        words = re.findall(r'\b\w+\b', text.lower())
        
        if len(words) == 0:
            return 0.0
        
        # Type-token ratio (vocabulary diversity)
        unique_words = len(set(words))
        total_words = len(words)
        ttr = unique_words / total_words if total_words > 0 else 0
        
        # Sentence structure variance (AI tends to repeat patterns)
        sentence_starts = [s.split()[0].lower() if s.split() else '' for s in sentences]
        unique_starts = len(set(sentence_starts))
        start_diversity = unique_starts / len(sentences) if len(sentences) > 0 else 1.0
        
        # Word length variance
        word_lengths = [len(w) for w in words]
        word_length_variance = float(np.std(word_lengths)) if len(word_lengths) > 1 else 0.0
        
        # Calculate perplexity estimate (scale 0-100)
        # Low TTR, low start diversity, low word variance = LOW perplexity (AI)
        # High values = HIGH perplexity (Human)
        perplexity_estimate = (
            (ttr * 30) +                           # Vocabulary richness
            (start_diversity * 30) +               # Sentence pattern diversity
            (word_length_variance * 4)             # Word length variance
        )
        
        # Penalize for repetitive patterns (AI signature)
        if ttr < 0.5:  # More than 50% repeated words
            perplexity_estimate *= 0.7
        if start_diversity < 0.5:  # More than 50% repeated sentence starts
            perplexity_estimate *= 0.7
        
        return float(perplexity_estimate)
    
    def _detect_adversarial_patterns(self, text: str) -> Dict[str, Any]:
        """
        Detect adversarial obfuscation attempts (FR-02).
        
        Common tactics:
        - Leetspeak: 3l3cti0n, h4ck3r
        - Symbol substitution: @dmin, p@ssword
        - Zero-width characters
        - Excessive punctuation
        """
        patterns_detected = []
        
        # Pattern 1: Leetspeak detection (numbers mixed with letters)
        leetspeak_pattern = r'\b\w*[0-9]\w*[a-zA-Z]\w*[0-9]\w*\b'
        if re.search(leetspeak_pattern, text):
            patterns_detected.append("Leetspeak obfuscation")
        
        # Pattern 2: Symbol substitution in common words
        symbol_substitution = r'[@$!]\w{2,}'
        if re.search(symbol_substitution, text):
            patterns_detected.append("Symbol substitution")
        
        # Pattern 3: Excessive special characters
        special_char_ratio = len(re.findall(r'[^a-zA-Z0-9\s.,!?;:\'\"-]', text)) / len(text) if len(text) > 0 else 0
        if special_char_ratio > 0.1:  # More than 10% special chars
            patterns_detected.append("Excessive special characters")
        
        # Pattern 4: Repeated character patterns (e.g., "aaaaa", "!!!!!")
        repeated_chars = r'(.)\1{4,}'
        if re.search(repeated_chars, text):
            patterns_detected.append("Character repetition")
        
        # Pattern 5: Mixed case obfuscation (e.g., "eLeCTioN")
        mixed_case_words = re.findall(r'\b[a-z]+[A-Z]+[a-z]+\b', text)
        if len(mixed_case_words) > 2:
            patterns_detected.append("Mixed case obfuscation")
        
        return {
            "adversarial_detected": len(patterns_detected) > 0,
            "patterns": patterns_detected,
            "severity": "high" if len(patterns_detected) >= 2 else "medium" if len(patterns_detected) == 1 else "low"
        }
    
    def _compute_risk_score(
        self, 
        burstiness: float, 
        perplexity: float, 
        adversarial_analysis: Dict[str, Any]
    ) -> float:
        """
        Compute overall risk score combining all factors.
        
        Score breakdown:
        - Burstiness: 50% weight (primary indicator)
        - Perplexity: 35% weight  
        - Adversarial patterns: 15% weight
        
        Returns: Float 0.0 (Human) to 1.0 (AI)
        """
        # Burstiness component (inverse - lower burstiness = higher AI risk)
        # This is the PRIMARY indicator of AI-generated content
        burstiness_score = 0.0
        if burstiness < 1.0:
            burstiness_score = 1.0  # Extremely uniform = Certain AI
        elif burstiness < 2.0:
            burstiness_score = 0.85  # Very uniform = High AI risk
        elif burstiness < 3.0:
            burstiness_score = 0.65  # Somewhat uniform = Moderate AI risk
        elif burstiness < 5.0:
            burstiness_score = 0.35  # Some variance = Low AI risk
        else:
            burstiness_score = 0.1  # High variance = Human
        
        # Perplexity component (inverse - lower perplexity = higher AI risk)
        # Adjusted thresholds for more realistic scoring
        perplexity_score = 0.0
        if perplexity < 15:
            perplexity_score = 0.8  # Very predictable = High AI risk
        elif perplexity < 25:
            perplexity_score = 0.6  # Somewhat predictable = Moderate AI risk
        elif perplexity < 35:
            perplexity_score = 0.4  # Moderate complexity
        elif perplexity < 50:
            perplexity_score = 0.2  # Good complexity = Low AI risk
        else:
            perplexity_score = 0.1  # High complexity = Human
        
        # Adversarial component
        adversarial_score = 0.0
        if adversarial_analysis["adversarial_detected"]:
            # Adversarial patterns suggest intentional obfuscation (boost risk)
            adversarial_score = 0.9 if adversarial_analysis["severity"] == "high" else 0.6
        
        # Weighted combination (Burstiness gets higher weight as it's more reliable)
        risk_score = (
            burstiness_score * 0.50 +
            perplexity_score * 0.35 +
            adversarial_score * 0.15
        )
        
        return min(1.0, max(0.0, risk_score))
    
    def _compile_artifacts(
        self, 
        burstiness: float, 
        perplexity: float, 
        adversarial_analysis: Dict[str, Any]
    ) -> list:
        """Compile list of detected AI artifacts."""
        artifacts = []
        
        if burstiness < 2.0:
            artifacts.append("Extremely low sentence variance (AI signature)")
        elif burstiness < 3.0:
            artifacts.append("Low sentence variance")
        elif burstiness >= 6.0:
            artifacts.append("High sentence variance (Human signature)")
        
        if perplexity < 10:
            artifacts.append("Very low perplexity (highly predictable)")
        elif perplexity < 15:
            artifacts.append("Low perplexity (predictable patterns)")
        
        if adversarial_analysis["adversarial_detected"]:
            artifacts.extend(adversarial_analysis["patterns"])
        
        if not artifacts:
            artifacts.append("Normal variance and complexity")
        
        return artifacts
    
    def _generate_explanation(
        self, 
        is_ai: bool, 
        risk_score: float, 
        burstiness: float, 
        perplexity: float, 
        adversarial_analysis: Dict[str, Any]
    ) -> str:
        """Generate human-readable explanation of the analysis."""
        
        if risk_score >= self.high_risk_threshold:
            severity = "HIGH RISK"
        elif risk_score >= self.medium_risk_threshold:
            severity = "MEDIUM RISK"
        else:
            severity = "LOW RISK"
        
        explanation = f"{severity} - "
        
        if is_ai:
            explanation += f"Content exhibits AI-generated characteristics. "
            explanation += f"Burstiness={burstiness:.2f} (threshold: {self.burstiness_threshold}), "
            explanation += f"Perplexity={perplexity:.2f}. "
            
            if burstiness < self.burstiness_threshold:
                explanation += "Sentences show unusually uniform length patterns typical of LLMs. "
            
            if perplexity < 15:
                explanation += "Text exhibits high predictability. "
            
            if adversarial_analysis["adversarial_detected"]:
                explanation += f"ALERT: Adversarial obfuscation detected ({', '.join(adversarial_analysis['patterns'])}). "
        else:
            explanation += f"Content appears human-authored. "
            explanation += f"Burstiness={burstiness:.2f}, Perplexity={perplexity:.2f}. "
            explanation += "Natural variation in sentence structure and vocabulary. "
        
        return explanation


def detect_adversarial_patterns(text: str) -> Dict[str, Any]:
    """
    Standalone utility for adversarial pattern detection (FR-02).
    Can be used independently from the ForensicInvestigator class.
    
    Detects:
    - Leetspeak (3l3cti0n, h4ck3r)
    - Symbol substitution (@dmin, p@ssword)
    - Excessive special characters
    - Character repetition
    - Mixed case obfuscation
    
    Returns:
        adversarial_detected: bool
        patterns: list of detected pattern types
        severity: high/medium/low
    """
    patterns_detected = []
    
    # Pattern 1: Leetspeak detection (numbers mixed with letters in suspicious ways)
    leetspeak_pattern = r'\b\w*[0-9]\w*[a-zA-Z]\w*[0-9]\w*\b'
    leetspeak_matches = re.findall(leetspeak_pattern, text)
    if leetspeak_matches:
        patterns_detected.append(f"Leetspeak detected: {', '.join(leetspeak_matches[:3])}")
    
    # Pattern 2: Symbol substitution in common words
    symbol_substitution = r'[@$!]\w{2,}'
    symbol_matches = re.findall(symbol_substitution, text)
    if symbol_matches:
        patterns_detected.append(f"Symbol substitution: {', '.join(symbol_matches[:3])}")
    
    # Pattern 3: Excessive special characters
    special_char_ratio = len(re.findall(r'[^a-zA-Z0-9\s.,!?;:\'\"-]', text)) / len(text) if len(text) > 0 else 0
    if special_char_ratio > 0.1:  # More than 10% special chars
        patterns_detected.append(f"Excessive special characters ({special_char_ratio*100:.1f}%)")
    
    # Pattern 4: Repeated character patterns
    repeated_chars = re.findall(r'(.)\1{4,}', text)
    if repeated_chars:
        patterns_detected.append(f"Character repetition: {len(repeated_chars)} instance(s)")
    
    # Pattern 5: Mixed case obfuscation (e.g., "eLeCTioN")
    mixed_case_words = re.findall(r'\b[a-z]+[A-Z]+[a-z]+\b', text)
    if len(mixed_case_words) > 2:
        patterns_detected.append(f"Mixed case obfuscation: {', '.join(mixed_case_words[:3])}")
    
    # Determine severity
    severity = "low"
    if len(patterns_detected) >= 3:
        severity = "high"
    elif len(patterns_detected) >= 1:
        severity = "medium"
    
    return {
        "adversarial_detected": len(patterns_detected) > 0,
        "patterns": patterns_detected,
        "severity": severity
    }


# Global instance for easy import
forensic_investigator = ForensicInvestigator()

