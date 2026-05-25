from pydantic import BaseModel
from typing import Optional


class JobUpdateRequest(BaseModel):

    status: Optional[str] = None

    notes: Optional[str] = None