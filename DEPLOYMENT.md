# Deployment Guide - AI CRM Importer

This guide outlines how to deploy the AI CRM Importer (Express Backend + Next.js Frontend) to cloud services for production.

---

## 🏗️ 1. Environment Configurations

### Backend Environment Variables
Create these variables in your hosting environment (e.g. Render / Railway):
* `NODE_ENV=production`
* `PORT=3001` (or whatever the host assigns)
* `GEMINI_API_KEY=AIzaSy...` (your Google Gemini API key)
* **Optional Persistent Volumes Paths**:
  * `DATA_DIR=/var/lib/importer/data`
  * `UPLOADS_DIR=/var/lib/importer/uploads`

### Frontend Environment Variables
Set this variable during the static build phase of your frontend hosting (e.g. Vercel):
* `NEXT_PUBLIC_API_URL=https://your-backend-api-url.com`

---

## 🚀 2. Deploying the Backend (API)

Because the backend saves temporary CSV uploads and JSON log sessions on disk, you should deploy to a platform that supports **Persistent Disk Volumes** (like **Render** or **Railway**).

### Option A: Render (Web Service)
1. Link your GitHub repository.
2. Choose **Web Service** with runtime **Node**.
3. Set the build and start configurations:
   * **Root Directory**: `backend`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm run start`
4. Add the environment variables from section 1.
5. **CRITICAL: Mount a Persistent Disk**:
   * Go to **Advanced** > **Add Disk**.
   * Mount Path: `/var/lib/importer` (and set `DATA_DIR=/var/lib/importer/data` and `UPLOADS_DIR=/var/lib/importer/uploads` in your Env variables tab so that files and logs survive server restarts!).

### Option B: Railway
1. Add a new service from your GitHub repo.
2. Set the root directory configuration to `backend`.
3. Add your environment variables.
4. Go to **Settings** > **Volumes** > **Add Volume** to mount a persistent disk directory.

---

## 💻 3. Deploying the Frontend (Next.js)

Since the frontend is a standard Next.js application, it is best suited for static serverless platforms like **Vercel** or **Netlify**.

### Option A: Vercel
1. Go to Vercel, click **Add New Project**, and import your repository.
2. In the configuration settings:
   * **Root Directory**: Select `frontend`.
   * **Build Command**: `next build` (Vercel automatically detects this).
   * **Install Command**: `npm install` (Vercel automatically detects this).
3. In **Environment Variables**, add `NEXT_PUBLIC_API_URL` pointing to your backend URL.
4. Click **Deploy**. Vercel will handle building, optimizing, and serving the React client.

---

## 🛠️ 4. Local Production Test
To test production mode locally:

1. **Build and Run Backend**:
   ```bash
   cd backend
   npm install
   npm run build
   npm run start
   ```
2. **Build and Run Frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run build
   npm run start
   ```
