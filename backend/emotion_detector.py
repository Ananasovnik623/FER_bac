from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Generator, Tuple

import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

"""
Emotion Detection Module
Created for Bachelor Thesis at CTU FEL
Author: Jan Sadílek
"""

@dataclass(frozen=True)
class EmotionDetectorSettings:
    frame_interval: int = 5
    keras_model_path: Path = Path("model.keras")
    cascade_path: Path = Path(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    keras_img_size: int = 224
    keras_emotions: List[str] = field(default_factory=lambda: [
        "angry",
        "disgust",
        "fear",
        "happy",
        "sad",
        "surprise",
        "neutral",
        "contempt",
    ])

class EmotionDetector:
    """
    A class for detecting emotions in videos and images
    Uses a pre-trained Keras model + Haar cascades for face detection
    """
    def __init__(self, settings: EmotionDetectorSettings = None):
        self.settings = settings or EmotionDetectorSettings()
        self.model = None
        self.face_cascade = None
        self._load_models()
    
    def _load_models(self) -> None:
        """Load the Keras model and OpenCV face detector."""
        if not self.settings.keras_model_path.is_file():
            raise FileNotFoundError(f"Keras model not found at {self.settings.keras_model_path}")
            
        self.model = tf.keras.models.load_model(self.settings.keras_model_path,compile=False)

        self.face_cascade = cv2.CascadeClassifier(self.settings.cascade_path.as_posix())
        
        if self.face_cascade.empty():
            raise RuntimeError("Cascade classifier not found")
        
        print("Models loaded successfully")
    
    def extract_frames(self, video_path: str, interval: int = None) -> Generator[np.ndarray, None, None]:
        """
        Extracts frames from a video at specified intervals
        
        Args:
            video_path: Path to the video file
            interval: Extract every nth frame (if None, use default from settings)
            
        Yields:
            numpy array containing the frame image
        """
        if interval is None:
            interval = self.settings.frame_interval
            
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise RuntimeError(f"Cannot open video: {video_path}")
            
        frame_count = 0
        while True:
            success, frame = cap.read()
            if not success:  # End of video
                break

            if frame_count % interval == 0:
                yield frame
                
            frame_count += 1
        
        cap.release()
    
    def _crop_face(self, frame: np.ndarray, bbox: Tuple[int, int, int, int]) -> np.ndarray:
        """
        Crops a detected face from the frame
        
        Args:
            frame: The full video frame
            bbox: Bounding box (x, y, width, height)
            
        Returns:
            Cropped face image
        """
        x, y, w, h = bbox
        return frame[y:y+h, x:x+w]
    
    def detect_emotion(self, face_img: np.ndarray) -> Dict[str, Any]:
        """
        Detects emotion in a face image using the Keras model
        
        Args:
            face_img: Cropped image of a face
            
        Returns:
            Dictionary with detected emotion and confidence score
        """
        try:
            # Resize and preprocess image
            img = cv2.resize(face_img, (self.settings.keras_img_size, self.settings.keras_img_size))
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            img = preprocess_input(img.astype("float32"))
            
            # Make prediction
            prediction = self.model.predict(np.expand_dims(img, 0), verbose=0)[0]
            emotion_idx = int(np.argmax(prediction))
            emotion = self.settings.keras_emotions[emotion_idx]
            confidence = float(prediction[emotion_idx])
            
            return {"emotion": emotion, "confidence": confidence,
                    "scores": {e: float(s) for e, s in zip(self.settings.keras_emotions, prediction)}
                }
        
        except Exception as e:
            print(f"Error in emotion detection: {e}")
            return {"emotion": "error", "confidence": 0.0, "error": str(e)}
    
    def detect_faces(self, frame: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detects faces in a frame using Haar cascades
        
        Args:
            frame: Video frame as numpy array
            
        Returns:
            List of face bounding boxes (x, y, width, height)
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        return faces
    
    def analyze_frame(self, frame: np.ndarray, frame_idx: int = 0) -> Dict[str, Any]:
        """
        Analyze a single frame to detect faces and emotions
        
        Args:
            frame: Video frame
            frame_idx: Index of this frame (for reference)
            
        Returns:
            Dictionary with detection results
        """
        try:
            faces = self.detect_faces(frame)
            
            if len(faces) == 0:
                return {"frame_index": frame_idx, "emotion": "no_face_detected", "confidence": 0.0}
            
            # Use the largest face – should be main subject
            x, y, w, h = max(faces, key=lambda b: b[2] * b[3])
            face = self._crop_face(frame, (x, y, w, h))
            
            if face.size == 0:
                return {"frame_index": frame_idx, "emotion": "no_face_detected", "confidence": 0.0}
            
            result = self.detect_emotion(face)
            result["frame_index"] = frame_idx
            
            return result
        except Exception as e:
            print(f"Error in frame analysis: {e}")
            return {"frame_index": frame_idx, "emotion": "error", "confidence": 0.0, "error": str(e)}
    
    def analyze_frames(self, frames: List[np.ndarray]) -> List[Dict[str, Any]]:
        """
        Analyze a list of frames for emotions
        
        Args:
            frames: List of video frames
            
        Returns:
            List of results, one per frame
        """
        results = []

        for idx, frame in enumerate(frames):
            result = self.analyze_frame(frame, idx)
            results.append(result)
        
        return results
    
    def analyze_video(self, video_path: str, interval: int = None) -> List[Dict[str, Any]]:
        """
        Main method - analyzes emotions in a video file
        
        Args:
            video_path: Path to video file
            interval: Extract every nth frame (if None, default will be used)
            
        Returns:
            List of emotion results, one per analyzed frame
        """
        frames = list(self.extract_frames(video_path, interval))
        return self.analyze_frames(frames)



# Test the module
if __name__ == "__main__":
    # This runs if you execute the file directly
    detector = EmotionDetector()
    
    # Test with a sample video if one is provided
    test_video = "test_video.mp4"
    if os.path.exists(test_video):
        print(f"Testing with {test_video}")
        results = detector.analyze_video(test_video)
        
        # Print summary of results
        emotions = [r["emotion"] for r in results if "emotion" in r]
        print("\nEmotion summary:")
        for emotion in set(emotions):
            count = emotions.count(emotion)
            print(f"{emotion}: {count} frames ({count/len(emotions)*100:.1f}%)")
    else:
        print(f"No test video found at {test_video}")
        print("You can test by calling detector.analyze_video(your_video_path)")
