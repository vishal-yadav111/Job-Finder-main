from sqlalchemy import select

from app.db.models import (
    JobFingerprint
)


class FingerprintRepository:

    def __init__(
        self,
        session
    ):

        self.session = session


    async def exists(

        self,

        user_id: int,

        job_hash: str
    ):
        try:
            query = (
                select(JobFingerprint)
                .where(

                    JobFingerprint.user_id
                    == user_id,

                    JobFingerprint.job_hash
                    == job_hash
                )
            )

            result = await self.session.execute(
                query
            )

            fingerprint = (
                result.scalar_one_or_none()
            )

            return fingerprint is not None
        except Exception:
            return False


    async def save(

        self,

        user_id: int,

        job_hash: str,

        company: str
    ):
        try:
            fingerprint = JobFingerprint(

                user_id=user_id,

                job_hash=job_hash,

                company=company
            )

            self.session.add(
                fingerprint
            )

            await self.session.commit()
        except Exception:
            await self.session.rollback()