# 🚀 AI CRM Importer

> **An AI-powered CRM CSV Importer that intelligently maps CSV files from different sources into a standardized CRM format using Google Gemini AI.**

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Express](https://img.shields.io/badge/Express-4-green)
![Gemini AI](https://img.shields.io/badge/Google-Gemini-orange)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🌐 Live Demo

**Frontend:**  
👉 https://ai-crm-importer-beta.vercel.app/

**Backend API:**  
👉 https://ai-crm-importer-u0sx.onrender.com

**GitHub Repository:**  
👉 https://github.com/Amanmulla7171/AI-CRM-Importer

---

# 📖 Project Overview

Organizations receive customer information from multiple sources such as:

- Facebook Ads
- Google Ads
- Excel Sheets
- CRM Exports
- Third-party Vendors

Each source has different column names and data formats.

Example:

| Facebook | Google | Excel | CRM |
|----------|----------|----------|----------|
| Full Name | Customer Name | Name | name |
| Email ID | Mail | Email | email |
| Contact | Mobile | Phone | mobile |

Manually mapping these columns into a CRM system is time-consuming and error-prone.

This project automates the entire workflow using AI.

---

# ✨ Features

## 🎨 Frontend

- ✅ Drag & Drop CSV Upload
- ✅ CSV Validation
- ✅ Interactive Data Preview
- ✅ Sorting
- ✅ Filtering
- ✅ Pagination
- ✅ Column Visibility Toggle
- ✅ Progress Tracking
- ✅ Results Dashboard
- ✅ Responsive Design
- ✅ Dark Mode Support

---

## ⚙️ Backend

- ✅ REST API
- ✅ Express + TypeScript
- ✅ Dynamic Batch Processing
- ✅ Session Management
- ✅ Real-time Progress Tracking
- ✅ Structured Error Handling
- ✅ CSV Validation
- ✅ Automatic Session Cleanup

---

## 🤖 AI Features

- ✅ Google Gemini Integration
- ✅ Intelligent Column Mapping
- ✅ Dynamic Prompt Engineering
- ✅ CRM Schema Transformation
- ✅ CRM Data Validation
- ✅ Deterministic JSON Output
- ✅ Optimized Low-Latency Processing

---

# 🏗 System Architecture

```text
                 Next.js Frontend

                        │

                REST API Communication

                        │

                Express.js Backend

                        │

        ┌─────────────────────────────────┐
        │                                 │
        ▼                                 ▼

    CSV Validation                 Session Storage

        │

        ▼

 Dynamic Batch Processing

        │

        ▼

 Google Gemini AI

        │

        ▼

 CRM Data Transformation

        │

        ▼

 CRM Validation

        │

        ▼

 Import Results
```

---

# 🔄 Application Workflow

```text
Upload CSV

      │

      ▼

Validate CSV

      │

      ▼

Preview Data

      │

      ▼

Start Import

      │

      ▼

Dynamic Batch Processing

      │

      ▼

Gemini AI Mapping

      │

      ▼

CRM Transformation

      │

      ▼

Validation

      │

      ▼

Store Results

      │

      ▼

Display Dashboard
```

---

# 🚀 Performance Optimizations

This project includes several production-oriented optimizations:

- Dynamic Batch Processing
- Optimized Gemini Prompt
- Temperature = 0.1
- Backend-driven Progress Messages
- Reduced API Calls
- Asynchronous Processing
- Session Cleanup
- Optimized Import Pipeline

---

# 🛠 Tech Stack

## Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Axios

---

## Backend

- Express.js
- TypeScript
- Google Gemini AI
- PapaParse
- Multer
- SQL.js

---

## Development

- Git
- GitHub
- Vercel
- Render

---

# 📂 Project Structure

```text
AI-CRM-Importer/

│

├── frontend/
│
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── utils/
│   └── package.json
│
├── backend/
│
│   ├── src/
│   │
│   ├── routes/
│   ├── services/
│   ├── validators/
│   ├── transformers/
│   ├── prompts/
│   ├── middleware/
│   ├── storage.ts
│   ├── database.ts
│   └── server.ts
│
├── README.md
└── LICENSE
```

---

# 📡 REST API

## Health Check

```http
GET /health
```

---

## Validate CSV

```http
POST /api/validate
```

---

## Start Import

```http
POST /api/import
```

---

## Import Progress

```http
GET /api/progress/:sessionId
```

---

## Import Result

```http
GET /api/import/:sessionId
```

---

# ⚡ Local Setup

## Clone Repository

```bash
git clone https://github.com/Amanmulla7171/AI-CRM-Importer.git

cd AI-CRM-Importer
```

---

## Backend

```bash
cd backend

npm install

npm run dev
```

Runs at

```
http://localhost:3001
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Runs at

```
http://localhost:3000
```

---

# 🌍 Environment Variables

## Frontend

Create:

```
frontend/.env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Backend

Create:

```
backend/.env
```

```env
PORT=3001

GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

---

# 📊 CSV Requirements

Supported:

- UTF-8 CSV
- Required Columns:
  - name
  - email

Additional columns are automatically mapped using AI.

Example:

```csv
name,email,phone,company
John Doe,john@example.com,9876543210,ABC Ltd
Jane Smith,jane@example.com,9988776655,XYZ Pvt Ltd
```

---



# 🚀 Deployment

## Frontend

Platform:

- Vercel

---

## Backend

Platform:

- Render

---

# 📈 Future Improvements

- PostgreSQL Database
- Redis Queue
- WebSocket Progress Updates
- Authentication
- Docker Support
- Export Results
- AI Confidence Score
- Multi-User Support
- Import History
- Audit Logs

---

# 🧪 Testing

Manual testing includes:

- CSV Upload
- CSV Validation
- Preview
- Import
- Progress Tracking
- Result Dashboard
- Error Handling

---

# 📚 Documentation

This repository includes sprint-based documentation covering the complete development process.

- Sprint 1
- Sprint 2
- Sprint 3
- Sprint 4
- Sprint 5

---

# 👨‍💻 Author

**Aman Mulla**

B.Tech Computer Science & Engineering (AI & ML)

GitHub:

https://github.com/Amanmulla7171


Email:

amanmulla4020@gamil.com

---

# ⭐ If you found this project helpful, consider giving it a Star!
