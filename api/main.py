from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import (
    graphs_router,
    nodes_router,
    testing_router,
    executions_router,
    analysis_router,
    attack_router,
)

app = FastAPI(
    title="LangGraph Testing Platform API",
    description="API for testing and red-teaming LangGraph agent systems",
    version="1.0.0",
)

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js default port
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(graphs_router)
app.include_router(nodes_router)
app.include_router(testing_router)
app.include_router(executions_router)
app.include_router(analysis_router)
app.include_router(attack_router)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "LangGraph Testing Platform API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "langgraph-testing-api"}

