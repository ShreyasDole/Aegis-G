"""
Policy Guardian Service - Agent 4
Automated Mitigation: Translates human intent into executable DSL rules
Uses google-genai with structured output
"""
import os
import json
from typing import Dict, Any, Optional, List
from google import genai
from google.genai import types
from app.config import settings

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


class PolicyGuardian:
    """
    Agent 4: Policy Guardian
    Translates natural language policy intent into executable DSL rules
    """
    
    @staticmethod
    async def translate_intent_to_rule(human_intent: str) -> Dict[str, Any]:
        """
        Translate human strategic intent into executable DSL logic
        
        Uses Gemini 3 Pro with Thinking to analyze edge cases and refine rules
        """
        system_instructions = """
        You are the Policy Guardian (Agent 4) of Project Aegis.
        Your job is to translate human strategic intent into executable logic for the defense grid.
        
        DSL SYNTAX:
        - IF <condition> THEN <action>
        - Conditions: 
          * narrative_match("text") - matches narrative keywords
          * ai_score > X - forensic AI detection score
          * graph_cluster_size > X - network cluster size
          * contains(field, "text") - text contains substring
          * equals(field, value) - exact match
          * greater_than(field, value) - numeric comparison
        - Actions:
          * BLOCK_AND_LOG - block content and log to audit
          * FLAG_THREAT(severity) - flag as threat with severity level
          * ALERT(target) - send alert to target
          * LOG_ONLY - log without blocking
        
        THINKING PROCESS:
        - Consider edge cases: If user says "Block all AI text", should technical reports be blocked?
        - Refine rules to avoid false positives
        - Consider the balance between security and legitimate content
        - Think about how this rule interacts with existing policies
        
        OUTPUT SCHEMA:
        {
          "rule_name": "string (e.g., rule_04.aegis)",
          "dsl_logic": "string (executable DSL code)",
          "safety_score": 0.0-1.0 (confidence in rule correctness),
          "edge_cases": ["list of potential edge cases considered"],
          "explanation": "brief explanation of the rule logic",
          "ai_reasoning": "internal thinking process (for audit)"
        }
        """
        
        if not client:
            return {
                "rule_name": "rule_error",
                "dsl_logic": "# Error: GEMINI_API_KEY not configured",
                "safety_score": 0.0,
                "edge_cases": [],
                "explanation": "API key not configured",
                "ai_reasoning": ""
            }
        
        user_prompt = f"""
        Translate this human strategic intent into a Shield Rule:
        
        INTENT: "{human_intent}"
        
        Use your internal 'Thinking' process to:
        1. Analyze the intent for edge cases
        2. Refine the rule to minimize false positives
        3. Consider interactions with existing policies
        4. Generate executable DSL code
        
        Return structured JSON matching the output schema.
        """
        
        try:
            config_kwargs = dict(
                system_instruction=system_instructions,
                response_mime_type="application/json",
            )
            if hasattr(types, "ThinkingConfig") and "thinking" in getattr(settings, "GEMINI_PRO_MODEL", "").lower():
                config_kwargs["thinking_config"] = types.ThinkingConfig(include_thoughts=True)

            response = client.models.generate_content(
                model=settings.GEMINI_PRO_MODEL,
                contents=user_prompt,
                config=types.GenerateContentConfig(**config_kwargs)
            )
            
            # Extract thinking process for audit (if model supports it)
            ai_reasoning = ""
            if response.candidates:
                for part in getattr(response.candidates[0].content, "parts", []):
                    if getattr(part, "thought", None):
                        ai_reasoning += getattr(part, "text", "") or str(getattr(part, "thought", ""))
            
            # Parse JSON response
            result_text = response.text
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            
            result = json.loads(result_text)
            
            # Add AI reasoning to result
            result["ai_reasoning"] = ai_reasoning
            
            return result
            
        except Exception as e:
            return {
                "rule_name": "rule_error",
                "dsl_logic": f"# Translation error: {str(e)}",
                "safety_score": 0.0,
                "edge_cases": [],
                "explanation": f"Failed to translate policy: {str(e)}",
                "ai_reasoning": ""
            }
    
    @staticmethod
    def execute_dsl_rule(dsl_logic: str, post_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute DSL rule against a post with enhanced parsing
        
        Supports:
        - IF condition THEN action
        - AND, OR, NOT operators
        - Multiple conditions
        - Complex comparisons
        
        Returns:
        {
            "should_block": bool,
            "action": str,
            "reason": str,
            "matched_conditions": List[str]
        }
        """
        import re
        from typing import List, Tuple
        
        try:
            dsl_upper = dsl_logic.upper().strip()
            
            if "IF" not in dsl_upper or "THEN" not in dsl_upper:
                return {
                    "should_block": False,
                    "action": "PASS",
                    "reason": "Invalid DSL syntax: missing IF or THEN",
                    "matched_conditions": []
                }
            
            # Extract action
            action_match = re.search(r'THEN\s+(\w+(?:_\w+)*)', dsl_upper)
            if not action_match:
                return {
                    "should_block": False,
                    "action": "PASS",
                    "reason": "Invalid DSL syntax: no action specified",
                    "matched_conditions": []
                }
            
            action = action_match.group(1)
            
            # Extract condition part
            condition_part = re.search(r'IF\s+(.+?)\s+THEN', dsl_upper, re.DOTALL)
            if not condition_part:
                return {
                    "should_block": False,
                    "action": "PASS",
                    "reason": "Invalid DSL syntax: no condition specified",
                    "matched_conditions": []
                }
            
            condition_str = condition_part.group(1).strip()
            
            # Parse conditions with AND/OR logic
            def evaluate_condition(cond: str) -> Tuple[bool, str]:
                """Evaluate a single condition"""
                cond = cond.strip()
                
                # narrative_match("keyword")
                if 'narrative_match(' in cond.lower():
                    match = re.search(r'narrative_match\("([^"]+)"\)', cond, re.IGNORECASE)
                    if match:
                        keyword = match.group(1)
                        content = post_data.get("content", "").lower()
                        matched = keyword.lower() in content
                        return matched, f"narrative_match('{keyword}')" if matched else None
                
                # contains(field, "value")
                if 'contains(' in cond.lower():
                    match = re.search(r'contains\s*\(\s*(\w+)\s*,\s*"([^"]+)"\s*\)', cond, re.IGNORECASE)
                    if match:
                        field, value = match.group(1), match.group(2)
                        field_value = str(post_data.get(field, "")).lower()
                        matched = value.lower() in field_value
                        return matched, f"contains({field}, '{value}')" if matched else None
                
                # ai_score > X, ai_score >= X, ai_score < X, etc.
                if 'ai_score' in cond.lower():
                    ai_score = post_data.get("ai_score", 0.0)
                    for op in ['>=', '<=', '>', '<', '==', '!=']:
                        match = re.search(r'ai_score\s*' + re.escape(op) + r'\s*([\d.]+)', cond, re.IGNORECASE)
                        if match:
                            threshold = float(match.group(1))
                            matched = False
                            if op == '>': matched = ai_score > threshold
                            elif op == '>=': matched = ai_score >= threshold
                            elif op == '<': matched = ai_score < threshold
                            elif op == '<=': matched = ai_score <= threshold
                            elif op == '==': matched = abs(ai_score - threshold) < 0.001
                            elif op == '!=': matched = abs(ai_score - threshold) >= 0.001
                            return matched, f"ai_score {op} {threshold}" if matched else None
                
                # graph_cluster_size > X
                if 'graph_cluster_size' in cond.lower():
                    cluster_size = post_data.get("graph_cluster_size", 0)
                    for op in ['>=', '<=', '>', '<', '==', '!=']:
                        match = re.search(r'graph_cluster_size\s*' + re.escape(op) + r'\s*(\d+)', cond, re.IGNORECASE)
                        if match:
                            threshold = int(match.group(1))
                            matched = False
                            if op == '>': matched = cluster_size > threshold
                            elif op == '>=': matched = cluster_size >= threshold
                            elif op == '<': matched = cluster_size < threshold
                            elif op == '<=': matched = cluster_size <= threshold
                            elif op == '==': matched = cluster_size == threshold
                            elif op == '!=': matched = cluster_size != threshold
                            return matched, f"graph_cluster_size {op} {threshold}" if matched else None
                
                # equals(field, value)
                if 'equals(' in cond.lower():
                    match = re.search(r'equals\s*\(\s*(\w+)\s*,\s*"([^"]+)"\s*\)', cond, re.IGNORECASE)
                    if match:
                        field, value = match.group(1), match.group(2)
                        field_value = str(post_data.get(field, ""))
                        matched = field_value == value
                        return matched, f"equals({field}, '{value}')" if matched else None
                
                return False, None
            
            # Parse with AND/OR logic
            def parse_and_evaluate(expr: str) -> Tuple[bool, List[str]]:
                """Parse expression with AND/OR operators"""
                matched_conditions = []
                
                # Handle NOT operator
                if expr.strip().startswith('NOT'):
                    inner = expr[3:].strip().strip('()')
                    result, cond = evaluate_condition(inner)
                    return not result, [f"NOT {cond}"] if cond else []
                
                # Split by OR first (lower precedence)
                or_parts = re.split(r'\s+OR\s+', expr, flags=re.IGNORECASE)
                if len(or_parts) > 1:
                    # OR logic: any part true
                    for part in or_parts:
                        part_result, part_conds = parse_and_evaluate(part.strip())
                        if part_result:
                            matched_conditions.extend(part_conds)
                            return True, matched_conditions
                    return False, []
                
                # Split by AND
                and_parts = re.split(r'\s+AND\s+', expr, flags=re.IGNORECASE)
                if len(and_parts) > 1:
                    # AND logic: all parts must be true
                    all_true = True
                    for part in and_parts:
                        part_result, part_conds = parse_and_evaluate(part.strip())
                        if part_result:
                            matched_conditions.extend(part_conds)
                        else:
                            all_true = False
                    return all_true, matched_conditions
                
                # Single condition
                result, cond = evaluate_condition(expr)
                if result and cond:
                    matched_conditions.append(cond)
                return result, matched_conditions
            
            # Evaluate the condition
            condition_result, matched_conditions = parse_and_evaluate(condition_str)
            
            # Determine if should block
            should_block = condition_result and action in ["BLOCK_AND_LOG", "BLOCK"]
            
            return {
                "should_block": should_block,
                "action": action if condition_result else "PASS",
                "reason": f"Matched conditions: {', '.join(matched_conditions)}" if matched_conditions else "No conditions met",
                "matched_conditions": matched_conditions
            }
            
        except Exception as e:
            import traceback
            return {
                "should_block": False,
                "action": "ERROR",
                "reason": f"DSL execution error: {str(e)}",
                "matched_conditions": []
            }


# Singleton instance
policy_guardian = PolicyGuardian()

