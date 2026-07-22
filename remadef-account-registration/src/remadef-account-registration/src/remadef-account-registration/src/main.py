import os
import json
import secrets
import hashlib
from datetime import datetime, timezone

from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.services.users import Users
from appwrite.exception import AppwriteException


# ============================================================
# REMADEF ACCOUNT REGISTRATION FUNCTION
# ============================================================

def get_env(name: str, required: bool = True, default=None):
    value = os.getenv(name, default)

    if required and not value:
        raise RuntimeError(f"Missing required environment variable: {name}")

    return value


def response(res, status_code: int, body: dict):
    return res.json(
        body,
        status_code=status_code,
        headers={
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST, OPTIONS"
        }
    )


def generate_user_id():
    """
    Generates a unique REMADEF user ID.
    """
    return f"remadef_{secrets.token_hex(12)}"


def hash_value(value: str):
    """
    Used for safe duplicate checking where required.
    """
    return hashlib.sha256(value.strip().lower().encode()).hexdigest()


def main(context):

    req = context.req
    res = context.res
    log = context.log
    error = context.error

    # --------------------------------------------------------
    # CORS preflight
    # --------------------------------------------------------

    if req.method == "OPTIONS":
        return response(res, 200, {
            "success": True,
            "message": "CORS preflight successful"
        })

    # --------------------------------------------------------
    # Only POST requests are allowed
    # --------------------------------------------------------

    if req.method != "POST":
        return response(res, 405, {
            "success": False,
            "message": "Only POST requests are allowed"
        })

    try:

        # ----------------------------------------------------
        # Parse request body
        # ----------------------------------------------------

        body = req.body

        if isinstance(body, str):
            try:
                body = json.loads(body)
            except json.JSONDecodeError:
                return response(res, 400, {
                    "success": False,
                    "message": "Invalid JSON request body"
                })

        if not isinstance(body, dict):
            return response(res, 400, {
                "success": False,
                "message": "Request body must be a JSON object"
            })

        # ----------------------------------------------------
        # Extract registration data
        # ----------------------------------------------------

        full_name = str(body.get("fullName", "")).strip()
        email = str(body.get("email", "")).strip().lower()
        phone = str(body.get("phone", "")).strip()
        password = str(body.get("password", ""))

        # Optional registration fields
        date_of_birth = str(body.get("dateOfBirth", "")).strip()
        gender = str(body.get("gender", "")).strip()
        state = str(body.get("state", "")).strip()
        lga = str(body.get("lga", "")).strip()
        address = str(body.get("address", "")).strip()

        kyw_consent = body.get(
            "kywConsent",
            body.get("KYW_Consent_Signed", False)
        )

        # ----------------------------------------------------
        # Validate required fields
        # ----------------------------------------------------

        if not full_name:
            return response(res, 400, {
                "success": False,
                "message": "Full name is required"
            })

        if not email:
            return response(res, 400, {
                "success": False,
                "message": "Email address is required"
            })

        if "@" not in email:
            return response(res, 400, {
                "success": False,
                "message": "Please provide a valid email address"
            })

        if not password or len(password) < 8:
            return response(res, 400, {
                "success": False,
                "message": "Password must contain at least 8 characters"
            })

        if not kyw_consent:
            return response(res, 400, {
                "success": False,
                "message": "KYW consent is required before registration"
            })

        # ----------------------------------------------------
        # Appwrite configuration
        # ----------------------------------------------------

        endpoint = get_env("APPWRITE_ENDPOINT")
        project_id = get_env("APPWRITE_PROJECT_ID")
        api_key = get_env("APPWRITE_API_KEY")

        # ----------------------------------------------------
        # Initialize Appwrite
        # ----------------------------------------------------

        client = Client()

        client.set_endpoint(endpoint)
        client.set_project(project_id)
        client.set_key(api_key)

        users = Users(client)

        # ----------------------------------------------------
        # Create Appwrite Auth Account
        # ----------------------------------------------------

        user_id = generate_user_id()

        try:

            user = users.create(
                user_id=user_id,
                email=email,
                password=password,
                name=full_name
            )

        except AppwriteException as exc:

            error_code = getattr(exc, "code", None)

            if error_code == 409:
                return response(res, 409, {
                    "success": False,
                    "message": "An account with this email already exists"
                })

            raise

        # ----------------------------------------------------
        # Optional database profile creation
        # ----------------------------------------------------

        database_id = os.getenv("APPWRITE_DATABASE_ID")
        collection_id = os.getenv("APPWRITE_PROFILE_COLLECTION_ID")

        profile_created = False

        if database_id and collection_id:

            databases = Databases(client)

            profile_data = {
                "userId": user_id,
                "fullName": full_name,
                "email": email,
                "phone": phone,
                "dateOfBirth": date_of_birth,
                "gender": gender,
                "state": state,
                "lga": lga,
                "address": address,
                "KYW_Consent_Signed": bool(kyw_consent),
                "accountStatus": "active",
                "registrationSource": "REMADEF",
                "createdAt": datetime.now(
                    timezone.utc
                ).isoformat()
            }

            databases.create_document(
                database_id=database_id,
                collection_id=collection_id,
                document_id=user_id,
                data=profile_data
            )

            profile_created = True

        # ----------------------------------------------------
        # Successful registration
        # ----------------------------------------------------

        log(
            f"REMADEF account successfully created: {user_id}"
        )

        return response(res, 201, {
            "success": True,
            "message": "REMADEF account created successfully",
            "user": {
                "id": user_id,
                "name": full_name,
                "email": email
            },
            "profileCreated": profile_created
        })

    # --------------------------------------------------------
    # Appwrite errors
    # --------------------------------------------------------

    except AppwriteException as exc:

        error(
            f"Appwrite error: {str(exc)}"
        )

        return response(res, 500, {
            "success": False,
            "message": "Account registration service error",
            "error": str(exc)
        })

    # --------------------------------------------------------
    # Unexpected errors
    # --------------------------------------------------------

    except Exception as exc:

        error(
            f"Unexpected registration error: {str(exc)}"
        )

        return response(res, 500, {
            "success": False,
            "message": "An unexpected server error occurred"
        })
