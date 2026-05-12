import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from scipy.stats import entropy

def calculate_complex_entropy(res):
   
    _, counts = np.unique(res, return_counts=True)
    probs = counts / len(res)
    shannon = entropy(probs, base=2)
    sample_ent = np.std(res) * 0.5 
    
    
    perm_ent = len(np.unique(np.diff(res))) / 3.0
    
    return shannon, sample_ent, perm_ent


df = pd.read_csv('data/Updated Processed Diu.csv')
phq_cols = ['PHQ1', 'PHQ2', 'PHQ3', 'PHQ4', 'PHQ5', 'PHQ6', 'PHQ7', 'PHQ8', 'PHQ9']


X = []
for _, row in df.iterrows():
    res = row[phq_cols].values
    total = sum(res)
    sh, sa, pe = calculate_complex_entropy(res)
    X.append([total, sh, sa, pe])

X = np.array(X)
y = pd.factorize(df['Depression Label'])[0] # Label encoding


model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)


joblib.dump(model, 'mental_model.pkl')
print("✅ Model trained with Entropy-Enhanced Features and Saved!")