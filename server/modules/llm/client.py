import json
import logging
import re
import threading
from typing import List

logger = logging.getLogger(__name__)

_semaphore = threading.Semaphore(3)

_client = None


def _get_client():
    """Get OpenAI SDK client (Volcano Engine endpoint)."""
    global _client
    if _client is None:
        from openai import OpenAI
        from config.llm import get_llm_config
        config = get_llm_config()
        api_key = config.get("api_key", "")
        api_base = config.get("api_base", "")
        if not api_key:
            raise ValueError("LLM api_key not configured in config/llm_config.yaml")
        if not api_base:
            raise ValueError("LLM api_base not configured in config/llm_config.yaml")
        _client = OpenAI(api_key=api_key, base_url=api_base)
    return _client


def _build_messages_text(messages: List[dict]) -> str:
    """Format messages into text for the prompt."""
    lines = []
    for msg in messages:
        lines.append(f"- id: {msg.get('id', '')}, sender: {msg.get('sender', '')}, text: {msg.get('text', '')}, time: {msg.get('time', '')}")
    return "\n".join(lines)


def analyze_messages_batch(messages: List[dict]) -> List[dict]:
    """
    Send batch of messages to LLM (Volcano Engine), return structured analysis.
    messages: [{"id": "001", "sender": "zhangsan", "text": "...", "time": "..."}]
    Returns: [{"id": "001", "tag": "...", "sender": "...", "reason": "..."}]
    """
    from config.llm import get_llm_config
    from .prompts import SYSTEM_PROMPT

    config = get_llm_config()
    model = config.get("model", "")
    if not model:
        raise ValueError("LLM model not configured in config/llm_config.yaml")

    client = _get_client()
    messages_text = _build_messages_text(messages)
    prompt = f"{SYSTEM_PROMPT}\n\n待分析消息：\n{messages_text}"

    # print(f"\n========== [LLM Prompt] ==========\n{prompt}\n==================================\n")

    with _semaphore:
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.0,
            )
            text = response.choices[0].message.content or ""
            # Extract JSON from markdown code block
            cleaned = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE | re.MULTILINE)
            cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE)
            result = json.loads(cleaned.strip())
            return result if isinstance(result, list) else []

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            return []
        except Exception as e:
            logger.error(f"LLM API call failed: {e}")
            return []
