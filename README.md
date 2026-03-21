# Orchestra-LLM-Complaint_resolver

## How to Run the Project

This project contains a FastAPI backend and a Next.js frontend. Follow the instructions below to set them up and run them locally.

### 1. Run the Backend (FastAPI + Python)

1. **Open a new terminal session** and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment** (recommended to keep dependencies isolated):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. **Install dependencies**:
   Run `pip install -r requirements.txt`. If you don't have one, install the core dependencies:
   ```bash
   pip install fastapi uvicorn pydantic python-dotenv langgraph google-generativeai
   ```

4. **Environment Variables**:
   Ensure you have a `.env` file in the `backend/` directory with the necessary keys (like `GEMINI_API_KEY`).

5. **Start the FastAPI server**:
   ```bash
   uvicorn main:app --reload
   ```
   *Your backend API will now be running, typically on `http://localhost:8000`.*

---

### 2. Run the Frontend (Next.js + Prisma)

1. **Open a second terminal session** and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Set up the Database (Prisma)**:
   Ensure you have a `.env` file inside the `frontend/` folder with your `DATABASE_URL` (SQLite or PostgreSQL) and `NEXTAUTH_SECRET`. Then, synchronize your Prisma schema with the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Seed the Database** (if you have seed data):
   ```bash
   npx prisma db seed
   ```

5. **Start the Next.js development server**:
   ```bash
   npm run dev
   ```
   *Your frontend application will now be running, typically on `http://localhost:3000`.*

