import os
import google.generativeai as genai
from PIL import Image

# Configure the API key using the environment variable loaded by FastAPI
genai.configure(api_key="AIzaSyDIoDNlZS-7bdntsdKdhF5iMFbStp07hGs")

# Define the system prompt for the forensic expert persona
SYSTEM_PROMPT = (
    "You are a senior digital forensics expert. Your task is to examine the provided media "
    "for AI generation artifacts such as unnatural skin textures, anatomical errors (extra fingers, fused limbs), "
    "lighting inconsistencies, and background warping. Provide a concise, bulleted report of your findings."
)

def analyze_media_forensics(image_path: str) -> str:
    """
    Analyzes an image using the Gemini Flash model to detect AI generation artifacts.
    Returns a bulleted forensic report.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at path: {image_path}")

    # Load the image using PIL
    image = Image.open(image_path)

    try:
        # Note: Upgraded to gemini-2.5-flash as it is supported by the user's API key
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        # Combine the system instruction and the image
        response = model.generate_content([SYSTEM_PROMPT, image])
        
        return response.text
    except Exception as e:
        return f"Error analyzing media forensics: {str(e)}"
