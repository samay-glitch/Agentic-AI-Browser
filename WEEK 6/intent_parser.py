from pydantic import BaseModel
from typing import Dict, Any

class Intent(BaseModel):
    action: str
    parameters: Dict[str, Any]

def parse_intent(command: str) -> Intent:
    """
    A simple heuristic-based intent parser to map natural language 
    commands to structured intents for the agent.
    """
    command_lower = command.lower()
    
    if "navigate" in command_lower or "go to" in command_lower:
        url = "https://example.com"
        if "google.com" in command_lower:
            url = "https://google.com"
        return Intent(action="navigate", parameters={"url": url})
        
    elif "fill" in command_lower or "form" in command_lower:
        return Intent(action="fill_form", parameters={"selector": "form", "data": {}})
        
    elif "email" in command_lower or "send" in command_lower:
        return Intent(action="email", parameters={"recipient": "contact@example.com", "subject": "Automated Email"})
        
    elif "summarize" in command_lower or "summary" in command_lower:
        return Intent(action="summarize", parameters={"source": "current_page"})
        
    elif "click" in command_lower or "press" in command_lower:
        return Intent(action="click", parameters={"selector": "button"})
    
    return Intent(action="unknown", parameters={})
