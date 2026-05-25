

# AI Job Finder & Referral Automation Platform

## Overview

AI Job Finder is a production-style backend-focused job discovery and referral automation platform built for fresher and early-career software engineering opportunities. The system continuously crawls multiple ATS (Applicant Tracking System) providers, filters jobs using deterministic orchestration + LLM reasoning, stores jobs in PostgreSQL and Redis, streams realtime updates using WebSockets, and generates AI-assisted referral outreach messages.

The architecture is intentionally backend-heavy and designed to demonstrate:

* distributed backend system design
* realtime event streaming
* Redis caching and persistence
* LLM orchestration
* async crawling systems
* scalable API design
* websocket synchronization
* deterministic orchestration patterns
* JWT authentication systems
* production deployment workflows

The system supports both local development and cloud deployment using:

* Render
* Supabase PostgreSQL
* Upstash Redis
* Vercel frontend deployment

---
# Job Finder

<p align="center">
  Modern AI-powered job finder platform with intelligent job discovery and streamlined search experience.
</p>

---

# Live Website

🔗 **Website:**  
https://job-finder-psi-eight.vercel.app/

---

# Demo

## Screenshot

<p align="center">
  <img 
    width="1336"
    height="876"
    alt="Job Finder Screenshot"
    src="https://github.com/user-attachments/assets/66131755-c904-4fb5-b0a5-0d3738b66417"
  />
</p>

---

## Video Demo
---
🎥 Watch Demo 1:  
https://drive.google.com/file/d/1cUFRQ0ovvDjFpOZjLA70KtN8IlrX4yrJ/view?usp=sharing

🎥 Watch Demo 2:  
https://drive.google.com/file/d/1JKqsShGwICdyhDSaaP3RcgLzMJ6bixOr/view?usp=sharing


---

# Core Features

## 1. Multi-ATS Job Crawling

The platform continuously crawls jobs from multiple ATS providers.

Supported ATS systems:

| ATS Provider | Supported | Description                       |
| ------------ | --------- | --------------------------------- |
| Greenhouse   | Yes       | Uses public Greenhouse boards API |
| Lever        | Yes       | Uses Lever public postings API    |
| Workday      | Yes       | Uses dynamic endpoint discovery   |
| Ashby        | Yes       | Uses Ashby public job endpoints   |

The crawler architecture is provider-based. Each ATS provider has its own crawler implementation with custom parsing logic.

The crawler runs asynchronously using  `asyncio` and `httpx.AsyncClient`.

Benefits:

* concurrent crawling
* non-blocking execution
* faster job ingestion
* scalable architecture

---

# How Crawling Works (Detailed Summary)

## Paragraph 1

The crawler begins by loading configured company metadata from ATS-specific company configuration lists. Each company contains information like provider type, token/slug/base URL, and provider-specific discovery configuration.

## Paragraph 2

The orchestration layer groups companies by ATS provider and dispatches asynchronous crawl requests concurrently using asyncio. This enables multiple company boards to be crawled simultaneously without blocking the event loop.

## Paragraph 3

Each ATS provider uses different discovery mechanisms. Greenhouse and Lever expose relatively stable public APIs, while Workday requires endpoint pattern discovery because every company may expose a different API route.

## Paragraph 4

For Workday, the crawler dynamically tests multiple endpoint patterns until it receives a valid response. This allows the platform to support multiple Workday deployments without hardcoding every company endpoint.

## Paragraph 5

Once jobs are fetched, the raw responses are normalized into a consistent internal schema. Regardless of ATS source, all jobs become standardized backend job objects.

## Paragraph 6

The normalized jobs are passed through deterministic filtering rules before reaching the LLM. Obvious senior or irrelevant roles are rejected immediately to reduce LLM cost and increase accuracy.

## Paragraph 7

Remaining jobs are then processed by the LLM classification pipeline. The LLM determines fresher suitability, likely experience requirements, role category, and India eligibility.

## Paragraph 8

After filtering, the backend generates referral metadata, LinkedIn profile mappings, referral message drafts, and Redis feed payloads for realtime UI streaming.

## Paragraph 9

Finally, accepted jobs are stored in PostgreSQL, cached in Redis, streamed through WebSockets, and exposed to the frontend through the realtime feed system.

---

# Deterministic Orchestration

The system uses deterministic orchestration instead of blindly trusting LLM outputs.

This is extremely important for production-grade systems.

The architecture uses:

* deterministic pre-filters
* LLM classification
* deterministic post-validation

Example:

Before sending jobs to the LLM:

* senior roles are rejected
* manager roles are rejected
* non-engineering roles are rejected
* architect roles are rejected

This reduces hallucinations and decreases unnecessary token usage.

After LLM classification:

* low-confidence results can be rejected
* high experience requirements are rejected
* non-fresher roles are removed

