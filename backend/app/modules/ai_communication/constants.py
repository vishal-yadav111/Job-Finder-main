RESPONSE_TEMPLATES = {
    "referral_request_email": {
        "label": "Referral Request Email",
        "channel": "email",
        "priority": ["referral", "careers_page"],
        "description": "Ask for a referral in a concise professional email.",
    },
    "linkedin_connection_message": {
        "label": "LinkedIn Direct Message",
        "channel": "linkedin",
        "priority": ["linkedin"],
        "description": "A short direct outreach message for LinkedIn.",
    },
    "linkedin_follow_up_message": {
        "label": "LinkedIn Follow-up Direct Message",
        "channel": "linkedin",
        "priority": ["linkedin"],
        "description": "A direct follow-up message for LinkedIn.",
    },
    "whatsapp_referral_request": {
        "label": "WhatsApp Direct Message",
        "channel": "whatsapp",
        "priority": ["referral"],
        "description": "A concise direct WhatsApp message to a recruiter or contact.",
    },
    "hr_outreach_message": {
        "label": "HR Outreach Message",
        "channel": "email",
        "priority": ["careers_page", "linkedin", "other"],
        "description": "A direct message to HR for job follow-up or application interest.",
    },
    "cold_email_to_recruiter": {
        "label": "Cold Email to Recruiter",
        "channel": "email",
        "priority": ["careers_page", "linkedin", "other"],
        "description": "A short cold email tailored to a recruiter.",
    },
    "tell_me_about_yourself": {
        "label": "Tell Me About Yourself",
        "channel": "interview",
        "priority": ["other"],
        "description": "A crisp interview introduction answer.",
    },
    "why_do_you_want_to_join_our_company": {
        "label": "Why Do You Want To Join Our Company?",
        "channel": "interview",
        "priority": ["other"],
        "description": "A focused interview answer tailored to the company and role.",
    },
    "short_interview_introduction": {
        "label": "Short Interview Introduction",
        "channel": "interview",
        "priority": ["other"],
        "description": "A 30-second self-introduction for interviews.",
    },
    "cover_letter": {
        "label": "Cover Letter",
        "channel": "email",
        "priority": ["careers_page", "other"],
        "description": "A concise cover letter aligned to the JD and profile.",
    },
    "follow_up_after_applying": {
        "label": "Follow-up After Applying",
        "channel": "email",
        "priority": ["careers_page", "linkedin", "other"],
        "description": "A polite application follow-up email.",
    },
    "thank_you_message_after_interview": {
        "label": "Thank You Message After Interview",
        "channel": "email",
        "priority": ["linkedin", "careers_page", "other"],
        "description": "A warm but concise interview thank-you message.",
    },
    "networking_message": {
        "label": "Networking Message",
        "channel": "linkedin",
        "priority": ["linkedin"],
        "description": "A professional networking note to build a connection.",
    },
    "referral_follow_up_message": {
        "label": "Referral Follow-up Message",
        "channel": "linkedin",
        "priority": ["referral"],
        "description": "A polite follow-up after asking for a referral.",
    },
    "custom_response_type": {
        "label": "Custom Response Type",
        "channel": "custom",
        "priority": ["other"],
        "description": "A custom generated response based on user instructions.",
    },
}

SMART_BUNDLES = {
    "linkedin": [
        "linkedin_connection_message",
        "linkedin_follow_up_message",
        "networking_message",
    ],
    "careers_page": [
        "hr_outreach_message",
        "follow_up_after_applying",
        "cover_letter",
    ],
    "referral": [
        "referral_request_email",
        "referral_follow_up_message",
        "whatsapp_referral_request",
    ],
    "naukri": [
        "cold_email_to_recruiter",
        "follow_up_after_applying",
        "hr_outreach_message",
    ],
    "indeed": [
        "cold_email_to_recruiter",
        "follow_up_after_applying",
        "cover_letter",
    ],
    "instahyre": [
        "cold_email_to_recruiter",
        "hr_outreach_message",
        "follow_up_after_applying",
    ],
    "other": [
        "cover_letter",
        "cold_email_to_recruiter",
        "networking_message",
    ],
}

TONE_OPTIONS = ["professional", "friendly", "confident", "concise"]

DEFAULT_MODEL = "gpt-4o-mini"
