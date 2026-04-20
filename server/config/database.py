from pathlib import Path

import yaml
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase


def _load_yaml_config(filename: str) -> dict:
    config_dir = Path(__file__).parent
    config_path = config_dir / filename
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


_db_config: dict = {}


def load_db_config() -> dict:
    global _db_config
    _db_config = _load_yaml_config("database.yaml")
    return _db_config


def get_db_config() -> dict:
    if not _db_config:
        load_db_config()
    return _db_config


def _build_database_url(cfg: dict) -> str:
    host = cfg.get("host", "127.0.0.1")
    port = cfg.get("port", 3306)
    user = cfg.get("user", "root")
    password = cfg.get("password", "")
    database = cfg.get("database", "salers")
    charset = cfg.get("charset", "utf8mb4")
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}?charset={charset}"


# Load config on module import
_cfg = load_db_config()
DATABASE_URL = _build_database_url(_cfg)

pool_cfg = _cfg.get("pool", {})
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=pool_cfg.get("pool_pre_ping", True),
    pool_recycle=pool_cfg.get("pool_recycle", 3600),
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_all():
    """Create all tables - call once on startup"""
    Base.metadata.create_all(bind=engine)
