import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Factory Syndicate AI Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/smart_factory"
    )
    SQLITE_FALLBACK_URL: str = "sqlite:///./smart_factory_local.db"
    
    # Fleetbase API
    FLEETBASE_HOST: str = os.getenv("FLEETBASE_HOST", "http://localhost:8000")
    FLEETBASE_API_KEY: str = os.getenv("FLEETBASE_API_KEY", "flb_sandbox_key")
    
    # LLM Settings
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o")
    
    # Factory Defaults
    DEFAULT_FACTORY_NAME: str = "Apex Precision Fabrications Ltd."
    DEFAULT_FACTORY_CITY: str = "Pune"
    
    class Config:
        case_sensitive = True

settings = Settings()

