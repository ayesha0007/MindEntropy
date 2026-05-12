from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import numpy as np
import joblib
from scipy.stats import entropy
import uvicorn

app = FastAPI()


app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


try:
    model = joblib.load('mental_model.pkl')
except Exception as e:
    print(f"Error: 'mental_model.pkl' not found!: {e}")

class PHQInput(BaseModel):
    responses: list

@app.post("/analyze")
async def analyze(data: PHQInput):
    res = data.responses
    
    
    if len(res) != 9:
        return {"error": "needed 9 questionnaire answer"}

    
    total_score = sum(res)
    
    
    _, counts = np.unique(res, return_counts=True)
    shannon = float(entropy(counts/len(res), base=2))
    
    # Sample Entropy approximation (standardized for the model)
    sample_ent = float(np.std(res) * 0.5)
    
    # Permutation/Complexity approximation
    diff_val = np.diff(res)
    perm_ent = float(len(np.unique(diff_val)) / 3.0)

    
    features = np.array([[float(total_score), shannon, sample_ent, perm_ent]])
    
    try:
       
        conf = float(np.max(model.predict_proba(features)) * 100)
    except:
        conf = 100.0 # fallback

   
    
    if total_score >= 20:
        severity = "Severe"
    elif total_score >= 15:
        severity = "Moderately Severe"
    elif total_score >= 10:
        severity = "Moderate"
    elif total_score >= 5:
        severity = "Mild"
    else:
        severity = "Minimal"

    return {
        "severity": severity,
        "confidence": round(conf, 2),
        "score": int(total_score),
        "shannon": round(shannon, 3),
        "sample": round(sample_ent, 3),
        "permutation": round(perm_ent, 3)
    }

@app.get("/")
async def home(request: Request):
    # FastAPI template rendering
    return templates.TemplateResponse(
        request=request, 
        name="index.html", 
        context={}
    )

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)