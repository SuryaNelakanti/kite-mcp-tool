import os
from dotenv import load_dotenv
load_dotenv()                          # pulls from .env at project root

class ChatConfig:
    api_key: str = os.getenv("OPENAI_API_KEY")
    model:   str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    base:    str | None = os.getenv("OPENAI_BASE_URL")

    @classmethod
    def validate(cls) -> None:
        if not cls.api_key:
            raise RuntimeError("No OPENAI_API_KEY in env")
ChatConfig.validate() 