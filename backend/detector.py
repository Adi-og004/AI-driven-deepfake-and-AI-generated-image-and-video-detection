import os
import cv2
import tempfile
from PIL import Image
from transformers import pipeline

class DeepfakeDetector:
    def __init__(self):
        # Initialize the Hugging Face vision transformer pipeline
        self.model_name = "dima806/deepfake_vs_real_image_detection"
        print(f"Loading deepfake detection model: {self.model_name}...")
        self.classifier = pipeline("image-classification", model=self.model_name)
        print("Model loaded successfully.")

    def analyze_image(self, image_path: str) -> tuple[float, str]:
        """
        Analyzes a single image and returns the probability that it is a deepfake.
        Returns a tuple of (fake_probability, image_path).
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found at path: {image_path}")

        image = Image.open(image_path).convert("RGB")
        
        results = self.classifier(image)
        
        fake_probability = 0.0
        for result in results:
            if result['label'].lower() == 'fake':
                fake_probability = result['score']
                break
                
        return fake_probability, image_path

    def analyze_video(self, video_path: str, interval_seconds: int = 2, output_dir: str | None = None) -> tuple[float, str]:
        """
        Analyzes a video by extracting frames at the specified interval.
        Returns a tuple of (average_score, path_to_highest_scoring_frame).
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video not found at path: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise Exception(f"Failed to open video file: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0:
            fps = 30.0

        frame_interval = int(fps * interval_seconds)
        scores = []
        
        highest_score = -1.0
        best_frame = None
        
        frame_count = 0
        success = True
        
        while success:
            success, frame = cap.read()
            if not success:
                break
                
            if frame_count % frame_interval == 0:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(frame_rgb)
                
                results = self.classifier(pil_img)
                fake_prob = 0.0
                for result in results:
                    if result['label'].lower() == 'fake':
                        fake_prob = result['score']
                        break
                        
                scores.append(fake_prob)
                
                # Keep track of the frame with the highest deepfake probability
                if fake_prob > highest_score:
                    highest_score = fake_prob
                    best_frame = frame_rgb

            frame_count += 1

        cap.release()

        # Fallback if video is too short to hit the interval
        if not scores:
            cap = cv2.VideoCapture(video_path)
            success, frame = cap.read()
            if success:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(frame_rgb)
                results = self.classifier(pil_img)
                f_prob = 0.0
                for r in results:
                    if r['label'].lower() == 'fake':
                        f_prob = r['score']
                        break
                scores.append(f_prob)
                best_frame = frame_rgb
            cap.release()

        if not scores:
            return 0.0, ""
            
        best_frame_path = ""
        if best_frame is not None:
            temp_dir = output_dir if output_dir else tempfile.gettempdir()
            best_frame_path = os.path.join(temp_dir, f"best_frame_{os.urandom(4).hex()}.jpg")
            Image.fromarray(best_frame).save(best_frame_path)
            
        return highest_score, best_frame_path

# Instantiate a single instance
detector_instance = None

def get_detector() -> DeepfakeDetector:
    global detector_instance
    if detector_instance is None:
        detector_instance = DeepfakeDetector()
    return detector_instance
