"""
Face Recognition Service - Deep Learning dengan face_recognition library (dlib).
Menggunakan 128-dimensional face encoding untuk akurasi tinggi.
"""
import io
import struct
from typing import Optional, Tuple
import numpy as np
from PIL import Image
from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.face_embedding import FaceEmbedding

try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
    print("INFO: face_recognition library loaded successfully (deep learning mode)")
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    print("WARNING: face_recognition not installed. Face recognition disabled.")


class FaceRecognitionService:
    def __init__(self):
        self.enabled = FACE_RECOGNITION_AVAILABLE
        # Tolerance for face matching (lower = more strict)
        # 0.6 is typical, 0.5 is more strict, 0.4 is very strict
        self.tolerance = 0.5
    
    def _load_image(self, image_data: bytes) -> Optional[np.ndarray]:
        """Load image from bytes to numpy array (RGB format for face_recognition)."""
        try:
            image = Image.open(io.BytesIO(image_data))
            if image.mode != 'RGB':
                image = image.convert('RGB')
            return np.array(image)
        except Exception as e:
            print(f"Error loading image: {e}")
            return None
    
    def detect_face(self, image_data: bytes) -> bool:
        """Detect if there's a face in the image using deep learning."""
        if not self.enabled:
            return True
        
        try:
            image = self._load_image(image_data)
            if image is None:
                return False
            
            # Use CNN model for better accuracy (slower but more accurate)
            # Use 'hog' for faster detection
            face_locations = face_recognition.face_locations(image, model='hog')
            return len(face_locations) > 0
        except Exception as e:
            print(f"Face detection error: {e}")
            return False
    
    def generate_embedding(self, image_data: bytes) -> Optional[bytes]:
        """
        Generate 128-dimensional face embedding using deep learning.
        Returns embedding as bytes.
        """
        if not self.enabled:
            return None
        
        try:
            image = self._load_image(image_data)
            if image is None:
                return None
            
            # Detect face locations
            face_locations = face_recognition.face_locations(image, model='hog')
            
            if len(face_locations) == 0:
                print("No face detected in image")
                return None
            
            # Get the largest face (by area)
            if len(face_locations) > 1:
                largest = max(face_locations, key=lambda loc: (loc[2] - loc[0]) * (loc[1] - loc[3]))
                face_locations = [largest]
                print(f"Multiple faces detected, using largest one")
            
            # Generate 128-dimensional face encoding
            face_encodings = face_recognition.face_encodings(image, face_locations)
            
            if len(face_encodings) == 0:
                print("Could not generate face encoding")
                return None
            
            # Convert to bytes (128 floats = 512 bytes)
            encoding = face_encodings[0].astype(np.float32)
            return encoding.tobytes()
            
        except Exception as e:
            print(f"Embedding generation error: {e}")
            return None
    
    def compare_embeddings(self, embedding1: bytes, embedding2: bytes) -> float:
        """
        Compare two face embeddings using Euclidean distance.
        Returns similarity score (0-1, higher is more similar).
        """
        if not self.enabled:
            return 0.0
        
        try:
            # Convert bytes back to numpy arrays
            # 128 floats * 4 bytes = 512 bytes
            expected_size = 128 * 4
            
            if len(embedding1) != expected_size or len(embedding2) != expected_size:
                print(f"Embedding size mismatch: {len(embedding1)} vs {len(embedding2)} (expected {expected_size})")
                return 0.0
            
            enc1 = np.frombuffer(embedding1, dtype=np.float32)
            enc2 = np.frombuffer(embedding2, dtype=np.float32)
            
            # Calculate Euclidean distance
            distance = np.linalg.norm(enc1 - enc2)
            
            # Convert distance to similarity score
            # Typical distances: same person < 0.6, different person > 0.6
            # Max distance is around 1.2-1.4
            similarity = max(0, 1 - (distance / 1.0))
            
            print(f"    Distance: {distance:.4f}, Similarity: {similarity:.4f}")
            
            return similarity
            
        except Exception as e:
            print(f"Embedding comparison error: {e}")
            return 0.0
    
    def find_matching_employee(
        self,
        image_data: bytes,
        db: Session,
        threshold: float = 0.40
    ) -> Tuple[Optional[Employee], float]:
        """
        Find the employee matching the face in the image.
        Uses deep learning face encodings for high accuracy.
        Compares against ALL registered faces per employee and takes best match.
        
        threshold: minimum similarity score (0.40 = distance < 0.60, stricter)
        """
        if not self.enabled:
            # Fallback: return first active employee for testing
            employee = db.query(Employee).filter(Employee.is_active == True).first()
            if employee:
                return employee, 0.90
            return None, 0.0
        
        # Generate embedding from captured image
        new_embedding = self.generate_embedding(image_data)
        if new_embedding is None:
            print("Failed to generate embedding from captured image")
            return None, 0.0
        
        # Get all face embeddings from active employees
        face_embeddings = db.query(FaceEmbedding).join(Employee).filter(
            Employee.is_active == True
        ).all()
        
        print(f"Comparing against {len(face_embeddings)} registered faces")
        
        # Group by employee and find best score per employee
        employee_scores: dict[int, tuple[Employee, float]] = {}
        
        for fe in face_embeddings:
            # Check embedding size compatibility (512 bytes = 128 floats for deep learning)
            if len(fe.embedding) != len(new_embedding):
                print(f"  - {fe.employee.name}: skipped (incompatible: {len(fe.embedding)} vs {len(new_embedding)} bytes)")
                continue
            
            score = self.compare_embeddings(new_embedding, fe.embedding)
            emp_id = fe.employee_id
            
            # Keep best score per employee
            if emp_id not in employee_scores or score > employee_scores[emp_id][1]:
                employee_scores[emp_id] = (fe.employee, score)
                print(f"  - {fe.employee.name} (face #{fe.id}): score={score:.3f} [best so far]")
            else:
                print(f"  - {fe.employee.name} (face #{fe.id}): score={score:.3f}")
        
        # Find overall best match
        best_match: Optional[Employee] = None
        best_score: float = 0.0
        
        for emp_id, (employee, score) in employee_scores.items():
            if score > best_score:
                best_score = score
                if score >= threshold:
                    best_match = employee
        
        if best_match:
            print(f"Best match: {best_match.name} with score {best_score:.3f}")
        else:
            print(f"No match found. Best score was {best_score:.3f} (threshold: {threshold})")
        
        return best_match, best_score


face_recognition_service = FaceRecognitionService()
