"""
LokiAI Biometric ML Microservice
FastAPI-based service for keystroke and voice authentication
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import hashlib
import json
import os
from datetime import datetime
import librosa
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
import joblib

app = FastAPI(title="LokiAI Biometrics Service", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model storage directory
MODELS_DIR = "/app/models"
os.makedirs(MODELS_DIR, exist_ok=True)

# Pydantic models
class KeystrokeTrainRequest(BaseModel):
    walletAddress: str
    keystrokeSamples: List[List[float]]

class KeystrokeVerifyRequest(BaseModel):
    walletAddress: str
    keystrokeData: List[float]

class VoiceFeatures(BaseModel):
    mfcc: List[float]
    pitch: float
    energy: float
    zcr: float

# Helper functions
def calculate_checksum(data):
    """Calculate SHA-256 checksum for data integrity"""
    return hashlib.sha256(json.dumps(data).encode()).hexdigest()

def get_model_path(wallet_address, model_type):
    """Get file path for storing model"""
    return os.path.join(MODELS_DIR, f"{wallet_address}_{model_type}.pkl")

def extract_voice_features(audio_data):
    """Extract MFCC and other features from audio"""
    try:
        # Load audio
        y, sr = librosa.load(audio_data, sr=16000)
        
        # Extract MFCC
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfcc, axis=1)
        
        # Extract pitch
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
        pitch = np.mean(pitches[pitches > 0]) if np.any(pitches > 0) else 0
        
        # Extract energy
        energy = np.mean(librosa.feature.rms(y=y))
        
        # Extract zero crossing rate
        zcr = np.mean(librosa.feature.zero_crossing_rate(y))
        
        return {
            "mfcc": mfcc_mean.tolist(),
            "pitch": float(pitch),
            "energy": float(energy),
            "zcr": float(zcr)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Feature extraction failed: {str(e)}")

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "LokiAI Biometrics",
        "timestamp": datetime.utcnow().isoformat()
    }

# Biometric status
@app.get("/api/biometrics/status")
async def get_biometric_status(walletAddress: str):
    """Check if user has trained biometric models"""
    keystroke_path = get_model_path(walletAddress.lower(), "keystroke")
    voice_path = get_model_path(walletAddress.lower(), "voice")
    
    has_keystroke = os.path.exists(keystroke_path)
    has_voice = os.path.exists(voice_path)
    
    return {
        "hasKeystroke": has_keystroke,
        "hasVoice": has_voice,
        "setupComplete": has_keystroke and has_voice,
        "keystrokeTrainedAt": datetime.fromtimestamp(os.path.getmtime(keystroke_path)).isoformat() if has_keystroke else None,
        "voiceTrainedAt": datetime.fromtimestamp(os.path.getmtime(voice_path)).isoformat() if has_voice else None
    }

# Keystroke training
@app.post("/api/biometrics/keystroke/train")
async def train_keystroke(request: KeystrokeTrainRequest):
    """Train keystroke dynamics model using GhostKey Autoencoder approach"""
    try:
        wallet = request.walletAddress.lower()
        samples = request.keystrokeSamples
        
        if len(samples) < 5:
            raise HTTPException(status_code=400, detail="Minimum 5 samples required")
        
        # Convert to numpy array
        X = np.array(samples)
        
        # Normalize features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Train autoencoder (simplified with MLP)
        model = MLPClassifier(
            hidden_layer_sizes=(64, 32, 64),
            activation='relu',
            max_iter=500,
            random_state=42
        )
        
        # Create labels (all samples belong to same user)
        y = np.ones(len(samples))
        model.fit(X_scaled, y)
        
        # Save model and scaler
        model_path = get_model_path(wallet, "keystroke")
        joblib.dump({
            'model': model,
            'scaler': scaler,
            'samples': samples,
            'trained_at': datetime.utcnow().isoformat()
        }, model_path)
        
        checksum = calculate_checksum(samples)
        
        print(f"✅ Keystroke model trained for {wallet}")
        
        return {
            "success": True,
            "message": "Keystroke model trained successfully",
            "modelType": "GhostKey Autoencoder",
            "checksum": checksum[:8],
            "samplesCount": len(samples)
        }
    except Exception as e:
        print(f"❌ Keystroke training failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Keystroke verification
@app.post("/api/biometrics/keystroke/verify")
async def verify_keystroke(request: KeystrokeVerifyRequest):
    """Verify keystroke pattern against trained model"""
    try:
        wallet = request.walletAddress.lower()
        keystroke_data = request.keystrokeData
        
        model_path = get_model_path(wallet, "keystroke")
        
        if not os.path.exists(model_path):
            raise HTTPException(status_code=404, detail="No trained model found")
        
        # Load model
        model_data = joblib.load(model_path)
        model = model_data['model']
        scaler = model_data['scaler']
        
        # Normalize input
        X = np.array([keystroke_data])
        X_scaled = scaler.transform(X)
        
        # Calculate reconstruction error (MSE)
        prediction = model.predict_proba(X_scaled)[0]
        confidence = float(prediction[1]) if len(prediction) > 1 else float(prediction[0])
        
        # Calculate MSE from training samples
        training_samples = np.array(model_data['samples'])
        mse = np.mean((X - training_samples.mean(axis=0)) ** 2)
        
        # Threshold for authentication
        threshold = 0.5
        authenticated = confidence > threshold and mse < 100
        
        print(f"✅ Keystroke verification for {wallet}: {authenticated} (confidence: {confidence:.3f}, MSE: {mse:.3f})")
        
        return {
            "success": authenticated,
            "score": confidence,
            "mse": float(mse),
            "message": "Verification passed" if authenticated else "Verification failed"
        }
    except Exception as e:
        print(f"❌ Keystroke verification failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Voice training
@app.post("/api/biometrics/voice/train")
async def train_voice(
    walletAddress: str = Form(...),
    samples: List[UploadFile] = File(...)
):
    """Train voice biometric model"""
    try:
        wallet = walletAddress.lower()
        
        if len(samples) < 3:
            raise HTTPException(status_code=400, detail="Minimum 3 voice samples required")
        
        # Extract features from all samples
        features_list = []
        for sample in samples:
            audio_data = await sample.read()
            features = extract_voice_features(audio_data)
            
            # Combine all features into single vector
            feature_vector = features['mfcc'] + [features['pitch'], features['energy'], features['zcr']]
            features_list.append(feature_vector)
        
        # Convert to numpy array
        X = np.array(features_list)
        
        # Normalize
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Train model
        model = MLPClassifier(
            hidden_layer_sizes=(32, 16, 32),
            activation='relu',
            max_iter=300,
            random_state=42
        )
        
        y = np.ones(len(features_list))
        model.fit(X_scaled, y)
        
        # Save model
        model_path = get_model_path(wallet, "voice")
        joblib.dump({
            'model': model,
            'scaler': scaler,
            'reference_features': features_list,
            'trained_at': datetime.utcnow().isoformat()
        }, model_path)
        
        print(f"✅ Voice model trained for {wallet}")
        
        return {
            "success": True,
            "message": "Voice model trained successfully",
            "samplesCount": len(samples)
        }
    except Exception as e:
        print(f"❌ Voice training failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Voice verification
@app.post("/api/biometrics/voice/verify")
async def verify_voice(
    walletAddress: str = Form(...),
    voice_sample: UploadFile = File(...)
):
    """Verify voice against trained model"""
    try:
        wallet = walletAddress.lower()
        
        model_path = get_model_path(wallet, "voice")
        
        if not os.path.exists(model_path):
            raise HTTPException(status_code=404, detail="No trained voice model found")
        
        # Load model
        model_data = joblib.load(model_path)
        model = model_data['model']
        scaler = model_data['scaler']
        
        # Extract features from input
        audio_data = await voice_sample.read()
        features = extract_voice_features(audio_data)
        feature_vector = features['mfcc'] + [features['pitch'], features['energy'], features['zcr']]
        
        # Normalize
        X = np.array([feature_vector])
        X_scaled = scaler.transform(X)
        
        # Predict
        prediction = model.predict_proba(X_scaled)[0]
        confidence = float(prediction[1]) if len(prediction) > 1 else float(prediction[0])
        
        # Calculate similarity with reference
        reference_features = np.array(model_data['reference_features'])
        similarity = 1 - np.mean(np.abs(X - reference_features.mean(axis=0)))
        
        threshold = 0.6
        authenticated = confidence > threshold
        
        print(f"✅ Voice verification for {wallet}: {authenticated} (confidence: {confidence:.3f})")
        
        return {
            "success": authenticated,
            "similarityScore": float(similarity),
            "confidence": confidence,
            "message": "Voice verified" if authenticated else "Voice verification failed"
        }
    except Exception as e:
        print(f"❌ Voice verification failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=25000)
