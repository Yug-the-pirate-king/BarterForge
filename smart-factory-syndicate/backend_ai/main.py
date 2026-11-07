import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.seed import seed_database
from app.routes import dashboard, inventory, quotes, suppliers, fleetbase, agents, syndicate

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smart_factory_ai")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables are created and seed demo dataset
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("Verifying seed data...")
    seed_database()
    yield
    logger.info("Shutting down Smart Factory Syndicate AI Backend...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Agentic AI platform solving raw material overpayment and quote losses for small factory owners.",
    lifespan=lifespan,
)

# Enable CORS for Next.js frontend and Node gateway
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(inventory.router, prefix=settings.API_V1_STR)
app.include_router(quotes.router, prefix=settings.API_V1_STR)
app.include_router(suppliers.router, prefix=settings.API_V1_STR)
app.include_router(fleetbase.router, prefix=settings.API_V1_STR)
app.include_router(agents.router, prefix=settings.API_V1_STR)
app.include_router(syndicate.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "platform": "Smart Factory Syndicate AI Backend",
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "docs_url": "/docs",
        "fleetbase_host": settings.FLEETBASE_HOST,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

