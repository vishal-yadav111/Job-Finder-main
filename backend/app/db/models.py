from datetime import datetime

import uuid

from sqlalchemy import (
    String,
    Text,
    DateTime,
    Boolean,
    Integer,
    Float,
    JSON,
    UniqueConstraint
)

from sqlalchemy.orm import (
    DeclarativeBase,
    mapped_column,
    Mapped
)


class Base(DeclarativeBase):
    pass


class RawJob(Base):

    __tablename__ = "raw_jobs"

    __table_args__ = (

        UniqueConstraint(
            "user_id",
            "job_hash",
            name="uq_user_job_hash"
        ),
    )

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        index=True
    )

    job_hash: Mapped[str] = mapped_column(
        String,
        index=True
    )

    source: Mapped[str] = mapped_column(
        String
    )

    source_job_id: Mapped[str] = mapped_column(
        String
    )

    company: Mapped[str] = mapped_column(
        String
    )

    title: Mapped[str] = mapped_column(
        String
    )

    location: Mapped[str] = mapped_column(
        String,
        nullable=True
    )

    apply_url: Mapped[str] = mapped_column(
        Text
    )

    raw_description: Mapped[str] = mapped_column(
        Text
    )

    posted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )

    normalized_title: Mapped[str] = mapped_column(
        String
    )

    normalized_location: Mapped[str] = mapped_column(
        String
    )

    llm_processed: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    llm_processed_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=True
    )

    # Error handling helper for safe attribute access
    def get_safe(self, attr, default=""):
        try:
            return getattr(self, attr) or default
        except Exception:
            return default

class JobAIResult(Base):

    __tablename__ = "job_ai_results"

    __table_args__ = (

        UniqueConstraint(
            "user_id",
            "job_hash",
            name="uq_user_ai_job_hash"
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        index=True
    )

    job_hash: Mapped[str] = mapped_column(
        String,
        index=True
    )

    company: Mapped[str] = mapped_column(
        String
    )

    title: Mapped[str] = mapped_column(
        String
    )

    location: Mapped[str] = mapped_column(
        String
    )

    apply_url: Mapped[str] = mapped_column(
        Text
    )

    posted_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=True
    )

    is_fresher: Mapped[bool] = mapped_column(
        Boolean,
        nullable=True
    )

    experience_years: Mapped[int] = mapped_column(
        Integer,
        nullable=True
    )

    role_category: Mapped[str] = mapped_column(
        String,
        nullable=True
    )

    is_india_eligible: Mapped[bool] = mapped_column(
        Boolean,
        nullable=True
    )

    salary_detected: Mapped[bool] = mapped_column(
        Boolean,
        nullable=True
    )

    salary_lpa: Mapped[float] = mapped_column(
        Float,
        nullable=True
    )

    confidence: Mapped[float] = mapped_column(
        Float,
        nullable=True
    )

    llm_model: Mapped[str] = mapped_column(
        String,
        nullable=True
    )

    processed_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    feed_published: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )


class ReferralCampaign(Base):

    __tablename__ = "referral_campaigns"

    __table_args__ = (

        UniqueConstraint(
            "user_id",
            "job_hash",
            name="uq_user_referral_job_hash"
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        index=True
    )

    job_hash: Mapped[str] = mapped_column(
        String,
        index=True
    )

    company: Mapped[str] = mapped_column(
        String
    )

    role: Mapped[str] = mapped_column(
        String
    )

    job_link: Mapped[str] = mapped_column(
        Text
    )

    linkedin_profiles: Mapped[dict] = mapped_column(
        JSON
    )

    referral_message: Mapped[str] = mapped_column(
        Text
    )

    status: Mapped[str] = mapped_column(
        String,
        default="no_action"
    )

    notes: Mapped[str] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

class LinkedinProfile(Base):

    __tablename__ = "linkedin_profiles"

    __table_args__ = (

        UniqueConstraint(
            "user_id",
            "linkedin_url",
            name="uq_user_linkedin_profile"
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        index=True
    )

    company: Mapped[str] = mapped_column(
        String,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String
    )

    linkedin_url: Mapped[str] = mapped_column(
        Text,
    )

    current_role: Mapped[str] = mapped_column(
        String,
        nullable=True
    )

    source: Mapped[str] = mapped_column(
        String,
        default="google_search"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )


class User(Base):

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(

        Integer,

        primary_key=True
    )

    email: Mapped[str] = mapped_column(

        String,

        unique=True,

        index=True
    )

    hashed_password: Mapped[str] = mapped_column(
        String
    )

    created_at: Mapped[datetime] = mapped_column(

        DateTime,

        default=datetime.utcnow
    )


class RefreshSession(Base):

    __tablename__ = "refresh_sessions"

    id: Mapped[int] = mapped_column(

        Integer,

        primary_key=True
    )

    session_id: Mapped[str] = mapped_column(

        String,

        unique=True,

        index=True
    )

    user_id: Mapped[int] = mapped_column(
        Integer
    )

    refresh_token_hash: Mapped[str] = mapped_column(
        Text
    )

    revoked: Mapped[bool] = mapped_column(

        Boolean,

        default=False
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime
    )

    created_at: Mapped[datetime] = mapped_column(

        DateTime,

        default=datetime.utcnow
    )


class JobFingerprint(Base):

    __tablename__ = "job_fingerprints"

    __table_args__ = (

        UniqueConstraint(

            "user_id",

            "job_hash",

            name="uq_user_job_fingerprint"
        ),
    )

    id: Mapped[int] = mapped_column(

        Integer,

        primary_key=True
    )

    user_id: Mapped[int] = mapped_column(

        Integer,

        index=True
    )

    job_hash: Mapped[str] = mapped_column(

        String,

        index=True
    )

    company: Mapped[str] = mapped_column(
        String
    )

    first_seen_at: Mapped[datetime] = mapped_column(

        DateTime,

        default=datetime.utcnow
    )