from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker
)

from app.config.settings import (
    DATABASE_URL
)

try:

    engine = create_async_engine(

        DATABASE_URL,

        echo=True,

        connect_args={
            "statement_cache_size": 0
        }
    )

except Exception as e:

    print(
        f"DB Engine Creation Failed: {e}"
    )

    engine = None


try:

    AsyncSessionLocal = async_sessionmaker(

        engine,

        expire_on_commit=False
    )

except Exception as e:

    print(
        f"Session Factory Failed: {e}"
    )

    AsyncSessionLocal = None