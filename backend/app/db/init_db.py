import asyncio

from app.db.connection import (
    engine
)

from app.db.models import (
    Base
)

print(
    Base.metadata.tables.keys()
)


async def init_db():

    print(
        "Starting DB initialization..."
    )

    try:
        async with engine.begin() as conn:

            await conn.run_sync(
                Base.metadata.create_all
            )

        print(
            "Database tables created successfully"
        )
    except Exception as e:
        print(
            f"Database initialization failed: {e}"
        )


if __name__ == "__main__":

    try:
        asyncio.run(
            init_db()
        )
    except Exception as e:
        print(
            f"Fatal error during DB initialization: {e}"
        )