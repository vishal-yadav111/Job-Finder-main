-- Job Finder database schema
-- Run this in PostgreSQL to create the tables used by the backend.

CREATE SCHEMA IF NOT EXISTS public;

CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING btree (email);

CREATE TABLE IF NOT EXISTS public.refresh_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    refresh_token_hash TEXT NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_user_id ON public.refresh_sessions USING btree (user_id);

CREATE TABLE IF NOT EXISTS public.job_fingerprints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    job_hash VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_job_fingerprint UNIQUE (user_id, job_hash)
);
CREATE INDEX IF NOT EXISTS idx_job_fingerprints_user_id ON public.job_fingerprints USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_job_fingerprints_job_hash ON public.job_fingerprints USING btree (job_hash);

CREATE TABLE IF NOT EXISTS public.linkedin_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    company VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    linkedin_url TEXT NOT NULL,
    role_name VARCHAR(255),
    source VARCHAR(255) DEFAULT 'google_search',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_linkedin_profile UNIQUE (user_id, linkedin_url)
);
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_user_id ON public.linkedin_profiles USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_company ON public.linkedin_profiles USING btree (company);

CREATE TABLE IF NOT EXISTS public.raw_jobs (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER NOT NULL,
    job_hash VARCHAR(255) NOT NULL,
    source VARCHAR(255) NOT NULL,
    source_job_id VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    apply_url TEXT NOT NULL,
    raw_description TEXT NOT NULL,
    posted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    normalized_title VARCHAR(255) NOT NULL,
    normalized_location VARCHAR(255) NOT NULL,
    llm_processed BOOLEAN DEFAULT FALSE,
    llm_processed_at TIMESTAMP NULL,
    CONSTRAINT uq_user_job_hash UNIQUE (user_id, job_hash)
);
CREATE INDEX IF NOT EXISTS idx_raw_jobs_user_id ON public.raw_jobs USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_raw_jobs_job_hash ON public.raw_jobs USING btree (job_hash);
CREATE INDEX IF NOT EXISTS idx_raw_jobs_company ON public.raw_jobs USING btree (company);

CREATE TABLE IF NOT EXISTS public.job_ai_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    job_hash VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    apply_url TEXT NOT NULL,
    posted_at TIMESTAMP NULL,
    is_fresher BOOLEAN NULL,
    experience_years INTEGER NULL,
    role_category VARCHAR(255) NULL,
    is_india_eligible BOOLEAN NULL,
    salary_detected BOOLEAN NULL,
    salary_lpa DOUBLE PRECISION NULL,
    confidence DOUBLE PRECISION NULL,
    llm_model VARCHAR(255) NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    feed_published BOOLEAN DEFAULT FALSE,
    CONSTRAINT uq_user_ai_job_hash UNIQUE (user_id, job_hash)
);
CREATE INDEX IF NOT EXISTS idx_job_ai_results_user_id ON public.job_ai_results USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_job_ai_results_job_hash ON public.job_ai_results USING btree (job_hash);
CREATE INDEX IF NOT EXISTS idx_job_ai_results_company ON public.job_ai_results USING btree (company);

CREATE TABLE IF NOT EXISTS public.referral_campaigns (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    job_hash VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    job_link TEXT NOT NULL,
    linkedin_profiles JSON NOT NULL,
    referral_message TEXT NOT NULL,
    status VARCHAR(255) DEFAULT 'no_action',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_referral_job_hash UNIQUE (user_id, job_hash)
);
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_user_id ON public.referral_campaigns USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_job_hash ON public.referral_campaigns USING btree (job_hash);
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_company ON public.referral_campaigns USING btree (company);
