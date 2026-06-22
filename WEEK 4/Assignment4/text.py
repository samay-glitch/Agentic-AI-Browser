import os
import json
import asyncio
import re
from dotenv import load_dotenv
from playwright.async_api import async_playwright
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemma-4-26b-a4b-it",
    google_api_key=os.getenv("GOOGLE_API_KEY")
)


# ==========================
# DOM EXTRACTION
# ==========================

async def extract_page_context(page):

    # Wait for the page to stabilize and not be in mid-navigation
    for _ in range(10):
        try:
            await page.evaluate("1")
            break
        except Exception:
            await asyncio.sleep(1)

    title = await page.title()

    dom = []
    for attempt in range(3):
        try:
            dom = await page.evaluate("""
            () => {
        
                const elements = [];
                let agentId = 0;
        
                // Interactive elements
                document.querySelectorAll(
                    'input, button, a, textarea, select, [contenteditable="true"], [role="textbox"]'
                ).forEach(el => {
                    el.setAttribute('data-agent-id', agentId);
        
                    elements.push({
                        agent_id: agentId,
                        tag: el.tagName,
                        id: el.id,
                        name: el.name,
                        text: el.innerText?.trim().slice(0,50),
                        placeholder: el.placeholder || el.getAttribute('aria-label') || el.getAttribute('data-placeholder'),
                        type: el.type,
                        role: el.getAttribute('role'),
                        contenteditable: el.getAttribute('contenteditable')
                    });
                    
                    agentId++;
        
                });
                
                // Clickable text elements (for friend names, list items, etc.)
                document.querySelectorAll(
                    '[role="button"], [role="listitem"], [onclick], div[tabindex], span[tabindex], li'
                ).forEach(el => {
                    if (el.getAttribute('data-agent-id')) return;
                    let txt = el.innerText?.trim().slice(0,50);
                    if (!txt) return;
                    el.setAttribute('data-agent-id', agentId);
                    elements.push({
                        agent_id: agentId,
                        tag: el.tagName,
                        text: txt,
                        role: el.getAttribute('role')
                    });
                    agentId++;
                });
        
                return elements;
            }
            """)
            break
        except Exception as e:
            if attempt == 2:
                print(f"Warning: Failed to extract DOM elements: {e}")
            await asyncio.sleep(1)

    return {
        "url": page.url,
        "title": title,
        "elements": dom[:100]
    }


# ==========================
# CLEAN GEMINI OUTPUT
# ==========================

def clean_json(text):
    # Extract just the JSON block using Regex
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return match.group(0)
    return text.strip()


# ==========================
# ASK LLM
# ==========================

async def get_next_action(goal, page, memory):

    page_context = await extract_page_context(page)
    
    # Extract all credentials from .env
    creds = []
    for k, v in os.environ.items():
        if k == "GOOGLE_API_KEY":
            continue
        if any(x in k for x in ["EMAIL", "PASSWORD", "USER", "PASS", "ID"]):
            creds.append(f"{k}: {v}")
    
    credentials_text = "\n".join(creds) if creds else "No credentials provided."

    prompt = f"""
You are an autonomous browser agent.

CREDENTIALS (Use these if you need to log into an app):
{credentials_text}

GOAL:
{goal}

CURRENT PAGE:
{json.dumps(page_context, indent=2)}

MEMORY:
{json.dumps(memory, indent=2)}

Rules:

1. Never repeat actions in completed_actions.
2. Never repeat actions in failed_actions.
3. If search text already typed:
   press Enter.
4. If search results visible:
   click result.
5. If URL changed after action:
   continue from new page.
6. Return ONLY ONE action.
7. CRITICAL: For 'selector', ALWAYS use the agent_id provided in the elements list like this: "[data-agent-id='0']"
8. CRITICAL: When sending a chat message, look for the chat input box (often role='textbox', contenteditable='true', or has 'Send a chat' placeholder/aria-label). DO NOT type chat messages into the search bar.
9. If your message or action is already visible as completed on the screen (e.g. message is in the chat history), DO NOT repeat it. Return {{"action":"done"}}.
10. If goal achieved return:
{{"action":"done"}}

Allowed actions:

{{
  "action":"navigate",
  "url":"https://..."
}}

{{
  "action":"click",
  "selector":"[data-agent-id='...']"
}}

{{
  "action":"type",
  "selector":"[data-agent-id='...']",
  "text":"..."
}}

{{
  "action":"press",
  "selector":"[data-agent-id='...']",
  "key":"Enter"
}}
"""

    response = await llm.ainvoke(prompt)

    content = response.content

    if isinstance(content, list):
        text_parts = []
        for part in content:
            if isinstance(part, dict) and "text" in part:
                text_parts.append(part["text"])
            elif isinstance(part, str):
                text_parts.append(part)
        content = "".join(text_parts)

    content = clean_json(content)

    print("\n=== Gemini Decision ===")
    print(content)

    return json.loads(content)


# ==========================
# EXECUTE ACTION
# ==========================

