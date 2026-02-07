from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ast_parser import parse_c_code
from cfg_builder import build_cfg
from preprocessor import preprocess_c_code
from optimizer import optimize_code

from libclang_setup import configure_libclang

# Configure libclang environment
configure_libclang()

import os

app = FastAPI(title="C-Viz Internals API")

# Get allowed origins from environment variable
origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174")
origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ParseRequest(BaseModel):
    """Request model for C code parsing."""
    code: str

# ... existing endpoints ...

@app.get("/")
async def root():
    """Root endpoint to verify backend status."""
    return {"message": "C-Viz Internals API is running. Visit /docs for API documentation."}


@app.post("/api/optimize")
async def optimize_source_code(request: ParseRequest):
    """
    Generate optimized vs unoptimized LLVM IR.
    """
    result = optimize_code(request.code)
    return result


@app.get("/api/health")
async def health_check():
    """Health check endpoint to verify backend is running."""
    return {"status": "healthy", "message": "C-Viz Internals Backend is running"}


@app.post("/api/parse")
async def parse_code(request: ParseRequest):
    """
    Parse C source code and return AST structure.
    """
    result = parse_c_code(request.code)
    return result


@app.post("/api/cfg")
async def get_cfg(request: ParseRequest):
    """
    Build Control Flow Graph from C source code.
    """
    result = build_cfg(request.code)
    return result


@app.post("/api/preprocess")
async def preprocess_code(request: ParseRequest):
    """
    Run C preprocessor to expand macros and includes.
    """
    result = preprocess_c_code(request.code)
    return result
