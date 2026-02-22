# AI-Powered College ERP System

A production-ready ERP system for colleges with distinct portals for Students, Teachers, Admins, and Office Staff.

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, MySQL, JWT, Bcrypt, Pydantic
- **Frontend**: React.js, Tailwind CSS, Axios
- **AI Module**: Scikit-learn (RandomForestClassifier), Pandas, Joblib

## Features

### Portals
- **Student Portal**: QR attendance scan, fee payment/history, report cards, faculty feedback, performance prediction.
- **Teacher Portal**: QR code generation for attendance, session planning, leave requests, risk analytics.
- **Admin Portal**: User management, leave request approval, department/subject setup.
- **Office Portal**: Fee management, payment recording, financial analytics.

### AI Student Performance Prediction
- Predicts student risk level (Low, Medium, High) based on attendance, marks, and GPA.
- Uses a RandomForestClassifier model.

## Setup Instructions

### Prerequisites
- Python 3.9+
- MySQL Server
- Docker & Docker Compose (optional but recommended)

### Local Backend Setup
1. Navigate to `backend/`
2. Create a virtual environment: `python -m venv venv`
3. Activate it: `source venv/bin/activate` (Linux/Mac) or `venv\Scripts\activate` (Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Configure `.env` with your DB credentials.
6. Run seed script: `python seed_data.py`
7. Run the server: `uvicorn main:app --reload`

## Portal Credentials (Default)

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@college.com | Admin@123 |
| Student | student@college.com | Student@123 |
| Teacher | teacher@college.com | Teacher@123 |
| Office | office@college.com | Office@123 |

## API Endpoints
- `POST /token`: Login to get JWT.
- `GET /users/me`: Get current user profile.
- `POST /ai/predict`: Performance prediction.
- `...`: Portal specific endpoints under `/student`, `/teacher`, `/admin`, `/office`.
