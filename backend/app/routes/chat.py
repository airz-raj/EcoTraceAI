"""
EcoTrace AI — AI Chatbot Routes

POST /api/chat — Conversational AI assistant for carbon footprint guidance.

Supports two modes:
1. Gemini LLM (when GEMINI_API_KEY is set) — full conversational AI
2. Smart Rule-Based engine (default) — 100% free, open source
"""

import hashlib
import logging
import os
from functools import lru_cache
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger("ecotrace.chat")
router = APIRouter()

# ─── Constants ─────────────────────────────────────────────────

MAX_MESSAGE_LENGTH = 2000
MAX_HISTORY_LENGTH = 20

# ─── Gemini Client (optional) ─────────────────────────────────

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
_gemini_client = None

if GEMINI_API_KEY:
    try:
        import google.genai as genai
        from google.genai import types

        _gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info("Gemini AI client initialized successfully")
    except ImportError:
        logger.warning("google-genai not installed; falling back to rule-based mode")


# ─── Request / Response Schemas ───────────────────────────────

class ChatMessage(BaseModel):
    """A single message in the chat conversation."""
    role: str = Field(..., pattern=r"^(user|model)$", description="Message sender role")
    content: str = Field(
        ...,
        min_length=1,
        max_length=MAX_MESSAGE_LENGTH,
        description="Message content text",
    )


class ChatContextData(BaseModel):
    """Optional contextual data about the user's carbon footprint."""
    totalEmissionsKg: Optional[float] = None
    breakdown: Optional[dict[str, float]] = None
    info: Optional[str] = None


class ChatRequest(BaseModel):
    """Incoming chat request with message history and optional context."""
    messages: list[ChatMessage] = Field(
        ...,
        min_length=1,
        max_length=MAX_HISTORY_LENGTH,
        description="Conversation history",
    )
    contextData: Optional[ChatContextData] = None


class ChatResponse(BaseModel):
    """Chat response with the assistant's reply and source attribution."""
    response: str
    source: str = Field(
        ...,
        description="Which engine produced the response: 'gemini' or 'smart-rules'",
    )


# ─── System Prompt ─────────────────────────────────────────────

SYSTEM_PROMPT = """You are the EcoTrace AI Assistant. You help users understand \
their carbon footprint, explain the EcoTrace dashboard, and provide actionable \
tips to reduce emissions based on the Impact Hub methodologies.
Keep your responses concise, encouraging, and friendly. Use markdown for formatting. \
Focus on the Paris Agreement target (2.3t CO₂/year) and actionable lifestyle swaps.

User Context Data:
{context_data}
"""

# ─── Rule-Based Response Cache ─────────────────────────────────

_rule_cache: dict[str, str] = {}


def _cache_key(message: str) -> str:
    """Generate a cache key from the lowercase message."""
    return hashlib.md5(message.lower().strip().encode()).hexdigest()


@lru_cache(maxsize=128)
def _match_rule_category(message_lower: str) -> str:
    """
    Classify user message into a response category.

    Uses keyword matching with priority ordering.
    Results are cached with LRU for repeated queries.
    """
    if any(w in message_lower for w in ("improve", "reduce", "performance", "better", "lower", "tips", "save")):
        return "reduce"
    if any(w in message_lower for w in ("dashboard", "explain", "how", "what is this", "chart", "summary")):
        return "dashboard"
    if any(w in message_lower for w in ("impact", "hub", "paris", "agreement", "challenge", "budget")):
        return "impact"
    if any(w in message_lower for w in ("hello", "hi", "hey", "good morning", "good evening")):
        return "greeting"
    return "fallback"


# ─── Rule-Based Responses ─────────────────────────────────────

