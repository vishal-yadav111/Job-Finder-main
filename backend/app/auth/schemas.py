from pydantic import BaseModel
from pydantic import EmailStr


class RegisterRequest(BaseModel):

    email: EmailStr

    password: str


class LoginRequest(BaseModel):

    email: EmailStr

    password: str


class TokenResponse(BaseModel):

    access_token: str

    refresh_token: str

    token_type: str = "bearer"

class RefreshRequest(BaseModel):

    refresh_token: str



