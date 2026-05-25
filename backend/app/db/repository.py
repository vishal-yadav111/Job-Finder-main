from app.db.models import (
    RawJob
)

from app.db.fingerprint_repository import (
    FingerprintRepository
)


from sqlalchemy.exc import (
    IntegrityError
)


class JobRepository:

    def __init__(
        self,
        session
    ):

        self.session = session

        self.fingerprint_repository = (
            FingerprintRepository(
                session
            )
        )


    async def job_exists(

        self,

        job_hash: str,

        user_id: int
    ):
        try:
            return await (
                self.fingerprint_repository
                .exists(

                    user_id=user_id,

                    job_hash=job_hash
                )
            )
        except Exception:
            return False


    async def save_job(

        self,

        job_data,

        user_id: int
    ):
        try:
            exists = await self.job_exists(

                job_hash=job_data["job_hash"],

                user_id=user_id
            )

            if exists:

               

                return False

            try:

                await (
                    self.fingerprint_repository
                    .save(

                        user_id=user_id,

                        job_hash=job_data[
                            "job_hash"
                        ],

                        company=job_data[
                            "company"
                        ]
                    )
                )

                job = RawJob(

                    user_id=user_id,

                    **job_data
                )

                self.session.add(job)

                await self.session.commit()

                

                return True

            except IntegrityError:

                await self.session.rollback()


                return False
        except Exception as e:
            await self.session.rollback()
            print(f"FAILED TO SAVE JOB {job_data.get('title')}: {e}")
            return False