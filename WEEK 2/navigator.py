import asyncio
import json
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError

async def navigator():
    """Navigate to Hacker News, extract top 5 titles, save to JSON."""
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            context = await browser.new_context()
            page = await context.new_page()
            
            print("Navigating to Hacker News...")
            try:
                # Error Condition 1: Timeout handling
                await page.goto("https://news.ycombinator.com/", timeout=15000)
            except PlaywrightTimeoutError:
                print("Error: Timeout while trying to load the page.")
                return
            
            print("Extracting top 5 articles...")
            try:
                # Error Condition 2: Element not found handling
                # Wait for the main title elements to appear
                await page.wait_for_selector(".titleline > a", timeout=5000)
                
                # Extract titles
                elements = await page.query_selector_all(".titleline > a")
                if not elements:
                    print("Error: Could not find any article titles. DOM might have changed.")
                    return
                
                titles = []
                for idx, element in enumerate(elements[:5]):
                    title = await element.inner_text()
                    titles.append({"rank": idx + 1, "title": title})
                    
                # Save to JSON
                with open("top_articles.json", "w") as f:
                    json.dump(titles, f, indent=4)
                    
                print(f"Successfully saved {len(titles)} articles to top_articles.json.")
                
            except PlaywrightTimeoutError:
                print("Error: Timeout waiting for article selectors. The site layout might have changed.")
            except Exception as e:
                print(f"An unexpected error occurred: {e}")
            finally:
                await browser.close()
    except Exception as e:
         print(f"Failed to initialize playwright: {e}")

if __name__ == "__main__":
    asyncio.run(navigator())