RULE_RESPONSES: dict[str, str] = {
    "reduce": """### 🚀 How to Reduce Your Carbon Footprint
Here are the most effective ways to improve your performance based on our Impact Hub:
1. **Transport:** Switch to public transit or carpooling. Just replacing a 15km daily solo drive with a bus ride saves ~1,200kg CO₂ a year.
2. **Food:** Adopt a plant-rich diet. Replacing beef with chicken or legumes for just two meals a week cuts food emissions by 30%.
3. **Energy:** Optimize your AC (set to 24-26°C) and switch to LED bulbs. If possible, opt-in to a green energy tariff with your provider.
4. **Digital:** Turn on power-saving modes on your devices and unsubscribe from unnecessary newsletters.

Check out the **What-If Scenario Planner** in the Impact Hub to see how these changes impact your specific footprint!""",

    "dashboard": """### 📊 Understanding Your Dashboard
Your dashboard is your central command center:
- **Carbon Summary Card:** Shows your total emissions, your current tier (e.g., Eco Warrior), and how you compare to the national average.
- **Eco Streak Calendar:** The GitHub-style heatmap tracks your daily sustainable actions. Small things make big changes—try to keep your streak alive!
- **Trend & Category Charts:** Visualizes exactly where your emissions come from (Transport, Food, Energy, etc.) so you know what to target.
- **AI Recommendations:** Highlights low-hanging fruit for reducing emissions based on your specific data.""",

    "impact": """### 🌍 The Impact Hub
The Impact Hub connects your personal actions to global climate goals:
- **Carbon Budget Gauge:** Compares your footprint against the Paris Agreement target of **2.3t CO₂ per year** (the per-capita limit needed to keep warming below 1.5°C).
- **Collective Impact Amplifier:** Shows the massive scale of change if 10,000 or 1,000,000 people adopted your lifestyle swaps.
- **90-Day Challenge:** A structured weekly roadmap to systematically lower your emissions over 3 months.""",

    "greeting": "Hello! 👋 I'm your EcoTrace Assistant. You can ask me how to **reduce your carbon footprint**, ask for an **explanation of the Dashboard**, or learn more about the **Impact Hub**. How can I help you today?",

    "fallback": (
        "I'm your EcoTrace assistant! Since I'm currently running in 100% open-source mode, "
        "I specialize in a few specific topics. Try asking me:\n"
        "- *How can I reduce my carbon footprint?*\n"
        "- *Can you explain the dashboard?*\n"
        "- *What is the Impact Hub?*\n\n"
        "(Note: Developers can unlock my full conversational LLM capabilities by setting a `GEMINI_API_KEY`!)"
    ),
}


# ─── Endpoint ──────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest) -> ChatResponse:
    """
    Process a chat message and return an AI-generated response.

    Falls back gracefully from Gemini LLM to rule-based engine.
    """
    if not req.messages:
        raise HTTPException(status_code=400, detail="Messages cannot be empty")

    context_str = str(req.contextData.model_dump()) if req.contextData else "No specific data provided."
    sys_prompt = SYSTEM_PROMPT.format(context_data=context_str)

    # ── Try Gemini LLM if available ───────────────────────
    if _gemini_client:
        try:
            from google.genai import types

            contents = []
            for msg in req.messages[:-1]:
                role = "user" if msg.role == "user" else "model"
                contents.append(
                    types.Content(role=role, parts=[types.Part.from_text(text=msg.content)])
                )

            latest_msg = req.messages[-1].content

            response = _gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents + [latest_msg],
                config=types.GenerateContentConfig(
                    system_instruction=sys_prompt,
                    temperature=0.7,
                ),
            )
            logger.info("Chat response generated via Gemini LLM")
            return ChatResponse(response=response.text, source="gemini")
        except Exception:
            logger.exception("Gemini API error; falling back to rule-based engine")

    # ── Smart Rule-Based Engine (100% Free) ───────────────
    last_user_msg = req.messages[-1].content.lower()

    # Check cache first
    key = _cache_key(last_user_msg)
    if key in _rule_cache:
        logger.debug("Chat cache hit for key %s", key)
        return ChatResponse(response=_rule_cache[key], source="smart-rules")

    # Classify and respond
    category = _match_rule_category(last_user_msg)
    response_text = RULE_RESPONSES[category]

    # Cache the result
    _rule_cache[key] = response_text
    logger.info("Chat response generated via smart-rules (category: %s)", category)

    return ChatResponse(response=response_text, source="smart-rules")