This hybrid architecture combines:

* deterministic safety
* AI flexibility
* production reliability

---

# LLM Job Filtering

The platform uses an LLM-based classification system to evaluate whether jobs are suitable for freshers.

The LLM processes:

* job title
* company
* location
* job description

The model determines:

* fresher suitability
* role category
* likely experience years
* India eligibility
* confidence score
* salary presence

The system prompt strictly enforces deterministic JSON output.

Example output:

```json
{
    "is_fresher": true,
    "experience_years": 1,
    "role_category": "backend",
    "is_india_eligible": true,
    "salary_detected": false,
    "salary_lpa": null,
    "confidence": 0.91
}
```

---

# Referral Generation Pipeline

The referral system generates personalized referral outreach messages using LLMs.

The backend injects:

* candidate profile summary
* graduation year
* degree
* job description
* resume link
* portfolio link
* contact information

The referral message generator combines:

* JD context
* candidate context
* deterministic formatting

The output is a structured recruiter/referral message.

---

# Candidate Profile Injection

The system loads candidate context from environment variables.

```python
profile_summary = os.getenv("PROFILE_SUMMARY", "")
full_name = os.getenv("FULL_NAME", "")
grad_year = os.getenv("GRAD_YEAR", "")
degree = os.getenv("DEGREE", "")
email = os.getenv("EMAIL", "")
phone = os.getenv("PHONE", "")
resume_link = os.getenv("RESUME", "")
portfolio_link = os.getenv("PORTFOLIO", "")
```

These values are injected into prompts.

The LLM uses this information to:

* personalize referral messages
* reference skills and projects
* generate realistic outreach messages
* align candidate profile with JD requirements

Important note:

Currently the system uses profile summary text and links. The LLM does NOT directly parse the resume PDF automatically. Resume-grounded parsing can be implemented later using PDF extraction pipelines.

---

# Why Redis Is Used

Redis is used as the realtime UI feed layer.

The Redis architecture provides:

* realtime feed persistence
* fast UI loading
* websocket synchronization
* TTL-based caching
* scalable frontend state management

Without Redis:

* frontend would constantly query PostgreSQL
* realtime websocket recovery becomes difficult
* refresh persistence becomes harder
* scaling becomes inefficient

Redis stores:

* job feed payloads
* UI state
* job statuses
* notes
* realtime synchronized data

---

# Why WebSockets Are Used

WebSockets provide realtime communication between backend and frontend.

Instead of polling APIs repeatedly, the frontend maintains a persistent connection.

Benefits:

* instant job updates
* lower latency
* reduced API polling
* realtime streaming
* scalable event delivery

Workflow:

crawler -> Redis -> websocket push -> frontend update

When a new job arrives:

* backend saves job
* backend updates Redis
* backend pushes websocket event
* frontend updates instantly

---

# Why PostgreSQL Is Used

PostgreSQL is the durable storage layer.

It stores:

* users
* referral campaigns
* raw jobs
* AI classification results
* refresh sessions
* fingerprints
* LinkedIn mappings

Redis is temporary cache/state.

PostgreSQL is long-term durable persistence.

---

# JWT Authentication System

The backend uses JWT-based authentication.

Supported:

* access tokens
* refresh tokens
* token rotation
* websocket auth
* protected endpoints

The frontend sends:

```http
Authorization: Bearer <token>
```

The backend validates:

* signature
* expiry
* token type

Refresh tokens are stored in PostgreSQL for secure session persistence.

---

# Multi-Tab / Duplicate Scheduler Protection

One major backend challenge was preventing duplicate scheduler execution.

Problem:

If a user opens multiple tabs and clicks "Start Scan", multiple crawl loops could start.

Solution:

The backend uses an in-memory scheduler manager.

Each user can only have one active scheduler task.

The scheduler manager checks:

```python
if existing_task and not existing_task.done():
```

This prevents duplicate crawl loops.

Benefits:

* avoids duplicate crawling
* prevents API spam
* reduces cost
* prevents duplicate websocket pushes

---

# Fingerprint Deduplication System

The platform uses permanent job fingerprints.

Reason:

Jobs frequently reappear across ATS systems.

If deduplication only used temporary Redis or recent DB state, duplicates would return after cleanup.

Solution:

Permanent fingerprint table:

```text
job_fingerprints
```

This stores:

* user_id
* job_hash
* company

Even if jobs expire from Redis or DB cleanup occurs, duplicate jobs remain blocked.

---

# TTL-Based Feed Cleanup

Jobs are stored in Redis with a 3-day TTL.

Purpose:

* prevent unbounded memory growth
* keep UI feed fresh
* reduce stale jobs
* maintain realtime relevance

Old jobs disappear automatically.

However fingerprints remain permanently stored.

This ensures:

* UI stays clean
* duplicates remain blocked

