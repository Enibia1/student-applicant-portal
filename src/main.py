import os
import json
import re
import secrets
from datetime import datetime, timezone

from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.exception import AppwriteException


# ============================================================
# CONFIGURATION
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

DATABASE_ID = os.getenv(
    "APPWRITE_DATABASE_ID",
    "REPLACE_WITH_YOUR_REAL_DATABASE_ID"
)

COLLECTION_ID = os.getenv(
    "APPWRITE_COLLECTION_ID",
    "REPLACE_WITH_YOUR_REAL_COLLECTION_ID"
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
# RESPONSE HELPER
# ============================================================

def response(body, status_code=200):

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


# ============================================================
# ACCOUNT ID GENERATOR
# ============================================================

def generate_account_id():

    timestamp = datetime.now(
        timezone.utc
    ).strftime("%Y%m%d%H%M%S")

    random_part = secrets.token_hex(4).upper()

    return f"RMA-{timestamp}-{random_part}"


# ============================================================
# CLEAN TEXT
# ============================================================

def clean(value):

    if value is None:
        return ""

    return str(value).strip()


# ============================================================
# VALIDATION
# ============================================================

def valid_email(email):

    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

    return re.match(pattern, email) is not None


def valid_phone(phone):

    cleaned = re.sub(
        r"[\s\-()]", "",
        phone
    )

    return bool(
        re.match(
            r"^\+?[0-9]{7,15}$",
            cleaned
        )
    )


# ============================================================
# REQUEST BODY PARSER
# ============================================================

def get_request_data(context):

    if not hasattr(context, "req"):

        return {}

    request = context.req


    # --------------------------------------------------------
    # First: Appwrite parsed JSON body
    # --------------------------------------------------------

    body_json = getattr(
        request,
        "bodyJson",
        None
    )

    if isinstance(body_json, dict):

        return body_json


    # --------------------------------------------------------
    # Second: raw request body
    # --------------------------------------------------------

    body = getattr(
        request,
        "body",
        None
    )


    if isinstance(body, dict):

        return body


    if isinstance(body, str) and body.strip():

        try:

            parsed_body = json.loads(body)

            if isinstance(parsed_body, dict):

                return parsed_body

        except json.JSONDecodeError:

            return None


    return {}


# ============================================================
# MAIN FUNCTION
# ============================================================

def main(context):

    try:

        # ----------------------------------------------------
        # HTTP METHOD
        # ----------------------------------------------------

        method = ""

        if hasattr(context, "req"):

            method = getattr(
                context.req,
                "method",
                ""
            )

        method = method.upper()


        # ----------------------------------------------------
        # CORS PREFLIGHT
        # ----------------------------------------------------

        if method == "OPTIONS":

            return response({

                "success": True,

                "message": "CORS preflight accepted"

            })


        # ----------------------------------------------------
        # ONLY POST REQUESTS
        # ----------------------------------------------------

        if method and method != "POST":

            return response({

                "success": False,

                "message": "Only POST requests are accepted"

            }, 405)


        # ----------------------------------------------------
        # READ BODY
        # ----------------------------------------------------

        data = get_request_data(context)


        if data is None:

            return response({

                "success": False,

                "message": "Invalid JSON request body"

            }, 400)


        if not data:

            return response({

                "success": False,

                "message": "Request body is required"

            }, 400)


        # ----------------------------------------------------
        # LOG SAFE REQUEST INFORMATION
        # ----------------------------------------------------

        if hasattr(context, "log"):

            context.log(
                "Account registration request received"
            )


        # ====================================================
        # EXTRACT DATA
        # ====================================================

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


        # ====================================================
        # REQUIRED FIELD VALIDATION
        # ====================================================

        missing_fields = []


        if not full_name:

            missing_fields.append(
                "fullName"
            )


        if not email:

            missing_fields.append(
                "email"
            )


        if not phone:

            missing_fields.append(
                "phone"
            )


        if not password:

            missing_fields.append(
                "password"
            )


        if missing_fields:

            return response({

                "success": False,

                "message": "Required fields are missing",

                "missingFields": missing_fields

            }, 400)


        # ====================================================
        # EMAIL VALIDATION
        # ====================================================

        if not valid_email(email):

            return response({

                "success": False,

                "message": "Please provide a valid email address"

            }, 400)


        # ====================================================
        # PHONE VALIDATION
        # ====================================================

        if not valid_phone(phone):

            return response({

                "success": False,

                "message": "Please provide a valid phone number"

            }, 400)


        # ====================================================
        # PASSWORD VALIDATION
        # ====================================================

        if len(password) < 8:

            return response({

                "success": False,

                "message": "Password must contain at least 8 characters"

            }, 400)


        # ====================================================
        # KYW CONSENT VALIDATION
        # ====================================================

        if kyw_consent is not True:

            return response({

                "success": False,

                "message": "KYW consent must be accepted before registration"

            }, 400)


        # ====================================================
        # DATABASE CONFIGURATION CHECK
        # ====================================================

        if DATABASE_ID.startswith(
            "REPLACE_WITH"
        ):

            return response({

                "success": False,

                "message": "Database ID is not configured"

            }, 500)


        if COLLECTION_ID.startswith(
            "REPLACE_WITH"
        ):

            return response({

                "success": False,

                "message": "Collection ID is not configured"

            }, 500)


        if not APPWRITE_API_KEY:

            return response({

                "success": False,

                "message": "APPWRITE_API_KEY is not configured"

            }, 500)


        # ====================================================
        # GENERATE ACCOUNT ID
        # ====================================================

        account_id = generate_account_id()


        now = datetime.now(
            timezone.utc
        ).isoformat()


        # ====================================================
        # ACCOUNT RECORD
        # ====================================================

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

            "registrationSource":
                "REMADEF Account Registration",

            "createdAt": now,

            "updatedAt": now

        }


        # ====================================================
        # WRITE TO APPWRITE DATABASE
        # ====================================================

        document = databases.create_document(

            database_id=DATABASE_ID,

            collection_id=COLLECTION_ID,

            document_id=account_id,

            data=account_document

        )


        # ====================================================
        # SUCCESS
        # ====================================================

        if hasattr(context, "log"):

            context.log(
                f"Account created: {account_id}"
            )


        return response({

            "success": True,

            "message":
                "REMADEF account registration successful",

            "account": {

                "accountId": account_id,

                "fullName": full_name,

                "email": email,

                "accountStatus":
                    "pending_verification",

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

            "message":
                "Unable to create account at this time",

            "error":
                str(error)

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

            "message":
                "An unexpected server error occurred",

            "error":
                str(error)

        }, 500)
