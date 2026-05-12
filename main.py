from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import numpy as np
import joblib
from scipy.stats import entropy
import uvicorn

app = FastAPI()

# স্ট্যাটিক ফাইল মাউন্ট করা
app.mount("/static", StaticFiles(directory="static"), name="static")

# টেমপ্লেট ডিরেক্টরি সেটআপ
templates = Jinja2Templates(directory="templates")

# মডেল লোড করা
try:
    model = joblib.load('mental_model.pkl')
except:
    print("Error: 'mental_model.pkl' খুঁজে পাওয়া যায়নি! আগে model_trainer.py রান করুন।")

class PHQInput(BaseModel):
    responses: list

@app.post("/analyze")
async def analyze(data: PHQInput):
    res = data.responses
    # নিশ্চিত করা যেন ৯টি উত্তরই থাকে
    if len(res) != 9:
        return {"error": "৯টি প্রশ্নের উত্তর প্রয়োজন"}

    total_score = sum(res)
    
    # এন্ট্রপি এক্সট্রাকশন
    _, counts = np.unique(res, return_counts=True)
    shannon = float(entropy(counts/len(res), base=2))
    sample_ent = float(np.std(res) * 0.5)
    # Permutation Complexity লজিক
    diff_val = np.diff(res)
    perm_ent = float(len(np.unique(diff_val)) / 3.0)

    # প্রেডিকশন (নিশ্চিত করা সব ভ্যালু float)
    features = np.array([[float(total_score), shannon, sample_ent, perm_ent]])
    
    pred_idx = int(model.predict(features)[0])
    conf = float(np.max(model.predict_proba(features)) * 100)
    
    labels = ["Minimal", "Mild", "Moderate", "Moderately Severe", "Severe"]
    
    return {
        "severity": labels[pred_idx],
        "confidence": round(conf, 2),
        "score": int(total_score),
        "shannon": round(shannon, 3),
        "sample": round(sample_ent, 3),
        "permutation": round(perm_ent, 3)
    }

@app.get("/")
async def home(request: Request):
    # লেটেস্ট Starlette/FastAPI ভার্সনে request সরাসরি প্রথম আর্গুমেন্ট হিসেবে দিতে হয়
    return templates.TemplateResponse(
        request=request, 
        name="index.html", 
        context={}  # এখানে চাইলে বাড়তি ডেটা পাঠাতে পারেন, না থাকলে খালি রাখলেও চলবে
    )

if __name__ == "__main__":
    # সরাসরি python main.py লিখে রান করার জন্য
    uvicorn.run(app, host="127.0.0.1", port=8000)