# COLLEXA - AI-Powered College ERP System

A production-ready ERP system for modern colleges with granular, department-specific portals.

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, MySQL, JWT, Bcrypt, Pydantic
- **Frontend**: React.js, Tailwind CSS, Lucide Icons, Axios
- **AI Module**: Scikit-learn (RandomForestClassifier), Pandas, Joblib

## Features

### Departmental Portals
- **Student Dashboard**: QR attendance scan, fee history, mark sheets, faculty feedback.
- **Faculty Portal**: QR code generation, enrollment management, profile tracking.
- **Super Admin**: Full directory management, system stats, access to all departmental modules.
- **Admission Desk**: Application review, student account auto-seeding.
- **Exam & Admin Cell**: Results publication, Question Paper generation, Academic protocol control.
- **Account Section**: Fee processing, revenue ledgers, payment recording.

### AI Risk Analytics
- Predicts student risk level (Low, Medium, High) based on attendance, marks, and GPA.
- Real-time performance insights for teachers and administrators.

## Project Structure

- `backend/`: FastAPI application, SQL database models, and AI logic.
- `frontend/`: React single-page application with a premium dark/glassmorphism UI.

## Setup Instructions

### Local Backend Setup
1. Navigate to `backend/`
2. Create a virtual environment: `python -m venv myenv`
3. Activate it: `myenv\Scripts\activate` (Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Configure `.env` with your DB credentials.
6. Run the server: `uvicorn main:app --reload`

### Frontend Setup
1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`

## Default Access Credentials

| Department | Email | Password |
| --- | --- | --- |
| Super Admin | admin@college.com | Admin@123 |
| Student | student@college.com | Student@123 |
| Teacher | teacher@college.com | Teacher@123 |
| Admission Desk | admission@college.com | Admission@123 |
| Exam Cell | exam@college.com | Exam@123 |
| Account Section | account@college.com | Account@123 |

## API Layer
- `POST /token`: Unified authentication.
- `GET /staff/...`: Departmental endpoints (Admission, Exam, Accounts).
- `GET /student/...`: Student specific logic.
- `GET /teacher/...`: Faculty specific logic.
- `GET /admin/...`: Administrative control.
