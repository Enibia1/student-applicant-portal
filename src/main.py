import os
import json
import re
import secrets
from datetime import datetime, timezone

from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.exception import AppwriteException


# ============================================================
# APPWRITE CONFIGURATION
# ============================================================

APPWRITE_ENDPOINT = os.getenv(
    "APPWRITE_ENDPOINT",
    "https://sfo.cloud.appwrite.io/v1"
)

APPWRITE_PROJECT_ID = os.getenv(
    "APPWRITE_PROJECT_ID",
    "6a5bc178003a2529271e"
)

APPWRITE_API_KEY = os.getenv("APPWRITE_API_KEY")

# Replace these with your actual Database and Collection IDs
DATABASE_ID = os.getenv(
    "APPWRITE_DATABASE_ID",
    "REMADEF_DATABASE"
)

COLLECTION_ID = os.getenv(
    "APPWRITE_COLLECTION_ID",
    "REMADEF_ACCOUNTS"
)


# ============================================================
# APPWRITE CLIENT
# ============================================================

client = Client()

client.set_endpoint(APPWRITE_ENDPOINT)
client.set_project(APPWRITE_PROJECT_ID)

if APPWRITE_API_KEY:
    client.set_key(APPWRITE_API_KEY)

databases = Databases(client)


# ============================================================
# HELPERS
# ============================================================

def response(body, status_code=200):
    """
    Return a standard Appwrite Function response.
    """
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        },
        "body": json.dumps(body)
    }


def generate_account_id():
    """
    Generates a unique REMADEF account identifier.
    """
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    random_part = secrets.token_hex(4).upper()

    return f"RMA-{timestamp}-{random_part}"


def clean(value):
    """
    Safely clean incoming text values.
    """
    if value is None:
        return ""

    return str(value).strip()


def valid_email(email):
    """
    Basic email validation.
    """
    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    return re.match(pattern, email) is not None


def valid_phone(phone):
    """
    Basic international phone validation.
    """
    cleaned = re.sub(r"[\s\-()]", "", phone)

    return bool(
        re.match(r"^\+?[0-9]{7,15}$", cleaned)
    )


# ============================================================
# MAIN FUNCTION
# ============================================================

def main(context):

    try:

        # ----------------------------------------------------
        # Handle CORS preflight
        # ----------------------------------------------------

        method = ""

        if hasattr(context, "req"):
            method = getattr(context.req, "method", "")

        if method == "OPTIONS":
            return response({
                "success": True,
                "message": "CORS preflight accepted"
            })


        # ----------------------------------------------------
        # Read request body
        # ----------------------------------------------------

        data = {}

        if hasattr(context, "req"):

            body = getattr(context.req, "body", None)

            if isinstance(body, dict):
                data = body

            elif isinstance(body, str) and body.strip():

                try:
                    data = json.loads(body)

                except json.JSONDecodeError:
                    return response({
                        "success": False,
                        "message": "Invalid JSON request body"
                    }, 400)


        # ----------------------------------------------------
        # Extract account registration data
        #
