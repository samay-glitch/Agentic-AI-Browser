import os
import json

SYSTEM_PROMPT = """
You are the core intelligence module of an autonomous browser agent.
Your job is to convert natural language commands from the user into a structured JSON action plan.

The JSON schema must follow exactly this format:
{
    "action": "fill_form" | "navigate" | "email" | "summarize" | "click" | "clarify",
    "target_url": "URL if known, otherwise null",
    "data": { "key": "value pairs of any extracted entities" },
    "steps": [ "Step 1", "Step 2" ],
    "clarifying_question": "If the action is 'clarify', what question to ask the user. Otherwise null."
}

If a command is too ambiguous to safely execute, set "action" to "clarify" and provide a "clarifying_question".

Few-shot examples:

User: "Go to news.ycombinator.com"
Output:
{
    "action": "navigate", 
    "target_url": "https://news.ycombinator.com", 
    "data": {}, 
    "steps": ["Open browser", "Navigate to https://news.ycombinator.com"], 
    "clarifying_question": null
}

User: "Fill out the contact form at example.com/contact with my name John and email john@test.com"
Output:
{
    "action": "fill_form", 
    "target_url": "https://example.com/contact", 
    "data": {"name": "John", "email": "john@test.com"}, 
    "steps": ["Navigate to https://example.com/contact", "Locate name field", "Enter 'John'", "Locate email field", "Enter 'john@test.com'", "Submit form"], 
    "clarifying_question": null
}

User: "Send an email to my boss with a summary of the current page"
Output:
{
    "action": "email", 
    "target_url": null, 
    "data": {"recipient": "boss", "content_source": "current_page_summary"}, 
    "steps": ["Extract content from current page", "Summarize content", "Open email client", "Compose email to boss", "Insert summary", "Send email"], 
    "clarifying_question": null
}
"""

def mock_llm_call(user_command: str) -> str:
    """A mock LLM backend to safely test the script without requiring an API key immediately."""
    mocks = {
        "apply to this job": '{"action": "fill_form", "target_url": null, "data": {"context": "job_application"}, "steps": ["Locate job application form", "Fill form using user profile data", "Submit application"], "clarifying_question": null}',
        "close all tabs": '{"action": "clarify", "target_url": null, "data": {}, "steps": [], "clarifying_question": "Are you sure you want to close ALL tabs, or keep the active one open?"}',
        "email this summary to my boss": '{"action": "email", "target_url": null, "data": {"recipient": "boss", "attachment": "summary"}, "steps": ["Open email client", "Compose to boss", "Attach summary", "Send"], "clarifying_question": null}',
        "go to bbc.com and read the top story": '{"action": "navigate", "target_url": "https://bbc.com", "data": {"target": "top_story"}, "steps": ["Navigate to bbc.com", "Find top story link", "Click top story"], "clarifying_question": null}',
        "fill the login with username 'admin'": '{"action": "fill_form", "target_url": null, "data": {"username": "admin"}, "steps": ["Locate username field", "Input admin", "Wait for password input"], "clarifying_question": null}',
        "click the submit button": '{"action": "click", "target_url": null, "data": {"target": "submit_button"}, "steps": ["Locate submit button", "Click it"], "clarifying_question": null}',
        "summarize this article for me": '{"action": "summarize", "target_url": null, "data": {}, "steps": ["Extract article text", "Generate summary", "Display summary to user"], "clarifying_question": null}',
        "buy me a coffee": '{"action": "clarify", "target_url": null, "data": {}, "steps": [], "clarifying_question": "I cannot physically buy coffee. Did you mean navigate to a coffee shop website, or donate to a creator\'s BuyMeACoffee link?"}',
        "search for cheap flights to Tokyo": '{"action": "navigate", "target_url": "https://www.google.com/flights", "data": {"destination": "Tokyo"}, "steps": ["Navigate to flights site", "Enter Tokyo as destination", "Search"], "clarifying_question": null}',
        "send a message": '{"action": "clarify", "target_url": null, "data": {}, "steps": [], "clarifying_question": "Who would you like to send the message to, and what platform (email, Slack, SMS) should I use?"}'
    }
    return mocks.get(user_command, '{"action": "clarify", "target_url": null, "data": {}, "steps": [], "clarifying_question": "Command not recognized in mock mode."}')

def parse_intent(user_command: str) -> dict:
    """
    Core Intelligence Module:
    Calls an LLM API to convert a natural language command into a JSON action plan.
    Falls back to a mock implementation if GEMINI_API_KEY is not set.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=SYSTEM_PROMPT)
            response = model.generate_content(
                user_command,
                generation_config=genai.GenerationConfig(response_mime_type="application/json")
            )
            return json.loads(response.text)
        except ImportError:
            print("Warning: google-generativeai package not installed. Falling back to mock LLM.")
        except Exception as e:
            print(f"API Error: {e}. Falling back to mock LLM.")
            
    # Fallback if no key is found or error occurs
    return json.loads(mock_llm_call(user_command))

def test():
    """Test the parser with 10 different commands."""
    commands = [
        "apply to this job",
        "close all tabs",
        "email this summary to my boss",
        "go to bbc.com and read the top story",
        "fill the login with username 'admin'",
        "click the submit button",
        "summarize this article for me",
        "buy me a coffee",
        "search for cheap flights to Tokyo",
        "send a message"
    ]
    
    print("=== Core Intelligence Module: Intent Parser ===\n")
    if not os.environ.get("GEMINI_API_KEY"):
        print("Note: GEMINI_API_KEY not set in environment. Running in mock mode to demonstrate functionality.\n")
        
    for cmd in commands:
        print(f"User Command: '{cmd}'")
        result = parse_intent(cmd)
        print(json.dumps(result, indent=2))
        print("-" * 60)

if __name__ == "__main__":
    test()
