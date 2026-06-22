import asyncio
import json
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError

async def form_filler(data_file: str):
    """Fill automation practice form from JSON and take a screenshot."""
    try:
        with open(data_file, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: {data_file} not found.")
        return

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            
            print("Navigating to demoqa automation form...")
            try:
                # Error Condition 1: Navigation Timeout
                await page.goto("https://demoqa.com/automation-practice-form", timeout=30000)
            except PlaywrightTimeoutError:
                print("Error: Timeout while navigating to the form page. The server might be slow.")
                await browser.close()
                return

            print("Filling form...")
            try:
                # Error Condition 2: Element not found / Timeout waiting for element
                await page.wait_for_selector("#firstName", timeout=10000)
                
                await page.fill("#firstName", data.get("firstName", ""))
                await page.fill("#lastName", data.get("lastName", ""))
                await page.fill("#userEmail", data.get("userEmail", ""))
                
                # Gender radio button interaction
                gender = data.get("gender", "Male")
                await page.get_by_text(gender, exact=True).click()
                
                await page.fill("#userNumber", data.get("userNumber", ""))
                
                # Address
                await page.fill("#currentAddress", data.get("currentAddress", ""))
                
                print("Taking screenshot before submission...")
                await page.screenshot(path="form_filled.png", full_page=True)
                print("Screenshot saved successfully to form_filled.png")
                
                # We skip actual submission click to avoid spamming the test server,
                # but if we needed to: await page.click("#submit")
                
            except PlaywrightTimeoutError:
                print("Error: Timeout while waiting for form elements. The page structure might have changed.")
            except Exception as e:
                print(f"Error while interacting with elements: {e}")
            finally:
                await browser.close()
    except Exception as e:
         print(f"Failed to run playwright browser: {e}")

if __name__ == "__main__":
    asyncio.run(form_filler("form_data.json"))
