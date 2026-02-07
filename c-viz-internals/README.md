# C-Viz Internals

An interactive C code visualization tool that helps developers understand compiler internals through visual representations of AST, Control Flow Graphs, LLVM IR, and more.

![C-Viz Internals](https://img.shields.io/badge/C--Viz-Internals-blue?style=for-the-badge)

## ✨ Features

### 🌳 Abstract Syntax Tree (AST) Visualizer
- Interactive tree visualization of C code structure
- Zoom, pan, and collapse nodes
- Click nodes to highlight corresponding source code

### 📊 Control Flow Graph (CFG)
- Visual representation of program control flow
- Basic blocks with entry/exit points
- Supports conditionals, loops, and switch statements

### ⚡ Preprocessor Expansion
- Side-by-side view of original vs preprocessed code
- Macro expansion visualization
- Include file resolution

### 🔧 Optimization Lab (LLVM IR)
- Compare unoptimized (-O0) vs optimized (-O3) LLVM IR
- Syntax-highlighted IR code
- See real compiler optimizations in action

### 📚 Stack Frame Visualizer
- Animated recursion visualization
- Step-by-step call stack simulation
- Teaches recursion through visual feedback

### 📈 Static Analysis
- Symbol table extraction
- Variable type analysis
- Compiler diagnostics with severity levels

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- LLVM/Clang installed

### Using Docker (Recommended)

```bash
git clone <repo>
cd c-viz-internals
docker-compose up --build
```

Access the app at `http://localhost:5173`. The API will be available at `http://localhost:8000`.

**Custom API URL:**
To use a different API URL, modify `docker-compose.yml` under `frontend > build > args`.

Access the app at `http://localhost:5173`

### Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/parse` | POST | Parse C code and return AST |
| `/api/cfg` | POST | Build Control Flow Graph |
| `/api/preprocess` | POST | Run preprocessor |
| `/api/optimize` | POST | Generate LLVM IR (O0 vs O3) |
| `/api/health` | GET | Health check |

**Request Format:**
```json
{
  "code": "#include <stdio.h>\nint main() { return 0; }"
}
```

## 🛠️ Tech Stack

### Frontend
- React 19 + Vite
- Monaco Editor
- React Flow (graph visualization)
- Lucide Icons
- driver.js (guided tour)

### Backend
- FastAPI
- libclang (AST parsing)
- LLVM (IR generation)

## 📁 Project Structure

```
c-viz-internals/
├── backend/
│   ├── main.py           # FastAPI server
│   ├── ast_parser.py     # AST parsing with libclang
│   ├── cfg_builder.py    # CFG construction
│   ├── optimizer.py      # LLVM IR generation
│   ├── preprocessor.py   # C preprocessor
│   └── static_analyzer.py
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── context/      # ASTContext provider
│   │   └── utils/        # Helper functions
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 📖 Usage Examples

### Visualize a Recursive Function
```c
int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
```

1. Paste the code in the editor
2. Click **Visualize** to see the AST
3. Click **Stack** icon to see recursion simulation

### Compare Optimizations
```c
int sum(int arr[], int n) {
    int total = 0;
    for (int i = 0; i < n; i++)
        total += arr[i];
    return total;
}
```

1. Click **Beaker** icon for Optimization Lab
2. Compare O0 vs O3 LLVM IR
3. See loop unrolling and vectorization

## 🚀 Deployment Guide

This project is set up for easy deployment: **Backend on Render** and **Frontend on Vercel**.

### Prerequisites
1. Push this code to a GitHub repository.

### Step 1: Deploy Backend (Render)
1. Log in to [Render](https://render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Settings:
   - **Root Directory**: `backend`
   - **Runtime**: Docker
   - **Instance Type**: Free
5. **Environment Variables**:
   - `ALLOWED_ORIGINS`: `https://your-vercel-app-url.vercel.app` (You'll get this URL in Step 2, come back and update it!)
6. Click **Create Web Service**.
7. Copy the **Service URL** (e.g., `https://c-viz-backend.onrender.com`).

### Step 2: Deploy Frontend (Vercel)
1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Environment Variables**:
   - `VITE_API_URL`: Paste your Render Backend URL here (e.g., `https://c-viz-backend.onrender.com`).
6. Click **Deploy**.

### Step 3: Final Link
1. Once Vercel deploys, copy the **Frontend URL**.
2. Go back to Render Dashboard -> Environment Variables.
3. Update `ALLOWED_ORIGINS` with your new Vercel URL.
4. Render will auto-redeploy.

🎉 **Done!** Your app is live.

## 📝 License

MIT License - See [LICENSE](LICENSE) for details.
