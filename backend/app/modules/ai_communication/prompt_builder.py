from __future__ import annotations

import re

from .constants import RESPONSE_TEMPLATES, SMART_BUNDLES
from .settings import PromptContext, UserProfileConfig


def build_profile_summary(profile: UserProfileConfig) -> str:
    fields: list[str] = []

    if profile.user_name:
        fields.append(f"Full Name: {profile.user_name}")
    if profile.user_email:
        fields.append(f"Email: {profile.user_email}")
    if profile.user_phone:
        fields.append(f"Phone: {profile.user_phone}")
    if profile.user_grad_year:
        fields.append(f"Graduation Year: {profile.user_grad_year}")
    if profile.user_degree:
        fields.append(f"Degree: {profile.user_degree}")
    if profile.user_resume:
        fields.append(f"Resume: {profile.user_resume}")
    if profile.user_portfolio:
        fields.append(f"Portfolio: {profile.user_portfolio}")
    if profile.user_linkedin:
        fields.append(f"LinkedIn: {profile.user_linkedin}")
    if profile.user_github:
        fields.append(f"GitHub: {profile.user_github}")
    if profile.user_college:
        fields.append(f"College: {profile.user_college}")
    if profile.user_experience:
        fields.append(f"Experience: {profile.user_experience}")
    if profile.user_skills:
        fields.append(f"Skills: {', '.join(profile.user_skills)}")
    if profile.profile_summary:
        fields.append("")
        fields.append("PROFILE_SUMMARY:")
        fields.append(profile.profile_summary.strip())

    if not fields:
        return "No profile details were provided in environment variables."

    return "\n".join(fields)


def get_template_metadata(response_type: str) -> dict:
    return RESPONSE_TEMPLATES.get(
        response_type,
        {
            "label": response_type.replace("_", " ").title(),
            "channel": "custom",
            "priority": ["other"],
            "description": "A custom AI-generated communication template.",
        },
    )


def build_generate_system_prompt(profile: UserProfileConfig, template_label: str, tone: str) -> str:
    return f"""
You are a senior career communication assistant.

Use the candidate profile below as the primary source of personal details.
Use every available field from the profile when drafting the message.
If profile data is missing, infer only from the JD and do not ask the user for more inputs.
Do not invent experience, companies, education, or skills that are not supported by the JD or profile.
Keep the output concise, professional, human, and tailored to the JD.

Candidate profile:
{build_profile_summary(profile)}

Output rules:
- Return valid JSON only.
- Never include markdown fences.
- Never include filler like 'hope you're doing well'.
- Keep the writing human and not AI-like.
- Match the requested tone: {tone}.
- Tailor the message to the template: {template_label}.
- When only the JD is provided, infer company, role, skills, and outreach angle from the JD itself.
- The final generated content must always have this exact structure:
    1. Greeting line: "Hi <name>," or "Hi," if no name is available.
    2. Optional short opener line: "I hope you are doing well." Use it only when tone is professional or friendly.
    3. Paragraph 1: candidate intro. Must mention graduation year, degree, full-stack/backend/AI profile, and strongest skills from the env profile block.
    4. Paragraph 2: role/company alignment. Must mention the exact role and company when available, compare the JD with the candidate skills, and state why the candidate fits.
    5. The exact line: I have added the necessary details below.
    6. Details block with Job Link, Resume, Portfolio, Email, Contact, and Best Regards/sign-off.
- Paragraph 1 and Paragraph 2 must be separate paragraphs.
- Keep each paragraph natural and human.
- Do not add any heading labels, bullets, or markdown outside the required details block.
- The first paragraph must prioritize skills and experience from the profile block above and blend in the JD keywords.
- For LinkedIn and WhatsApp, write a direct outreach message from the candidate to the recruiter/hiring manager, not a referral-request style note.
- WhatsApp should be short, direct, and candidate-to-recruiter.
- LinkedIn should be direct outreach, not a referral ask.
- Email can be slightly more formal but still direct.
""".strip()


def build_generate_user_prompt(context: PromptContext, detected_skills: list[str]) -> str:
    template = get_template_metadata(context.response_type)
    custom_label = context.custom_response_type or template["label"]
    recruiter_name = context.recruiter_name or "not provided"
    hiring_manager_name = context.hiring_manager_name or "not provided"
    company_name = context.company_name or "infer from JD if visible"
    job_role = context.job_role or "infer from JD"
    applied_via = context.applied_via or "not provided"
    job_link = _extract_first_url(context.job_description) or "not provided"
    skills_text = ", ".join(detected_skills) if detected_skills else "none explicitly detected"

    return f"""
Generate a {custom_label} for this application.

Context:
- Company: {company_name}
- Role: {job_role}
- Applied via: {applied_via}
- Job Link: {job_link}
- Recruiter name: {recruiter_name}
- Hiring manager name: {hiring_manager_name}
- Tone: {context.tone or 'professional'}
- Response type key: {context.response_type}

Job description:
{context.job_description}

JD skills detected:
{skills_text}

Rules:
- Use only relevant personal details from the profile.
- If company, role, or platform are missing, infer them from the JD and the text context.
- Match the candidate's real skills to the JD keywords.
- Keep it concise and platform-specific.
- For LinkedIn: keep it short, natural, and direct.
- For WhatsApp: use a compact conversational tone and direct outreach style.
- For email: include a clear but brief opening and direct application intent.
- For interview answers: sound confident and direct.
- Avoid generic phrases, buzzwords, and verbose paragraphs.
- Do not mention that the text was AI-generated.
- After the two paragraphs, add the fixed sentence: I have added the necessary details below.
- Then add these lines exactly in this order if available:
    Job Link: <job link>
    Email: <candidate email>
    Portfolio: <candidate portfolio>
    Resume: <candidate resume>
    Contact: <candidate phone>
    Best Regards,
    <candidate name>
- If any value is missing, omit that line rather than inventing it.

Return JSON with this shape:
{{
  "generated_content": "...",
  "detected_skills": ["..."],
  "matched_user_skills": ["..."],
  "confidence_score": 0.92
}}
""".strip()


def _extract_first_url(text: str) -> str | None:
    match = re.search(r"https?://[^\s)]+", text or "")
    if match:
        return match.group(0).rstrip(".,)]}")
    return None


def build_analysis_system_prompt(profile: UserProfileConfig) -> str:
    return f"""
You are a JD analysis assistant.
Analyze job descriptions and return structured insights only as JSON.

Use the candidate profile context only if it exists; if not, analyze the JD on its own.

Candidate profile summary:
{build_profile_summary(profile)}

Return valid JSON only.
""".strip()


def build_analysis_user_prompt(job_description: str, job_role: str | None) -> str:
    role_line = job_role or "not provided"
    return f"""
Analyze the following job description and return:
- skills
- keywords
- experience_level
- suggested_improvements

Job role: {role_line}

Job description:
{job_description}

Return JSON in this shape:
{{
  "skills": ["..."],
  "keywords": ["..."],
  "experience_level": "0-1 years | 1-3 years | 3+ years | unknown",
  "suggested_improvements": ["..."]
}}
""".strip()


def get_smart_bundle(applied_via: str) -> list[str]:
    return SMART_BUNDLES.get(applied_via, SMART_BUNDLES["other"])