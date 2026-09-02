# 🚀 Deployment Instructions for RevPulse AI

---

## 1. Deploy Frontend to Vercel

1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Select your GitHub repository.
4. Set **Root Directory** to `frontend`.
5. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-service.onrender.com/api/v1`
6. Click **Deploy**. Vercel will automatically build and deploy your Next.js application.

---

## 2. Deploy FastAPI Backend to Render / Railway

### Render Deployment:
1. Log in to [Render](https://render.com) and click **New -> Web Service**.
2. Connect your GitHub repository.
3. Set **Root Directory** to `backend`.
4. Set **Runtime** to `Python 3`.
5. Build Command: `pip install -r requirements.txt && python seed_runner.py`
6. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
7. Set Environment Variables:
   - `OPENAI_API_KEY` = `sk-proj-...`
   - `OPENAI_MODEL` = `gpt-4o-mini`
   - `DATABASE_URL` = `sqlite+aiosqlite:///./revpulse.db`
8. Deploy Service.

---

## 3. Post-Deployment Verification

1. Access your Vercel frontend URL.
2. Click **"Run AI Agent"** or **"Seed 1K Data"** in the top navigation bar.
3. Verify metrics cards populate with live data from your Render FastAPI backend.