async def execute_action(page, action):

    action_type = action["action"]

    before_url = page.url

    if action_type == "navigate":

        target_url = action["url"]
        # Normalize snapchat.com navigation to direct login URL if we are not logged in (i.e. on login flow or blank page)
        is_login_page = any(x in page.url for x in ["/v2/login", "/v2/password", "/v2/otp", "about:blank"])
        if "snapchat.com" in target_url and "accounts.snapchat.com" not in target_url and is_login_page:
            target_url = "https://accounts.snapchat.com/v2/login"
            print(f"Redirecting navigate target to direct login URL: {target_url}")

        try:
            await page.goto(
                target_url,
                timeout=20000,
                wait_until="domcontentloaded"
            )
        except Exception as e:
            print(f"Navigation warning (goto timed out or failed): {e}. Continuing anyway...")

    elif action_type == "click":

        await page.wait_for_selector(
            action["selector"],
            timeout=20000
        )

        await page.click(
            action["selector"]
        )

    elif action_type == "type":

        await page.wait_for_selector(
            action["selector"],
            timeout=20000
        )
        
        # Click to focus, select all existing text, then type sequentially
        element = page.locator(action["selector"]).first
        await element.click()
        await page.keyboard.press("Control+A")
        await element.press_sequentially(
            action["text"],
            delay=50
        )

    elif action_type == "press":

        await page.wait_for_selector(
            action["selector"],
            timeout=20000
        )

        await page.press(
            action["selector"],
            action["key"]
        )

    await page.wait_for_timeout(2000)

    after_url = page.url

    return {
        "success": True,
        "before_url": before_url,
        "after_url": after_url
    }


# ==========================
# LOOP DETECTOR
# ==========================

def action_signature(action):

    return json.dumps(
        action,
        sort_keys=True
    )


# ==========================
# AGENT LOOP
# ==========================

async def run_agent(goal, page):

    memory = {

        "goal": goal,

        "completed_actions": [],

        "failed_actions": [],

        "visited_urls": [],

        "page_titles": [],

        "last_result": None
    }

    seen_actions = set()

    for step in range(30):

        print(
            f"\n========== STEP {step+1} =========="
        )
        
        # Check if the page is currently on the OTP/MFA verification screen
        if "accounts.snapchat.com/v2/otp" in page.url:
            print("\n*** OTP / phone verification page detected. ***")
            print("Please enter the verification code on your phone in the browser window.")
            print("The agent will wait until login completes...")
            
            logged_in = False
            for otp_sec in range(90):  # Wait up to 180 seconds
                await asyncio.sleep(2)
                if otp_sec % 10 == 0:
                    print(f"Waiting for login... ({otp_sec * 2}s elapsed). Current URL: {page.url}")
                current_url = page.url
                if "v2/otp" not in current_url and "v2/login" not in current_url and "v2/password" not in current_url:
                    print("Login succeeded! Resuming agent loop...")
                    logged_in = True
                    break
            
            if logged_in:
                # Wait 10 seconds for the web app to stabilize
                print("Waiting 10s for chat page stabilization...")
                await asyncio.sleep(10)
            else:
                print("Warning: OTP login wait timed out after 180 seconds.")

        action = None

        try:

            action = await get_next_action(
                goal,
                page,
                memory
            )

            if action["action"] == "done":

                print("\nGoal completed.")
                return

            # Removed overly aggressive loop detector that was blocking valid repeated actions

            result = await execute_action(
                page,
                action
            )

            memory["completed_actions"].append(
                action
            )

            memory["visited_urls"].append(
                page.url
            )

            memory["page_titles"].append(
                await page.title()
            )

            memory["last_result"] = result

            print(
                f"Current URL: {page.url}"
            )

        except Exception as e:

            print("\nAction Failed")
            print(e)
            
            if page.is_closed():
                print("\nBrowser was closed. Exiting agent loop.")
                break

            memory["failed_actions"].append({
                "action": action,
                "error": str(e)
            })

    print("\nMax steps reached.")


# ==========================
# MAIN
# ==========================

async def main():
    import sys
    
    first_run = True

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            channel="chrome",
            headless=False,
            slow_mo=300,
            args=["--disable-blink-features=AutomationControlled"],
            ignore_default_args=["--enable-automation"]
        )

        page = await browser.new_page()

        await page.goto("about:blank")

        while True:
            if first_run and len(sys.argv) > 1:
                user_goal = " ".join(sys.argv[1:])
                print(f"Goal received from command line: {user_goal}")
                first_run = False
            else:
                user_goal = input("\nEnter next browser goal (or 'quit' to exit): ")
                if user_goal.strip().lower() in ['quit', 'exit']:
                    break
            
            goal = (
                "CRITICAL RULE: If you are asked to interact with an app (like Snapchat, Gmail, etc) and you are not logged in, "
                "check the CREDENTIALS section. If credentials for that app are provided, log in first. "
                "IMPORTANT: If any popup, dialog, or banner appears (like 'Enable notifications', 'Allow cookies', "
                "'Create passkey', 'Set up avatar', 'Heads up', or any other optional setup), "
                "ALWAYS dismiss it by clicking 'Not now', 'Skip', 'Block', 'Close', or the X button. Never click 'Allow' or 'Enable'. "
                f"USER GOAL: {user_goal}"
            )

            await run_agent(
                goal,
                page
            )

        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())