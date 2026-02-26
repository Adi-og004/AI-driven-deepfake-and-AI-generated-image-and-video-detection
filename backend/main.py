import os
import tempfile
import mimetypes
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from detector import get_detector
from forensics import analyze_media_forensics

load_dotenv()

app = FastAPI(title="Deepfake & AI Media Detection API")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisResponse(BaseModel):
    fake_probability: float
    status: str
    report: str | None = None

@app.get("/")
def read_root():
    return {"status": "API is running. Models initialized."}

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_media(file: UploadFile = File(...)):
    detector = get_detector()
    
    # Step B: Securely save uploaded file to a temporary directory
    temp_dir = tempfile.mkdtemp()
    temp_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    temp_file_path = os.path.join(temp_dir, f"upload{temp_ext}")
    
    try:
        # Step A: Write the file asynchronously
        content = await file.read()
        with open(temp_file_path, "wb") as f:
            f.write(content)
        
        # Determine the MIME type
        content_type = file.content_type
        if not content_type:
            content_type, _ = mimetypes.guess_type(file.filename or "")
            
        if not content_type:
            raise HTTPException(status_code=400, detail="Could not determine file type.")
            
        # Step C: Run through DeepfakeDetector
        if content_type.startswith('video/'):
            score, best_frame_path = detector.analyze_video(temp_file_path, output_dir=temp_dir)
            frame_to_analyze = best_frame_path
        elif content_type.startswith('image/'):
            score, _ = detector.analyze_image(temp_file_path)
            frame_to_analyze = temp_file_path
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload an image or video.")
            
        # Step D & E: Invoke the Gemini model ONLY if there's high confidence of AI generation
        if score > 0.65:
            status = "Likely AI-Generated/Deepfake"
            report = analyze_media_forensics(frame_to_analyze)
        else:
            status = "Likely Real"
            report = None
            
        return AnalysisResponse(
            fake_probability=score,
            status=status,
            report=report
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # Cleanup ALL temporary files securely
        try:
            shutil.rmtree(temp_dir)
        except Exception as e:
            print(f"Failed to clean up temporary directory {temp_dir}: {e}")
