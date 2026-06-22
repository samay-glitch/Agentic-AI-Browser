from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
import os

load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

def generate_pet_names(pet_type: str, count: int = 5) -> list:
    """Generate five pet names based on the type of pet."""
    prompt = f"Suggest {count} cute names for a {pet_type}."
    response = llm.invoke(prompt)
    return [name.strip() for name in response.text.split("\n") if name.strip()]

if __name__ == "__main__":
    pet_type = "cat"
    name = generate_pet_names(pet_type)
    print(f"A cute name for a {pet_type} could be: {name}")