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
        # ----------------------------------------------------

        full_name = clean(
            data.get("fullName")
            or data.get("FullName")
        )

        email = clean(
            data.get("email")
            or data.get("Email")
        ).lower()

        phone = clean(
            data.get("phone")
            or data.get("MobileNumber")
            or data.get("mobileNumber")
        )

        password = clean(
            data.get("password")
        )

        account_type = clean(
            data.get("accountType")
            or data.get("AccountType")
            or "individual"
        )

        country = clean(
            data.get("country")
            or data.get("Country")
            or "Nigeria"
        )

        kyw_consent = data.get(
            "kywConsent"
        )

        if kyw_consent is None:
            kyw_consent = data.get(
                "KYW_Consent_Signed"
            )


        # ----------------------------------------------------
        # Required field validation
        # ----------------------------------------------------

        missing_fields = []

        if not full_name:
            missing_fields.append("fullName")

        if not email:
            missing_fields.append("email")

        if not phone:
            missing_fields.append("phone")

        if not password:
            missing_fields.append("password")


        if missing_fields:

            return response({
                "success": False,
                "message": "Required fields are missing",
                "missingFields": missing_fields
            }, 400)


        # ----------------------------------------------------
        # Validate email
        # ----------------------------------------------------

        if not valid_email(email):

            return response({
                "success": False,
                "message": "Please provide a valid email address"
            }, 400)


        # ----------------------------------------------------
        # Validate phone
        # ----------------------------------------------------

        if not valid_phone(phone):

            return response({
                "success": False,
                "message": "Please provide a valid phone number"
            }, 400)


        # ----------------------------------------------------
        # Validate password
        # ----------------------------------------------------

        if len(password) < 8:

            return response({
                "success": False,
                "message": "Password must contain at least 8 characters"
            }, 400)


        # ----------------------------------------------------
        # Validate KYW consent
        # ----------------------------------------------------

        if kyw_consent is not True:

            return response({
                "success": False,
                "message": "KYW consent must be accepted before registration"
            }, 400)


        # ----------------------------------------------------
        # Generate REMADEF account identity
        # ----------------------------------------------------

        account_id = generate_account_id()

        now = datetime.now(timezone.utc).isoformat()


        # ----------------------------------------------------
        # Create account record
        # ----------------------------------------------------

        account_document = {

            "accountId": account_id,

            "fullName": full_name,

            "email": email,

            "phone": phone,

            "accountType": account_type,

            "country": country,

            "kywConsentSigned": True,

            "accountStatus": "pending_verification",

            "kywStatus": "pending",

            "registrationSource": "REMADEF Account Registration",

            "createdAt": now,

            "updatedAt": now

        }


        # ----------------------------------------------------
        # Write account to Appwrite Database
        # ----------------------------------------------------

        document = databases.create_document(

            database_id=DATABASE_ID,

            collection_id=COLLECTION_ID,

            document_id=account_id,

            data=account_document

        )


        # ----------------------------------------------------
        # SUCCESS RESPONSE
        # ----------------------------------------------------

        return response({

            "success": True,

            "message": "REMADEF account registration successful",

            "account": {

                "accountId": account_id,

                "fullName": full_name,

                "email": email,

                "accountStatus": "pending_verification",

                "kywStatus": "pending"

            }

        }, 201)


    # ========================================================
    # APPWRITE ERROR
    # ========================================================

    except AppwriteException as error:

        if hasattr(context, "error"):

            context.error(
                f"Appwrite error: {str(error)}"
            )

        return response({

            "success": False,

            "message": "Unable to create account at this time",

            "error": str(error)

        }, 500)


    # ========================================================
    # UNEXPECTED ERROR
    # ========================================================

    except Exception as error:

        if hasattr(context, "error"):

            context.error(
                f"Unexpected error: {str(error)}"
            )

        return response({

            "success": False,

            "message": "An unexpected server error occurred"

        }, 500)
