# AI CRM Importer

A modern full-stack application for importing CSV data into a CRM system. Built with Next.js, Express, TypeScript, and real-time progress tracking.

## 🎯 Features

### Frontend (Next.js 16.2.10)
- ✅ **Drag & Drop Upload** — Easy CSV file selection
- ✅ **Real-time Validation** — Immediate feedback on file issues
- ✅ **Interactive Preview** — Sort, filter, and paginate CSV data
- ✅ **Column Management** — Show/hide columns dynamically
- ✅ **Real-time Progress** — Live import status updates
- ✅ **Results Dashboard** — Color-coded import statistics
- ✅ **Dark Mode** — Full light/dark theme support
- ✅ **Responsive Design** — Works on desktop, tablet, mobile

### Backend (Express.js)
- ✅ **CSV Import API** — Async batch processing
- ✅ **Data Validation** — Email format, required fields
- ✅ **Progress Tracking** — Real-time status polling
- ✅ **Session Management** — 24-hour session retention
- ✅ **CORS Enabled** — Frontend communication ready
- ✅ **Error Handling** — Structured error responses

## 📊 Project Status

| Task | Status |
|------|--------|
| AI Integration (ai.service.ts, crm.prompt.ts) | ✅ Completed |
| Batch Processing (batch.service.ts) | ✅ Completed |
| AI Response Transformation (crm.transformer.ts) | ✅ Completed |
| CRM Validation (crm.validator.ts) | ✅ Completed |
| Import Route Refactor (dynamic batch sizing, progress messages) | ✅ Completed |
| Documentation (README, DEPLOYMENT) | ✅ Updated |
| Testing Suite | ❓ Not started |
| Deployment Pipeline (Docker/CI) | ❓ Not started |

## 📋 Project Structure

```
AI-CRM-Importer/
├── frontend/                    # Next.js Application
│   ├── app/                    # App Router pages
│   ├── components/             # React components
│   │   ├── layout/            # Layout components
│   │   ├── upload/            # Upload features
│   │   ├── preview/           # CSV preview table
│   │   ├── processing/        # Import progress
│   │   ├── result/            # Results dashboard
│   │   └── shared/            # Reusable components
│   ├── hooks/                 # Custom React hooks
│   ├── services/              # API service layer
│   ├── types/                 # TypeScript types
│   ├── utils/                 # Utility functions
│   ├── SPRINT_*.md            # Sprint documentation
│   └── package.json
│
├── backend/                     # Express.js Application
│   ├── src/
│   │   ├── server.ts          # Express app setup
│   │   ├── storage.ts         # Session storage
│   │   └── routes/            # API endpoints
│   │       ├── import.ts      # Import endpoint
│   │       ├── validate.ts    # Validation endpoint
│   │       └── progress.ts    # Progress endpoint
│   ├── main.ts                # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser

### Installation & Running

#### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

#### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

#### 3. Start Backend Server (Terminal 1)
```bash
cd backend
npm run dev
```
Expected output:
```
✓ Server running on http://localhost:3001
✓ CORS enabled for frontend
✓ Health check: GET http://localhost:3001/health
```

#### 4. Start Frontend Application (Terminal 2)
```bash
cd frontend
npm run dev
```
Expected output:
```
▲ Next.js 16.2.10
- Local: http://localhost:3000
- Environments: .env.local
```

#### 5. Open Application
Navigate to: **http://localhost:3000**

## 📖 How to Use

### 1. **Upload CSV File**
- Click the upload area or drag & drop a CSV file
- File must be < 10MB
- Required columns: `name`, `email`

### 2. **Review Validation**
- System shows 5-point validation checklist
- Green ✓ if valid, Red ✗ if issues
- Specific error messages for each problem

### 3. **Preview Data (Optional)**
- Sort by any column (click header)
- Filter by keyword (type in filter box)
- Toggle columns on/off (show/hide)
- Navigate pages (10 rows per page)

### 4. **Start Import**
- Click "Start Import" button
- Progress bar shows real-time status
- Can't cancel once started

### 5. **View Results**
- See statistics: Imported, Failed, Skipped
- Scroll through imported records
- Each record shows status and any errors

## 🔌 API Endpoints

### Health Check
```
GET http://localhost:3001/health
```

### Validate CSV
```
POST /api/validate
Content-Type: application/json

{
  "rows": [{"name": "John", "email": "john@example.com"}],
  "headers": ["name", "email"]
}
```

### Submit Import
```
POST /api/import
Content-Type: application/json

{
  "rows": [...],
  "headers": [...]
}