---

# LinkedIn Mapping System

The backend also stores LinkedIn employee mappings.

The platform attempts to find:

* company employees
* recruiters
* engineers
* referral targets

This metadata is preserved even after job TTL cleanup.

---

# Industry-Level Backend Design Decisions

The architecture intentionally separates:

* durable storage
* realtime cache
* websocket transport
* orchestration
* crawling
* AI classification

This makes the system:

* scalable
* maintainable
* horizontally extensible
* production-friendly

---

# Environment Variables (.env)

| Variable                    | Purpose                             |
| --------------------------- | ----------------------------------- |
| DATABASE_URL                | PostgreSQL database connection      |
| REDIS_URL                   | Upstash Redis connection            |
| GROQ_API_KEY                | LLM provider API key                |
| JWT_SECRET_KEY              | JWT signing secret                  |
| JWT_ALGORITHM               | JWT algorithm                       |
| ACCESS_TOKEN_EXPIRE_MINUTES | Access token expiry                 |
| REFRESH_TOKEN_EXPIRE_DAYS   | Refresh token expiry                |
| FULL_NAME                   | Candidate name                      |
| GRAD_YEAR                   | Graduation year                     |
| DEGREE                      | Degree information                  |
| EMAIL                       | Contact email                       |
| PHONE                       | Contact phone                       |
| RESUME                      | Resume URL                          |
| PORTFOLIO                   | Portfolio URL                       |
| PROFILE_SUMMARY             | Candidate summary for LLM grounding |
| SERP_API_KEY                | LinkedIn/Google search support      |

---

# API Documentation

## Authentication APIs

| Endpoint       | Method | Description          |
| -------------- | ------ | -------------------- |
| /auth/register | POST   | Register user        |
| /auth/login    | POST   | Login user           |
| /auth/refresh  | POST   | Refresh access token |

## Scan APIs

| Endpoint     | Method | Description      |
| ------------ | ------ | ---------------- |
| /scan/start  | POST   | Start scheduler  |
| /scan/stop   | POST   | Stop scheduler   |
| /scan/status | GET    | Scheduler status |

## Job APIs

| Endpoint         | Method | Description         |
| ---------------- | ------ | ------------------- |
| /jobs/feed       | GET    | Redis realtime feed |
| /jobs/{job_hash} | PATCH  | Update status/notes |

## WebSocket API

| Endpoint | Protocol  | Description            |
| -------- | --------- | ---------------------- |
| /ws/jobs | WebSocket | Realtime job streaming |

---

# WebSocket Authentication

WebSocket authentication uses JWT query parameters.

Example:

```text
wss://backend/ws/jobs?token=JWT_TOKEN
```

The backend validates:

* JWT signature
* expiry
* user identity

Only authenticated users receive events.

---

# Database Tables

| Table              | Purpose                    |
| ------------------ | -------------------------- |
| users              | User accounts              |
| refresh_sessions   | Refresh token sessions     |
| raw_jobs           | Raw crawled jobs           |
| job_ai_results     | LLM classification results |
| referral_campaigns | Referral workflows         |
| linkedin_profiles  | LinkedIn employee mappings |
| job_fingerprints   | Permanent dedupe tracking  |

---

# Deployment Stack

| Layer    | Provider            |
| -------- | ------------------- |
| Frontend | Vercel              |
| Backend  | Render              |
| Database | Supabase PostgreSQL |
| Redis    | Upstash Redis       |

---

# Local Development Setup

## Backend Setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `.env`.

Run database initialization:

```bash
python -m app.db.init_db
```

Run backend:

```bash
uvicorn app.api.server:app --reload
```

---

# Frontend Setup

```bash
npm install
npm run dev
```

Frontend `.env.local`:

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_WS_BASE=ws://localhost:8000
```

---

# Production Deployment

## Backend

Deploy backend to Render.

Environment variables must be configured in Render dashboard.

## Database

Use Supabase PostgreSQL.

## Redis

Use Upstash Redis.

## Frontend

Deploy frontend to Vercel.

---

# Future Improvements

Potential future upgrades:

* resume PDF parsing
* embeddings search
* semantic job ranking
* recruiter CRM
* distributed workers
* queue-based orchestration
* Kafka event streaming
* multi-region deployment
* Kubernetes deployment
* AI ranking systems
* notification systems
* automated application workflows

---

# Final Summary

This platform demonstrates a modern backend-focused AI orchestration architecture combining:

* ATS crawling
* async distributed workflows
* Redis realtime caching
* WebSocket event streaming
* JWT authentication
* LLM reasoning
* deterministic orchestration
* fingerprint deduplication
* production deployment
* realtime UI synchronization

The system is intentionally designed as an industry-style backend architecture project suitable for demonstrating:

* backend engineering skills
* distributed systems understa
