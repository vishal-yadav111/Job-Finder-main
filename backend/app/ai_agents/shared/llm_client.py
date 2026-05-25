import os
import logging
from dotenv import load_dotenv

from openai import OpenAI

logger = logging.getLogger(__name__)

load_dotenv()

api_key = os.getenv(
    "GROQ_API_KEY"
)



client = None
try:
    if api_key:
        client = OpenAI(
            api_key=api_key,
            base_url=(
                "https://api.groq.com/openai/v1"
            )
        )
    else:
        logger.error("GROQ_API_KEY is missing, AI client not initialized.")
except Exception as e:
    logger.error(f"Failed to initialize Groq OpenAI client: {e}")