Response: { "success": true, "sessionId": "import_..." }
```

### Check Progress
```
GET /api/progress/:sessionId
```

### Get Results
```
GET /api/import/:sessionId
```

## 📊 CSV Format Requirements

### Valid CSV File
```csv
name,email,phone,company
John Doe,john@example.com,555-1234,ACME Corp
Jane Smith,jane@example.com,555-5678,Tech Inc
```

### Requirements
- ✅ Headers: `name`, `email` (required)
- ✅ Additional columns allowed
- ✅ No empty required fields
- ✅ Valid email format
- ✅ File size < 10MB
- ✅ UTF-8 encoding

### Will Fail
- ❌ Missing `name` or `email` column
- ❌ Rows with empty name/email
- ❌ Invalid email format
- ❌ File > 10MB
- ❌ Non-CSV format

## 🧪 Testing

### Test with Sample CSV

1. Create a file `test.csv`:
```csv
name,email,phone
John Doe,john@example.com,555-1234
Jane Smith,jane@example.com,555-5678
Bob Johnson,invalid-email,555-9999
```

2. Upload via UI
3. View validation results
4. Start import
5. Check results

## 🛠️ Development

### Frontend Development
```bash
cd frontend
npm run dev       # Start dev server
npm run build     # Build for production
npm run lint      # Run ESLint
```

### Backend Development
```bash
cd backend
npm run dev       # Start with ts-node
npm run build     # Compile TypeScript
npm run start     # Run compiled version
npm run type-check # Check types
```

## 📝 Sprint Documentation

- **Sprint 1**: Project scaffold, types, services, state machine
- **Sprint 2**: UI polish, animations, component library
- **Sprint 3**: File validation, error messages, file info display
- **Sprint 4**: CSV preview with sorting, filtering, pagination
- **Sprint 5**: Real backend API integration, progress tracking

Each sprint has comprehensive documentation in:
- `frontend/SPRINT_1.md`
- `frontend/SPRINT_2.md`
- `frontend/SPRINT_3.md`
- `frontend/SPRINT_4.md`
- `frontend/SPRINT_5.md`

## 🎨 Tech Stack

### Frontend
- **Framework**: Next.js 16.2.10 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4 with dark mode
- **HTTP**: Axios 1.18.1
- **Components**: React 19.2.4 with custom hooks
- **UI Elements**: Base UI, shadcn components

### Backend
- **Framework**: Express.js 4.18
- **Language**: TypeScript (strict mode)
- **CORS**: Enabled for all origins (development)
- **Port**: 3001 (configurable via PORT env var)
- **Storage**: In-memory (24-hour session retention)

### Development
- **Build**: Next.js CLI, TypeScript tsc
- **Dev Server**: ts-node (backend), next dev (frontend)
- **Type Checking**: TypeScript strict mode (100%)

## 📦 Build for Production

### Frontend
```bash
cd frontend
npm run build
npm run start
# Runs on http://localhost:3000
```

### Backend
```bash
cd backend
npm run build
npm run start
# Runs on http://localhost:3001
```

## 🚢 Deployment

### Vercel (Frontend)
```bash
# Push to GitHub
git push origin main
# Connect to Vercel dashboard
# Set environment variable: NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Backend Deployment Options
- Vercel Functions
- Heroku
- AWS Lambda + API Gateway
- Docker containers
- Self-hosted Node.js

## ⚙️ Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
```

## 📊 Performance

- **CSV Preview**: Loads 10 rows at a time (paginated)
- **Sorting**: O(n log n) client-side
- **Filtering**: O(n) client-side search
- **Import**: 100 rows per batch, async processing
- **Storage**: Auto-cleanup of sessions > 24h old

## 🔒 Security Notes

### Production Recommendations
1. Add authentication middleware
2. Enable HTTPS/TLS
3. Add rate limiting
4. Validate all inputs server-side
5. Use CSRF protection
6. Set CORS for specific origins
7. Add request signing
8. Use database instead of in-memory storage
9. Add error tracking (Sentry)
10. Enable security headers

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check port is free
lsof -i :3001

# Check dependencies installed
cd backend && npm install

# Check TypeScript config
npm run type-check
```

### Frontend can't connect to backend
```
NEXT_PUBLIC_API_URL must point to backend
Check backend is running on :3001
Check CORS is enabled
Check firewall/network issues
```

### Import fails
```
Check CSV has required columns (name, email)
Validate email format
Check file size < 10MB
See backend console for detailed error logs
```

## 📞 Support

- Check sprint documentation for features
- Review console for error messages
- Verify backend health: `curl http://localhost:3001/health`
- Check network tab in DevTools

## 📄 License

MIT

---

**Last Updated**: Sprint 5 Complete - Real Backend API Integration
