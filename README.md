# Campus Ghostbusters 👻

Campus Ghostbusters is a multiplayer game prototype with a React-based frontend and a FastAPI backend. 

## Tech Stack

### Frontend
- **Framework**: React with Vite
- **Styling**: Tailwind CSS, Radix UI, Emotion
- **Routing**: React Router
- **Icons**: Lucide React, MUI Icons

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL (with SQLAlchemy SQL toolkit)
- **ASGI Server**: Uvicorn
- **Data Validation**: Pydantic

## 📂 Project Structure
- `/frontend`: Contains the React/Vite web application.
- `/backend`: Contains the FastAPI server and database configuration.

## 🛠️ Setup & Installation

### Prerequisites
- Node.js & npm (or pnpm)
- Python 3.8+
- PostgreSQL

### 1. Frontend Setup
Navigate to the frontend directory:
```bash
cd frontend
npm install
npm run dev
```

### 2. Backend Setup
Navigate to the backend directory, create a virtual environment, and install dependencies:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
```
Run the FastAPI server:
```bash
uvicorn main:app --reload
```

## Features
- Frontend built with modern React features and Radix UI components.
- Backend powered by high-performance FastAPI framework.
- Ready for full-stack integration and database connectivity with SQLAlchemy.