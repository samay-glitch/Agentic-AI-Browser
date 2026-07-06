from langchain.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
import os
import sqlite3
from langgraph.prebuilt import create_react_agent
from playwright.async_api import async_playwright
import traceback
import asyncio

load_dotenv()

# We initialize the LLM. Ensure GOOGLE_API_KEY is present in environment or .env file.
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

# Global page variable for tools to use
# (Note: for a production app with concurrent requests, you'd pass this via context or class,
# but keeping it global aligns with the Week 4 structure).
page = None  

DB_FILE = "browser.db"

@tool
async def navigate_to(url: str) -> str:
    """Navigate the browser to a specific URL."""
    global page
    if not page:
        return "Error: Browser page is not initialized."
    await page.goto(url)
    return f"Successfully navigated to {url}"

@tool
async def click_element(selector: str) -> str:
    """Click an element on the webpage using a CSS selector."""
    global page
    if not page:
        return "Error: Browser page is not initialized."
    await page.click(selector)
    return f"Clicked element: {selector}"

@tool
async def type_text(selector: str, text: str) -> str:
    """Type text into a specific input field."""
    global page
    if not page:
        return "Error: Browser page is not initialized."
    await page.fill(selector, text) 
    return f"Typed '{text}' into {selector}"

@tool
def get_user_profile(key: str) -> str:
    """Query the user's profile for specific information like 'name', 'email', 'phone', 'address', or 'resume_text'."""
    try:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM user_profile WHERE id = 1")
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return "Error: User profile not found in database."
            
        profile_dict = dict(row)
        value = profile_dict.get(key.lower())
        if value:
            return str(value)
        return f"Key '{key}' not found in profile."
    except Exception as e:
        return f"Error reading profile from database: {e}"

async def run_browser_agent(task_id: str, command: str, tasks_dict: dict, queue: asyncio.Queue):
    """
    Background task function that initializes Playwright, runs the LangChain agent,
    and streams the task status and LangGraph steps to the WebSocket queue.
    """
    global page
    
    async def update_status(status, progress, **kwargs):
        tasks_dict[task_id]["status"] = status
        tasks_dict[task_id]["progress"] = progress
        for k, v in kwargs.items():
            tasks_dict[task_id][k] = v
        # Push a copy of the dictionary state to the websocket queue
        await queue.put(dict(tasks_dict[task_id]))

    await update_status("in_progress", 10)
    
    try:
        async with async_playwright() as p:
            # Running headless=True by default for background tasks.
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            await update_status("in_progress", 20)

            tools = [navigate_to, click_element, type_text, get_user_profile]
            agent = create_react_agent(llm, tools)
            
            messages = [("user", command)]
            inputs = {"messages": messages}
            
            await update_status("in_progress", 50)
            
            # Agent takes over and calls tools. 
            # We use astream to yield updates step-by-step.
            final_message = ""
            async for chunk in agent.astream(inputs, stream_mode="updates"):
                # chunk contains updates from either the 'agent' node or 'tools' node
                log_msg = str(chunk)
                
                # We can try to extract the last message if the agent node responded
                if "agent" in chunk and "messages" in chunk["agent"]:
                    final_message = chunk["agent"]["messages"][-1].content
                
                # Append to logs and push update
                tasks_dict[task_id]["logs"].append(log_msg)
                await update_status("in_progress", 50, latest_log=log_msg)
                
            await update_status("completed", 100, result=final_message)
            
            await browser.close()
            page = None # Reset global
            
    except Exception as e:
        await update_status("failed", tasks_dict[task_id]["progress"], error=str(e), traceback=traceback.format_exc())
        if page:
            page = None
