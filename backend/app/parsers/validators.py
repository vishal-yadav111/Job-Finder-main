import re


REJECT_KEYWORDS = [

    r"\bsenior\b",
    r"\bstaff\b",
    r"\bprincipal\b",
    r"\blead\b",
    r"\bmanager\b",
    r"\bdirector\b",
    r"\barchitect\b",

    r"\bsecurity\b",

    r"\bmachine learning\b",
    r"\bml engineer\b",
    r"\bai engineer\b",

    r"\bsre\b",
    r"\bsite reliability\b",

    r"\bdata scientist\b",

    r"\bembedded\b",
    r"\bfirmware\b",

    r"\bresearch engineer\b",

    r"\b5\+ years\b",
    r"\b6\+ years\b",
    r"\b7\+ years\b",

    r"\b3-5 years\b",
    r"\b5-7 years\b",

    r"\bexperienced\b"
]


ACCEPT_KEYWORDS = [

    # ---------------------------------------------------
    # CORE SOFTWARE ENGINEERING
    # ---------------------------------------------------

    r"\bsoftware engineer\b",
    r"\bsoftware developer\b",
    r"\bsde\b",
    r"\bsde[- ]?1\b",
    r"\bsde[- ]?2\b",
    r"\bsoftware development engineer\b",

    r"\bapplication engineer\b",
    r"\bapplication developer\b",

    r"\bprogrammer\b",
    r"\bdeveloper\b",

    r"\bassociate engineer\b",
    r"\bassociate software engineer\b",

    r"\bgraduate engineer trainee\b",
    r"\bget\b",

    r"\bentry level\b",
    r"\bjunior engineer\b",
    r"\bjunior developer\b",

    r"\bnew grad\b",
    r"\bearly career\b",
    r"\bfresher\b",

    r"\bamts\b",
    r"\bassociate member of technical staff\b",

    # ---------------------------------------------------
    # BACKEND
    # ---------------------------------------------------

    r"\bbackend\b",
    r"\bbackend engineer\b",
    r"\bbackend developer\b",

    r"\bpython developer\b",
    r"\bjava developer\b",
    r"\bgolang developer\b",
    r"\bnode\.?js developer\b",

    r"\bapi developer\b",
    r"\bmicroservices\b",

    # ---------------------------------------------------
    # FRONTEND
    # ---------------------------------------------------

    r"\bfrontend\b",
    r"\bfrontend engineer\b",
    r"\bfrontend developer\b",

    r"\breact developer\b",
    r"\bangular developer\b",
    r"\bvue developer\b",

    r"\bui developer\b",
    r"\bweb developer\b",

    # ---------------------------------------------------
    # FULL STACK
    # ---------------------------------------------------

    r"\bfull stack\b",
    r"\bfullstack\b",
    r"\bfull[- ]stack engineer\b",
    r"\bfull[- ]stack developer\b",

    r"\bmern\b",
    r"\bmern stack\b",

    r"\bmean\b",
    r"\bmean stack\b",

    # ---------------------------------------------------
    # DEVOPS / CLOUD
    # ---------------------------------------------------

    r"\bdevops\b",
    r"\bcloud engineer\b",
    r"\bplatform engineer\b",

    r"\bsite reliability engineer\b",
    r"\bsre\b",

    r"\bkubernetes\b",
    r"\bdocker\b",
    r"\bcicd\b",

    r"\baws\b",
    r"\bazure\b",
    r"\bgcp\b",

    # ---------------------------------------------------
    # QA / TESTING
    # ---------------------------------------------------

    r"\bqa\b",
    r"\bqa engineer\b",

    r"\btest engineer\b",
    r"\bautomation engineer\b",

    r"\bsdet\b",
    r"\bquality engineer\b",

    # ---------------------------------------------------
    # DATA / AI / ML
    # ---------------------------------------------------

    r"\bgenerative ai\b",
    r"\bgen ai\b",

    r"\bapplied ai\b",
    r"\bai developer\b",

    r"\bllm engineer\b",
    r"\bprompt engineer\b",

    r"\bmachine learning engineer\b",
    r"\bml engineer\b",

    r"\bdata engineer\b",
    r"\bdata analyst\b",

    r"\bai engineer\b",
    r"\bnlp engineer\b",

    r"\bcomputer vision\b",

    # ---------------------------------------------------
    # TECH STACK / TECHNOLOGY MATCHING
    # ---------------------------------------------------

    r"\breact\b",
    r"\bnext\.?js\b",

    r"\btypescript\b",
    r"\bjavascript\b",

    r"\bpython\b",
    r"\bjava\b",

    r"\bgolang\b",
    r"\bnode\.?js\b",

    r"\bexpress\b",
    r"\bfastapi\b",

    r"\bdjango\b",
    r"\bflask\b",

    r"\bspring boot\b",

    r"\bpostgresql\b",
    r"\bmysql\b",
    r"\bmongodb\b",

    r"\bredis\b",
    r"\bkafka\b",

    r"\bgraphql\b",
    r"\brest api\b",

    r"\bterraform\b",

    # ---------------------------------------------------
    # STARTUP HIRING LANGUAGE
    # ---------------------------------------------------

    r"\b0[- ]?2 years\b",
    r"\b0[- ]?3 years\b",

    r"\bgraduate\b",
    r"\bbeginner\b",

    r"\btraining program\b",
    r"\bengineer trainee\b",

    r"\bsoftware trainee\b"
]

FRESHER_PATTERNS = [

    r"\b0-1 years\b",
    r"\b0 - 1 years\b",

    r"\b0 to 1 years\b",

    r"\b1 year\b",
    r"\b1 years\b",

    r"\bfresher\b",

    r"\bnew grad\b",

    r"\bentry level\b",

    r"\bearly career\b",

    r"\bgraduate\b",

    r"\bcampus\b",

    r"\b2025\b",
    r"\b2026\b"
]


INDIA_LOCATIONS = [

    "india",

    "bangalore",
    "bengaluru",

    "hyderabad",

    "pune",

    "gurgaon",
    "gurugram",

    "noida",

    "delhi",
    "new delhi",

    "mumbai",

    "chennai",

    "kolkata",

    "india remote",

    "remote india",

    "in-bengaluru",
    "in-hyderabad",
    "in-gurgaon",
    "in-pune"
]


def is_relevant_job(
    title: str
) -> bool:
    try:
        if not title:
            return False

        title = title.lower()

        for pattern in REJECT_KEYWORDS:

            if re.search(pattern, title):
                return False

        for pattern in ACCEPT_KEYWORDS:

            if re.search(pattern, title):
                return True

        return False
    except Exception:
        return False


def is_good_location(
    location: str
) -> bool:
    try:
        if not location:
            return False

        location = location.lower()

        for loc in INDIA_LOCATIONS:

            if loc in location:
                return True

        return False
    except Exception:
        return False


def is_fresher_job(
    title: str,
    description: str
) -> bool:
    try:
        text = (
            f"{title} {description}"
        ).lower()

        for pattern in FRESHER_PATTERNS:

            if re.search(pattern, text):
                return True

        return False
    except Exception:
        return False