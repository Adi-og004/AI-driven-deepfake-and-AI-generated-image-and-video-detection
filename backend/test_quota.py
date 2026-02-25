import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

genai.configure(api_key="AIzaSyDIoDNlZS-7bdntsdKdhF5iMFbStp07hGs")
model = genai.GenerativeModel("gemini-1.5-flash")
try:
    response = model.generate_content("Hi")
    print("STATUS: OK")
except Exception as e:
    print(f"STATUS: ERROR ({e})")
