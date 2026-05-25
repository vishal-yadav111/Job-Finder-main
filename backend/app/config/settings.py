from dotenv import load_dotenv

import os


load_dotenv()


DATABASE_URL = os.getenv(
    "DATABASE_URL"
)




if DATABASE_URL is None:

    raise Exception(
        "DATABASE_URL missing in .env"
    )