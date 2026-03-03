"""
AI Chat Service (AI Manager)
Context-aware chatbot with tool execution capabilities
"""
import os
import uuid
from typing import List, Dict, Optional
from google import genai
from sqlalchemy.orm import Session
from app.config import settings

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


SYSTEM_PROMPT = """
You are Aegis AI, a cybersecurity assistant for the Aegis-G threat intelligence platform.

Context:
- You help analysts investigate threats, analyze patterns, and respond to security incidents
- You have access to tools for querying threat data, generating reports, and running analyses
- Always prioritize security and accuracy over speed

Available Tools:
1. search_threats(query, limit) - Search for threats matching criteria
2. get_threat_details(threat_id) - Get full details of a specific threat
3. generate_report(threat_ids) - Generate analysis report for threats
4. analyze_pattern(data_points) - Detect patterns in threat data
5. check_ioc(indicator) - Check if indicator is known malicious

Instructions:
- Be concise but informative
- When asked about threats, use the search_threats tool
- Provide actionable recommendations
- Format responses clearly with bullet points or numbered lists when appropriate
- If you need more context, ask clarifying questions

Current Context:
{context}

User's message: {message}
"""


class ChatService:
    """Service for AI-powered chat with tool execution"""
    
    def __init__(self):
        self.conversations: Dict[str, List[Dict]] = {}
    
    async def chat(
        self,
        message: str,
        context: Optional[Dict] = None,
        conversation_id: Optional[str] = None,
        use_tools: bool = True,
        db: Optional[Session] = None
    ) -> Dict:
        """
        Process chat message and return response
        """
        # Generate or use existing conversation ID
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
        
        # Get conversation history
        history = self.conversations.get(conversation_id, [])
        
        # Format context
        context_str = "None"
        if context:
            context_str = f"Current Page: {context.get('page', 'unknown')}"
            if context.get('selected_items'):
                context_str += f"\nSelected Items: {context.get('selected_items')}"
        
        # Build full prompt
        full_prompt = SYSTEM_PROMPT.format(
            context=context_str,
            message=message
        )
        
        # Add conversation history
        messages = []
        for msg in history[-10:]:  # Last 10 messages
            messages.append({"role": msg["role"], "parts": [msg["content"]]})
        messages.append({"role": "user", "parts": [full_prompt]})
        
        # Generate response
        if not client:
            response_text = self._get_demo_response(message)
            tool_calls = None
        else:
            try:
                # Check if tools should be used
                if use_tools and db:
                    response_text, tool_calls = await self._chat_with_tools(messages, db)
                else:
                    contents = [{"role": m["role"], "parts": [{"text": m["parts"][0]}]} for m in messages]
                    response = client.models.generate_content(
                        model=settings.GEMINI_FLASH_MODEL,
                        contents=contents
                    )
                    response_text = response.text
                    tool_calls = None
                    
            except Exception as e:
                response_text = f"I apologize, but I encountered an error: {str(e)}\n\nPlease try again or rephrase your question."
                tool_calls = None
        
        # Update conversation history
        history.append({"role": "user", "content": message})
        history.append({"role": "assistant", "content": response_text})
        self.conversations[conversation_id] = history
        
        # Generate quick action suggestions
        suggestions = self._generate_suggestions(message, context)
        
        return {
            "message": response_text,
            "conversation_id": conversation_id,
            "tool_calls": tool_calls,
            "suggestions": suggestions
        }
    
    async def _chat_with_tools(self, messages, db: Session) -> tuple[str, Optional[List]]:
        """
        Chat with tool execution capability
        """
        # Available tools for reference (not used in demo implementation)
        _tools = [
            {
                "name": "search_threats",
                "description": "Search for threats in the database",
                "parameters": {
                    "query": "string",
                    "limit": "integer (default 10)"
                }
            },
            {
                "name": "get_threat_details",
                "description": "Get full details of a specific threat",
                "parameters": {
                    "threat_id": "integer"
                }
            }
        ]
        
        # For now, simple response without actual tool execution
        # In production, this would use Gemini's function calling
        contents = [{"role": m["role"], "parts": [{"text": m["parts"][0]}]} for m in messages]
        response = client.models.generate_content(
            model=settings.GEMINI_FLASH_MODEL,
            contents=contents
        )
        return response.text, None
    
    def _get_demo_response(self, message: str) -> str:
        """Demo responses when no API key"""
        message_lower = message.lower()
        
        if "threat" in message_lower or "attack" in message_lower:
            return """I can help you investigate threats. Based on recent activity:

• **45 threats detected** in the last 24 hours
• **12 high-risk** incidents requiring immediate attention  
• **3 attack patterns** identified from Eastern Europe

Would you like me to:
1. Show details of high-risk threats
2. Generate a full threat analysis report
3. Search for specific threat indicators"""
        
        elif "help" in message_lower or "what can you" in message_lower:
            return """I'm Aegis AI, your cybersecurity assistant. I can help with:

🔍 **Threat Investigation**
• Search and analyze threat data
• Identify attack patterns
• Track threat actors

📊 **Reports & Analysis**
• Generate forensic reports
• Analyze trends and anomalies
• Risk assessment

🛡️ **Recommendations**
• Security policy suggestions
• Incident response guidance
• Remediation steps

Just ask me anything about threats, policies, or system security!"""
        
        else:
            return f"""I understand you're asking about: "{message}"

In the current system, I can help you analyze threats, generate reports, and provide security recommendations. 

Could you clarify what specific information you need? For example:
• Details about a specific threat
• Recent security trends
• Policy recommendations"""
    
    def _generate_suggestions(self, message: str, context: Optional[Dict]) -> List[str]:
        """Generate quick action suggestions based on context"""
        suggestions = []
        
        message_lower = message.lower()
        
        if "threat" in message_lower:
            suggestions = [
                "Show high-risk threats",
                "Generate threat report",
                "Analyze attack patterns"
            ]
        elif "policy" in message_lower:
            suggestions = [
                "Create new policy",
                "Review active policies",
                "Check policy conflicts"
            ]
        elif "report" in message_lower:
            suggestions = [
                "Generate forensic report",
                "Export data to CSV",
                "Share with team"
            ]
        else:
            suggestions = [
                "Show recent activity",
                "System health check",
                "Security recommendations"
            ]
        
        return suggestions[:3]  # Max 3 suggestions
    
    def clear_conversation(self, conversation_id: str):
        """Clear conversation history"""
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]


# Global instance
chat_service = ChatService()

