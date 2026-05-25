import asyncio

from app.scheduler.run_jobs import (
    scheduler_loop
)


class SchedulerManager:

    def __init__(self):

        self.tasks = {}


    async def start_scheduler(

        self,

        user_id: int
    ):

        existing_task = (
            self.tasks.get(user_id)
        )

        if existing_task:

            if not existing_task.done():

                return False

            del self.tasks[user_id]

        try:
            task = asyncio.create_task(
                scheduler_loop(user_id)
            )

            self.tasks[user_id] = task

            return True
        except Exception:
            return False


    async def stop_scheduler(

        self,

        user_id: int
    ):

        task = self.tasks.get(
            user_id
        )

        if not task:

            return False

        try:
            task.cancel()
        except Exception:
            pass

        if user_id in self.tasks:
            del self.tasks[user_id]

        return True


    def is_running(

        self,

        user_id: int
    ):

        task = self.tasks.get(
            user_id
        )

        if not task:

            return False

        if task.done():

            try:
                del self.tasks[user_id]
            except KeyError:
                pass
            
            return False

        return True


scheduler_manager = (
    SchedulerManager()
)