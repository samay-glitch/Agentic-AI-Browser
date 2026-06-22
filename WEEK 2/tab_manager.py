import asyncio
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError

async def fetch_title(context, url: str):
    """Open a URL in a new page/tab within the given context and return the page and its title."""
    try:
        page = await context.new_page()
        try:
            # Error Condition 1: Navigation Timeout
            await page.goto(url, timeout=15000)
            title = await page.title()
            return page, title
        except PlaywrightTimeoutError:
            print(f"Error: Timeout navigating to {url}")
            # If it timed out, return the page anyway so we can close it later, but no title
            return page, None
        except Exception as e:
            # Error Condition 2: Generic page loading failure (e.g. invalid URL, network down)
            print(f"Error loading {url}: {e}")
            return page, None
    except Exception as e:
        print(f"Failed to create new page for {url}: {e}")
        return None, None

async def tab_manager():
    """Open 5 tabs in parallel, capture titles, then close all except the first."""
    urls = [
        "https://example.com",
        "https://www.wikipedia.org",
        "https://news.ycombinator.com",
        "https://httpbin.org",
        "https://www.google.com"
    ]
    
    try:
        async with async_playwright() as p:
            # Launch the browser
            browser = await p.chromium.launch()
            context = await browser.new_context()
            
            print(f"Opening {len(urls)} tabs in parallel...")
            # Run the fetch_title coroutines concurrently
            tasks = [fetch_title(context, url) for url in urls]
            results = await asyncio.gather(*tasks)
            
            pages = []
            for i, (page, title) in enumerate(results):
                if title:
                    print(f"Tab {i+1} Title: {title} (URL: {urls[i]})")
                else:
                    print(f"Tab {i+1} failed to load title. (URL: {urls[i]})")
                
                if page:
                    pages.append(page)
            
            print("\nClosing all tabs except the first one...")
            if pages:
                first_page = pages[0]
                # Close all pages from index 1 onwards
                for page in pages[1:]:
                    try:
                        await page.close()
                    except Exception as e:
                        print(f"Error closing a tab: {e}")
                
                # Verify what remains open
                title = await first_page.title()
                print(f"First page '{title}' remains open.")
            
            # Small delay just to demonstrate the first page remaining alive before the script ends entirely
            await asyncio.sleep(2)
            await browser.close()
            print("Browser context closed.")
    except Exception as e:
         print(f"Failed to initialize playwright: {e}")

if __name__ == "__main__":
    asyncio.run(tab_manager())
