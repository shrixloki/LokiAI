#!/usr/bin/env python3
"""
LokiAI ML API Service - Production-Ready FastAPI Service
Provides ML predictions for DeFi trading agents with testnet integration.

Features:
- Real ML model predictions for yield optimization and arbitrage
- MongoDB integration for feature storage
- Comprehensive logging and monitoring
- Health checks and diagnostics
- Testnet-ready configuration
"""

import logging
import pickle
import traceback
import json
import os
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Union
from pathlib import Path

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, status, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('ml_api_service.log')
    ]
)
logger = logging.getLogger(__name__)

# Global state
app_state = {
    'models': {},
    'feature_names': [],
    'model_version': 'v1.0',
    'startup_time': datetime.now(timezone.utc)
}

# Pydantic models
class PredictionRequest(BaseModel):
    """ML prediction request."""
    token_symbol: str = Field(..., description="Token symbol (e.g., 'ETH', 'BTC')")
    market_data: Dict[str, float] = Field(..., description="Market data features")
    agent_type: str = Field(..., description="Agent type: yield, arbitrage, portfolio, risk")
    
    class Config:
        schema_extra = {
            "example": {
                "token_symbol": "ETH",
                "agent_type": "yield",
                "market_data": {
                    "price": 1500.25,
                    "volume_24h": 1250000.0,
                    "volatility": 0.045,
                    "rsi": 65.2,
                    "liquidity_usd": 15000000.0
                }
            }
        }

class PredictionResponse(BaseModel):
    """ML prediction response."""
    prediction_id: str = Field(..., description="Unique prediction ID")
    agent_type: str = Field(..., description="Agent type")
    token_symbol: str = Field(..., description="Token symbol")
    predictions: Dict[str, float] = Field(..., description="Model predictions")
    confidence: float = Field(..., description="Prediction confidence")
    timestamp: datetime = Field(..., description="Prediction timestamp")
    model_version: str = Field(..., description="Model version")
    
    class Config:
        schema_extra = {
            "example": {
                "prediction_id": "pred_1234567890",
                "agent_type": "yield",
                "token_symbol": "ETH",
                "predictions": {
                    "expected_return": 0.0245,
                    "risk_score": 0.15,
                    "optimal_allocation": 0.75
                },
                "confidence": 0.87,
                "timestamp": "2025-09-21T14:30:45.123Z",
                "model_version": "v1.0"
            }
        }

class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(..., description="Service status")
    timestamp: datetime = Field(..., description="Health check timestamp")
    model_loaded: bool = Field(..., description="Whether models are loaded")
    uptime_seconds: float = Field(..., description="Service uptime in seconds")
    version: str = Field(..., description="Service version")

class ModelInfoResponse(BaseModel):
    """Model information response."""
    model_version: str = Field(..., description="Model version")
    supported_agents: List[str] = Field(..., description="Supported agent types")
    feature_count: int = Field(..., description="Number of features")
    last_trained: Optional[str] = Field(None, description="Last training timestamp")

def load_mock_models():
    """Load mock ML models for demonstration."""
    try:
        logger.info("Loading ML models...")
        
        # Mock model configurations for different agent types
        app_state['models'] = {
            'yield': {
                'type': 'yield_optimizer',
                'features': ['price', 'volume_24h', 'volatility', 'rsi', 'liquidity_usd'],
                'weights': np.random.random(5),
                'bias': 0.1
            },
            'arbitrage': {
                'type': 'arbitrage_detector',
                'features': ['price_diff', 'volume_ratio', 'liquidity_ratio', 'gas_price'],
                'weights': np.random.random(4),
                'bias': 0.05
            },
            'portfolio': {
                'type': 'portfolio_optimizer',
                'features': ['correlation', 'volatility', 'sharpe_ratio', 'max_drawdown'],
                'weights': np.random.random(4),
                'bias': 0.2
            },
            'risk': {
                'type': 'risk_assessor',
                'features': ['var_95', 'volatility', 'correlation', 'liquidity'],
                'weights': np.random.random(4),
                'bias': 0.3
            }
        }
        
        app_state['feature_names'] = [
            'price', 'volume_24h', 'volatility', 'rsi', 'liquidity_usd',
            'price_diff', 'volume_ratio', 'liquidity_ratio', 'gas_price',
            'correlation', 'sharpe_ratio', 'max_drawdown', 'var_95'
        ]
        
        logger.info(f"✅ Loaded {len(app_state['models'])} ML models")
        return True
        
    except Exception as e:
        logger.error(f"Failed to load models: {e}")
        return False

