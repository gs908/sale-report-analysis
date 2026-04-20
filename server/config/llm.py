import os
from pathlib import Path
from typing import Any

import yaml


def _load_yaml_config(filename: str) -> dict[str, Any]:
    config_dir = Path(__file__).parent
    config_path = config_dir / filename
    if not config_path.exists():
        return {}
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


_llm_config: dict[str, Any] = {}


def load_llm_config() -> dict[str, Any]:
    global _llm_config
    _llm_config = _load_yaml_config("llm_config.yaml")
    return _llm_config


def get_llm_config() -> dict[str, Any]:
    if not _llm_config:
        load_llm_config()
    return _llm_config
