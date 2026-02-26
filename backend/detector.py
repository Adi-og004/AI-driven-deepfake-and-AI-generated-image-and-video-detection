import os
import cv2
import tempfile
import requests
from PIL import Image

class DeepfakeDetector:
    def __init__(self):
        self.api_url = "https://api-inference.huggingface.co/models/dima806/deepfake_vs_real_image_detection"
        # We'll use a public fallback token if the user hasn't set HF_API_KEY, though rate limits apply
        self.headers = {"Authorization": f"Bearer {os.getenv('HF_API_KEY', '')}"} 
        if not os.getenv('HF_API_KEY'):
            print("Warning: HF_API_KEY environment variable not set. Using Hugging Face Inference API without authentication (strict rate limits).")
            # Remove header if no key
            self.headers = {}

    def _query_api(self, image_path: str) -> float:
        """Sends the image to huggingface and returns the fake probability"""
        with open(image_path, "rb") as f:
            data = f.read()
            
        try:
            response = requests.post(self.api_url, headers=self.headers, data=data)
            if response.status_code != 200:
                print(f"HF API Error: {response.text}")
                # Fallback safe score if API fails
                return 0.0
                
            results = response.json()
            # The API returns a list of dicts like: [{'label': 'fake', 'score': 0.99}, {'label': 'real', 'score': 0.01}]
            # Or sometimes a nested list [[{...}]]
            if isinstance(results, list) and len(results) > 0 and isinstance(results[0], list):
                results = results[0]
                
            if isinstance(results, list):
                for result in results:
                    if result.get('label', '').lower() == 'fake':
                        return float(result.get('score', 0.0))
            return 0.0
        except Exception as e:
            print(f"Failed to query HF API: {e}")
            return 0.0

    def analyze_image(self, image_path: str) -> tuple[float, str]:
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found at path: {image_path}")

        fake_probability = self._query_api(image_path)
        return fake_probability, image_path

    def analyze_video(self, video_path: str, interval_seconds: int = 2, output_dir: str | None = None) -> tuple[float, str]:
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video not found at path: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise Exception(f"Failed to open video file: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0: fps = 30.0

        frame_interval = int(fps * interval_seconds)
        scores = []
        highest_score = -1.0
        best_frame = None
        
        frame_count = 0
        success = True
        
        temp_dir = output_dir if output_dir else tempfile.gettempdir()
        
        while success:
            success, frame = cap.read()
            if not success: break
                
            if frame_count % frame_interval == 0:
                # Save temp frame to send to API
                temp_frame_path = os.path.join(temp_dir, f"temp_frame_{frame_count}.jpg")
                cv2.imwrite(temp_frame_path, frame)
                
                fake_prob = self._query_api(temp_frame_path)
                scores.append(fake_prob)
                
                if fake_prob > highest_score:
                    highest_score = fake_prob
                    best_frame = frame
                    
                # Clean up temp frame
                try: os.remove(temp_frame_path)
                except: pass

            frame_count += 1
            
            # API rate limit protection - don't check more than 5 frames per video
            if len(scores) >= 5:
                break

        cap.release()

        # Fallback if video is too short
        if not scores:
            cap = cv2.VideoCapture(video_path)
            success, frame = cap.read()
            if success:
                temp_frame_path = os.path.join(temp_dir, "temp_frame_fallback.jpg")
                cv2.imwrite(temp_frame_path, frame)
                fake_prob = self._query_api(temp_frame_path)
                scores.append(fake_prob)
                best_frame = frame
                try: os.remove(temp_frame_path)
                except: pass
            cap.release()

        if not scores: return 0.0, ""
            
        best_frame_path = ""
        if best_frame is not None:
            best_frame_path = os.path.join(temp_dir, f"best_frame_{os.urandom(4).hex()}.jpg")
            cv2.imwrite(best_frame_path, best_frame)
            
        return highest_score, best_frame_path

# Instantiate a single instance
detector_instance = None

def get_detector() -> DeepfakeDetector:
    global detector_instance
    if detector_instance is None:
        detector_instance = DeepfakeDetector()
    return detector_instance
