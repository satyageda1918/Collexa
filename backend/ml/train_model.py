import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

# Sample training data
data = {
    'attendance_pct': [90, 40, 75, 55, 95, 30, 85, 60, 20, 80],
    'internal_marks': [85, 45, 70, 50, 90, 35, 80, 55, 30, 75],
    'assignment_scores': [9, 4, 7, 5, 10, 3, 8, 6, 2, 8],
    'gpa': [3.8, 2.0, 3.2, 2.5, 4.0, 1.8, 3.5, 2.2, 1.5, 3.0],
    'risk_level': ['Low', 'High', 'Low', 'Medium', 'Low', 'High', 'Low', 'Medium', 'High', 'Low']
}

df = pd.DataFrame(data)

X = df.drop('risk_level', axis=1)
y = df['risk_level']

# Create and train the model
model = RandomForestClassifier(n_estimators=100)
model.fit(X, y)

# Save the model
model_path = os.path.join(os.path.dirname(__file__), 'performance_model.pkl')
joblib.dump(model, model_path)

print(f"Model trained and saved to {model_path}")
