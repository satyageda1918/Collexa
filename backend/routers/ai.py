from fastapi import APIRouter, Depends, HTTPException
import joblib
import os
import pandas as pd
from pydantic import BaseModel
import dependencies, models

router = APIRouter()

class PredictionInput(BaseModel):
    attendance_pct: float
    internal_marks: float
    assignment_scores: float
    gpa: float

class PredictionOutput(BaseModel):
    risk_level: str

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml", "performance_model.pkl")

@router.post("/predict", response_model=PredictionOutput)
async def predict_performance(
    input_data: PredictionInput,
    current_user: models.User = Depends(dependencies.get_current_user)
):
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(status_code=500, detail="ML Model not found. Please train it first.")
    
    model = joblib.load(MODEL_PATH)
    
    # Prepare data for prediction
    features = pd.DataFrame([input_data.dict()])
    
    prediction = model.predict(features)[0]
    
    return {"risk_level": prediction}
