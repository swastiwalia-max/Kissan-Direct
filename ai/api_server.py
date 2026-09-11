#!/usr/bin/env python3
"""
================================================================================
  SIH26033 — FastAPI Prediction Server
  Agricultural Price & Demand Prediction API
================================================================================
  
  Run:
    uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload

  Docs:
    http://localhost:8000/docs  (Swagger UI)
    http://localhost:8000/redoc (ReDoc)
================================================================================
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import json
import os

# --- Import the prediction engine ---
# NOTE: Copy the AgriPredictionEngine class and its dependencies
#       or restructure as a package. For simplicity, we import from
#       the training script.
import sys
sys.path.insert(0, os.path.dirname(__file__))

# You'll need these imports in production:
import joblib
import numpy as np
import pandas as pd

# ──────────────────────────────────────────────
# Re-include the AgriPredictionEngine class here or import it.
# For production, refactor into a proper Python package:
#   agri_ml/
#     __init__.py
#     config.py
#     preprocessing.py
#     engine.py
#     api/
#       server.py
#       schemas.py
# ──────────────────────────────────────────────

# ═══════════════════════════════════════════════
# SCHEMAS
# ═══════════════════════════════════════════════

class PredictionInput(BaseModel):
    """Input schema for prediction requests."""
    state: str = Field(..., description="State name", example="Uttar Pradesh")
    district: str = Field(..., description="District name", example="Lucknow")
    crop: str = Field(..., description="Crop name", example="Wheat")
    year: int = Field(..., description="Year", example=2025, ge=2012, le=2030)
    season: str = Field(..., description="Season", example="Rabi")
    area: float = Field(..., description="Area in hectares", example=5000, gt=0)
    production: Optional[float] = Field(None, description="Production in tonnes")
    yield_val: Optional[float] = Field(None, description="Yield in tonnes/hectare", alias="yield")
    msp_rs_per_quintal: float = Field(..., description="MSP in Rs per quintal", example=1625, gt=0)
    n_price_reports: Optional[float] = Field(None, description="Number of market price reports")
    market_price_rs_per_quintal: Optional[float] = Field(None, description="Known market price if available")
    estimated_value_inr: Optional[float] = Field(None, description="Estimated value in INR")
    estimated_value_market_inr: Optional[float] = Field(None, description="Estimated market value in INR")

    class Config:
        populate_by_name = True

class FarmerPredictionResponse(BaseModel):
    predictions: dict
    margin_analysis: dict
    advisory: List[str]

class BuyerPredictionResponse(BaseModel):
    predictions: dict
    market_intelligence: dict

class MarginCheckInput(BaseModel):
    msp: float = Field(..., gt=0)
    market_price: float = Field(..., gt=0)
    crop: str
    state: str

class MarginCheckResponse(BaseModel):
    margin_spread: float
    margin_pct: float
    is_excessive: bool
    is_below_msp: bool
    alert_level: str
    recommendation: str

class HealthResponse(BaseModel):
    status: str
    models_loaded: List[str]
    version: str


# ═══════════════════════════════════════════════
# APP INITIALIZATION
# ═══════════════════════════════════════════════

app = FastAPI(
    title="SIH26033 — Agri Price Prediction API",
    description=(
        "Dual-sided prediction engine for agricultural price discovery. "
        "Helps farmers get fair prices and buyers make informed procurement decisions. "
        "Built for Smart India Hackathon 2026 — Problem Statement SIH26033."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow all origins for hackathon (restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the prediction engine at startup
MODEL_DIR = os.environ.get("MODEL_DIR", "./models")
engine = None  # Will be initialized on startup

@app.on_event("startup")
async def startup():
    global engine
    # Import and initialize the engine
    # In production, import from your package:
    from SIH26033_AgriPrice_DualSided_ML_Pipeline import AgriPredictionEngine
    engine = AgriPredictionEngine(MODEL_DIR)
    print(f"✅ Prediction engine loaded with {len(engine.models)} models")


# ═══════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════

@app.get("/api/v1/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Check API health and loaded models."""
    return HealthResponse(
        status="healthy" if engine else "not_ready",
        models_loaded=list(engine.models.keys()) if engine else [],
        version="1.0.0",
    )


@app.post("/api/v1/predict/farmer", response_model=FarmerPredictionResponse, tags=["Farmer"])
async def predict_farmer(input_data: PredictionInput):
    """
    **Farmer-Side Predictions**

    Returns:
    - Fair farmgate price per quintal
    - Expected production volume
    - Yield forecast
    - Intermediary margin analysis
    - Actionable advisory
    """
    if not engine:
        raise HTTPException(status_code=503, detail="Engine not ready")

    input_dict = input_data.model_dump(by_alias=True)
    # Rename yield alias
    if 'yield' not in input_dict and 'yield_val' in input_dict:
        input_dict['yield'] = input_dict.pop('yield_val')

    result = engine.predict_farmer_side(input_dict)
    return FarmerPredictionResponse(**result)


@app.post("/api/v1/predict/buyer", response_model=BuyerPredictionResponse, tags=["Buyer"])
async def predict_buyer(input_data: PredictionInput):
    """
    **Buyer-Side Predictions**

    Returns:
    - Expected market procurement price
    - Demand proxy index (0-100)
    - Supply forecast
    - Market intelligence & advisory
    """
    if not engine:
        raise HTTPException(status_code=503, detail="Engine not ready")

    input_dict = input_data.model_dump(by_alias=True)
    if 'yield' not in input_dict and 'yield_val' in input_dict:
        input_dict['yield'] = input_dict.pop('yield_val')

    result = engine.predict_buyer_side(input_dict)
    return BuyerPredictionResponse(**result)


@app.post("/api/v1/margin/check", response_model=MarginCheckResponse, tags=["Margin Analysis"])
async def check_margin(input_data: MarginCheckInput):
    """
    **Intermediary Margin Check**

    Quick check for margin exploitation between MSP and market price.
    """
    spread = input_data.market_price - input_data.msp
    pct = (spread / input_data.msp) * 100

    is_excessive = pct > 50
    is_below = spread < 0

    if is_below:
        alert = "CRITICAL"
        rec = (f"Market price for {input_data.crop} in {input_data.state} is BELOW MSP. "
               "Farmers should use government procurement channels.")
    elif is_excessive:
        alert = "WARNING"
        rec = (f"Excessive intermediary margin of {pct:.1f}% detected. "
               "Consider direct procurement or FPO channels to reduce costs.")
    elif pct > 25:
        alert = "MODERATE"
        rec = "Moderate intermediary margin. Monitor for price trends."
    else:
        alert = "NORMAL"
        rec = "Margins within acceptable range."

    return MarginCheckResponse(
        margin_spread=round(spread, 2),
        margin_pct=round(pct, 2),
        is_excessive=is_excessive,
        is_below_msp=is_below,
        alert_level=alert,
        recommendation=rec,
    )


@app.get("/api/v1/meta/crops", tags=["Metadata"])
async def get_supported_crops():
    """Get list of supported crops."""
    meta_path = os.path.join(MODEL_DIR, "integration_metadata.json")
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            meta = json.load(f)
        return meta["valid_inputs"]
    return {"error": "Metadata not found"}


@app.get("/api/v1/meta/models", tags=["Metadata"])
async def get_model_info():
    """Get information about loaded models and their performance."""
    meta_path = os.path.join(MODEL_DIR, "integration_metadata.json")
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            meta = json.load(f)
        return meta["models"]
    return {"error": "Metadata not found"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
