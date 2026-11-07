import os
import socket
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

logger = logging.getLogger("uvicorn.error")

Base = declarative_base()

def check_postgres_port(db_url: str, timeout_sec: float = 0.5) -> bool:
    """Quick socket probe to check if PostgreSQL port is actively listening."""
    try:
        # Default host & port
        host = "localhost"
        port = 5432
        if "@" in db_url:
            host_part = db_url.split("@")[-1].split("/")[0]
            if ":" in host_part:
                host, port_str = host_part.split(":")
                port = int(port_str)
            else:
                host = host_part
        with socket.create_connection((host, port), timeout=timeout_sec):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False

def get_engine():
    """Connects to PostgreSQL if reachable, otherwise uses SQLite fallback."""
    db_url = settings.DATABASE_URL
    
    if "postgresql" in db_url and check_postgres_port(db_url):
        try:
            pg_engine = create_engine(
                db_url,
                connect_args={"connect_timeout": 2},
                pool_pre_ping=True
            )
            with pg_engine.connect() as conn:
                try:
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                    conn.commit()
                    logger.info("pgvector extension ready in PostgreSQL.")
                except Exception as ext_err:
                    logger.info(f"Note on pgvector extension: {ext_err}")
                logger.info("Connected to PostgreSQL database.")
                return pg_engine
        except Exception as e:
            logger.warning(f"PostgreSQL connection failed ({e}), falling back to SQLite.")

    # SQLite fallback for zero-dependency execution
    logger.info(f"Using SQLite fallback engine: {settings.SQLITE_FALLBACK_URL}")
    return create_engine(
        settings.SQLITE_FALLBACK_URL, 
        connect_args={"check_same_thread": False}
    )

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
