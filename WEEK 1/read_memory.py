import asyncio
import json
import os

async def read_memory(filepath: str):
    """Asynchronously read and print user info from a JSON file."""
    # Simulating some asynchronous operation (like network or I/O delay)
    await asyncio.sleep(0.5)
    
    if not os.path.exists(filepath):
        print(f"Error: {filepath} does not exist.")
        return

    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
            
        print("=== User Memory Layer ===")
        print(f"Name:    {data.get('name', 'N/A')}")
        print(f"Email:   {data.get('email', 'N/A')}")
        print(f"Phone:   {data.get('phone', 'N/A')}")
        print(f"Address: {data.get('address', 'N/A')}")
        print("=========================")
    except json.JSONDecodeError:
        print("Error: The file is not a valid JSON.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

async def main():
    # The JSON file created previously
    target_file = 'user_info.json'
    await read_memory(target_file)

if __name__ == "__main__":
    asyncio.run(main())
