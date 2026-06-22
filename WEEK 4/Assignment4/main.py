from langchain.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
import os
import asyncio
import json
from langgraph.prebuilt import create_react_agent
from playwright.async_api import async_playwright

load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

# Global page variable for tools to use
page = None  

@tool
async def navigate_to(url: str) -> str:
    """Navigate the browser to a specific URL."""
    await page.goto(url)
    return f"Successfully navigated to {url}"

@tool
async def click_element(selector: str) -> str:
    """Click an element on the webpage using a CSS selector."""
    await page.click(selector)
    return f"Clicked element: {selector}"

@tool
async def type_text(selector: str, text: str) -> str:
    """Type text into a specific input field."""
    await page.fill(selector, text) 
    return f"Typed '{text}' into {selector}"

@tool
def get_user_profile(key: str) -> str:
    """Query the user's profile for specific information like 'name', 'email', or 'resume_path'."""
    try:
        with open("profile.json", "r") as f:
            profile = json.load(f)
        return profile.get(key.lower(), f"Key '{key}' not found in profile.")
    except Exception as e:
        return f"Error reading profile: {e}"

async def main():
    global page
    
    # Start Playwright asynchronously
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        # Initialize the LangGraph agent
        tools = [navigate_to, click_element, type_text, get_user_profile]
        agent = create_react_agent(llm, tools)
        
        # Conversation Memory List
        messages = []
        
        print("\n" + "="*50)
        print("🤖 Browser Agent Started! (Type 'quit' to exit)")
        print("Try asking: 'What is my email?' or 'Go to google and search for my name'")
        print("="*50)
        
        while True:
            user_input = input("\nYou: ")
            if user_input.strip().lower() in ['quit', 'exit']:
                break
                
            # Append user message to memory
            messages.append(("user", user_input))
            
            inputs = {"messages": messages}
            
            print("Agent is thinking and acting...")
            result = await agent.ainvoke(inputs)
            
            # Update memory with the agent's full trajectory (tool calls & responses)
            messages = result["messages"]
            
            # Print the final response from the agent
            print("\nAgent:", messages[-1].content)
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())