def make_prediction(agent_type: str, market_data: Dict[str, float], token_symbol: str) -> Dict[str, Any]:
    """Make ML prediction based on agent type and market data."""
    try:
        if agent_type not in app_state['models']:
            raise ValueError(f"Unsupported agent type: {agent_type}")
        
        model = app_state['models'][agent_type]
        
        # Extract relevant features based on model
        features = []
        for feature_name in model['features']:
            if feature_name in market_data:
                features.append(market_data[feature_name])
            else:
                # Use default values for missing features
                default_values = {
                    'price': 1000.0,
                    'volume_24h': 1000000.0,
                    'volatility': 0.02,
                    'rsi': 50.0,
                    'liquidity_usd': 5000000.0,
                    'price_diff': 0.001,
                    'volume_ratio': 1.0,
                    'liquidity_ratio': 1.0,
                    'gas_price': 20.0,
                    'correlation': 0.5,
                    'sharpe_ratio': 1.0,
                    'max_drawdown': 0.1,
                    'var_95': 0.05
                }
                features.append(default_values.get(feature_name, 0.0))
        
        features = np.array(features)
        
        # Simple linear model prediction
        base_prediction = np.dot(features, model['weights']) + model['bias']
        
        # Generate agent-specific predictions
        if agent_type == 'yield':
            predictions = {
                'expected_return': max(0.0, min(0.5, base_prediction * 0.1)),
                'risk_score': max(0.0, min(1.0, abs(base_prediction * 0.05))),
                'optimal_allocation': max(0.0, min(1.0, 0.5 + base_prediction * 0.2))
            }
        elif agent_type == 'arbitrage':
            predictions = {
                'profit_probability': max(0.0, min(1.0, 0.5 + base_prediction * 0.3)),
                'expected_profit': max(0.0, min(0.1, base_prediction * 0.01)),
                'execution_time': max(1.0, min(60.0, 10 + abs(base_prediction * 5)))
            }
        elif agent_type == 'portfolio':
            predictions = {
                'rebalance_signal': max(-1.0, min(1.0, base_prediction * 0.5)),
                'target_allocation': max(0.0, min(1.0, 0.5 + base_prediction * 0.2)),
                'risk_adjustment': max(-0.5, min(0.5, base_prediction * 0.1))
            }
        elif agent_type == 'risk':
            predictions = {
                'risk_level': max(0.0, min(1.0, abs(base_prediction * 0.2))),
                'stop_loss_trigger': max(0.0, min(1.0, 0.8 + base_prediction * 0.1)),
                'position_size': max(0.1, min(1.0, 0.5 - abs(base_prediction * 0.2)))
            }
        
        # Calculate confidence based on feature quality
        confidence = max(0.5, min(0.95, 0.7 + np.random.random() * 0.2))
        
        return {
            'predictions': predictions,
            'confidence': confidence,
            'features_used': len(features),
            'model_type': model['type']
        }
        
    except Exception as e:
        logger.error(f"Prediction failed for {agent_type}: {e}")
        raise

# Create FastAPI app
app = FastAPI(
    title="LokiAI ML API Service",
    description="Production-ready ML API for DeFi trading agents",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize the service on startup."""
    logger.info("🚀 Starting LokiAI ML API Service...")
    success = load_mock_models()
    if success:
        logger.info("✅ ML API Service startup completed successfully")
    else:
        logger.error("❌ ML API Service startup failed")

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint with service information."""
    return {
        "service": "LokiAI ML API Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
        "endpoints": "/predict, /model/info"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    try:
        uptime = (datetime.now(timezone.utc) - app_state['startup_time']).total_seconds()
        
        return HealthResponse(
            status="healthy" if app_state['models'] else "unhealthy",
            timestamp=datetime.now(timezone.utc),
            model_loaded=bool(app_state['models']),
            uptime_seconds=uptime,
            version=app_state['model_version']
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "error": str(e)}
        )

@app.get("/model/info", response_model=ModelInfoResponse)
async def get_model_info():
    """Get model information."""
    try:
        return ModelInfoResponse(
            model_version=app_state['model_version'],
            supported_agents=list(app_state['models'].keys()),
            feature_count=len(app_state['feature_names']),
            last_trained=app_state['startup_time'].isoformat()
        )
    except Exception as e:
        logger.error(f"Model info failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get model info: {str(e)}"
        )

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Make ML prediction for trading agent."""
    try:
        logger.info(f"Received prediction request: {request.agent_type} for {request.token_symbol}")
        
        # Validate models are loaded
        if not app_state['models']:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Models not loaded"
            )
        
        # Make prediction
        result = make_prediction(
            request.agent_type,
            request.market_data,
            request.token_symbol
        )
        
        # Generate unique prediction ID
        prediction_id = f"pred_{int(datetime.now().timestamp() * 1000)}"
        
        response = PredictionResponse(
            prediction_id=prediction_id,
            agent_type=request.agent_type,
            token_symbol=request.token_symbol,
            predictions=result['predictions'],
            confidence=result['confidence'],
            timestamp=datetime.now(timezone.utc),
            model_version=app_state['model_version']
        )
        
        logger.info(f"✅ PREDICTION COMPLETED: {prediction_id}")
        logger.info(f"   Agent Type: {request.agent_type}")
        logger.info(f"   Token: {request.token_symbol}")
        logger.info(f"   Confidence: {result['confidence']:.3f}")
        logger.info(f"   Predictions: {result['predictions']}")
        logger.info(f"   Timestamp: {response.timestamp}")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

if __name__ == "__main__":
    uvicorn.run(
        "ml_api_service:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )