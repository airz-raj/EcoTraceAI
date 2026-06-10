import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import google.genai as genai
from google.genai import types

router = APIRouter()

# Initialize Gemini Client if API key is present
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    contextData: Optional[dict] = None

class ChatResponse(BaseModel):
    response: str
    source: str

SYSTEM_PROMPT = """You are the EcoTrace AI Assistant. You help users understand their carbon footprint, explain the EcoTrace dashboard, and provide actionable tips to reduce emissions based on the Impact Hub methodologies.
Keep your responses concise, encouraging, and friendly. Use markdown for formatting. Focus on the Paris Agreement target (2.3t CO2/year) and actionable lifestyle swaps.

User Context Data:
{context_data}
"""

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    if not req.messages:
        raise HTTPException(status_code=400, detail="Messages cannot be empty")

    context_str = str(req.contextData) if req.contextData else "No specific data provided."
    sys_prompt = SYSTEM_PROMPT.format(context_data=context_str)

    # Use actual Gemini model if API key is configured
    if client:
        try:
            # Build history
            contents = []
            for msg in req.messages[:-1]:
                role = "user" if msg.role == "user" else "model"
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.content)]))
            
            latest_msg = req.messages[-1].content
            
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=contents + [latest_msg],
                config=types.GenerateContentConfig(
                    system_instruction=sys_prompt,
                    temperature=0.7,
                )
            )
            return ChatResponse(response=response.text, source="gemini")
        except Exception as e:
            print(f"Gemini API Error: {e}")
            # Fallback to simulated response
            pass

    # Smart Rule-Based Eco Assistant (Open Source, 100% Free)
    last_user_msg = req.messages[-1].content.lower()
    
    response_text = ""
    
    if any(word in last_user_msg for word in ["improve", "reduce", "performance", "better", "lower"]):
        response_text = """### 🚀 How to Reduce Your Carbon Footprint
Here are the most effective ways to improve your performance based on our Impact Hub:
1. **Transport:** Switch to public transit or carpooling. Just replacing a 15km daily solo drive with a bus ride saves ~1,200kg CO₂ a year.
2. **Food:** Adopt a plant-rich diet. Replacing beef with chicken or legumes for just two meals a week cuts food emissions by 30%.
3. **Energy:** Optimize your AC (set to 24-26°C) and switch to LED bulbs. If possible, opt-in to a green energy tariff with your provider.
4. **Digital:** Turn on power-saving modes on your devices and unsubscribe from unnecessary newsletters.

Check out the **What-If Scenario Planner** in the Impact Hub to see how these changes impact your specific footprint!"""
        
    elif any(word in last_user_msg for word in ["dashboard", "explain", "how", "what is this"]):
        response_text = """### 📊 Understanding Your Dashboard
Your dashboard is your central command center:
- **Carbon Summary Card:** Shows your total emissions, your current tier (e.g., Eco Warrior), and how you compare to the national average.
- **Eco Streak Calendar:** The GitHub-style heatmap tracks your daily sustainable actions. Small things make big changes—try to keep your streak alive!
- **Trend & Category Charts:** Visualizes exactly where your emissions come from (Transport, Food, Energy, etc.) so you know what to target.
- **AI Recommendations:** Highlights low-hanging fruit for reducing emissions based on your specific data."""
        
    elif any(word in last_user_msg for word in ["impact", "hub", "paris", "agreement", "challenge"]):
        response_text = """### 🌍 The Impact Hub
The Impact Hub connects your personal actions to global climate goals:
- **Carbon Budget Gauge:** Compares your footprint against the Paris Agreement target of **2.3t CO₂ per year** (the per-capita limit needed to keep warming below 1.5°C).
- **Collective Impact Amplifier:** Shows the massive scale of change if 10,000 or 1,000,000 people adopted your lifestyle swaps.
- **90-Day Challenge:** A structured weekly roadmap to systematically lower your emissions over 3 months."""
        
    elif "hello" in last_user_msg or "hi" in last_user_msg or "hey" in last_user_msg:
        response_text = "Hello! 👋 I'm your EcoTrace Assistant. You can ask me how to **reduce your carbon footprint**, ask for an **explanation of the Dashboard**, or learn more about the **Impact Hub**. How can I help you today?"
        
    else:
        response_text = ("I'm your EcoTrace assistant! Since I'm currently running in 100% open-source mode, "
                         "I specialize in a few specific topics. Try asking me:\n"
                         "- *How can I reduce my carbon footprint?*\n"
                         "- *Can you explain the dashboard?*\n"
                         "- *What is the Impact Hub?*\n\n"
                         "(Note: Developers can unlock my full conversational LLM capabilities by setting a `GEMINI_API_KEY`!)")

    return ChatResponse(response=response_text, source="smart-rules")
