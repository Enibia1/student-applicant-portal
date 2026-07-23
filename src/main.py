import os
import json
import re
import secrets
import string

from appwrite.client import Client
from appwrite.services.users import Users
from appwrite.exception import AppwriteException


# ============================================================
# CONFIGURATION
# ============================================================

PROJECT_ID = os.environ.get("APPWRITE_FUNCTION_PROJECT_ID")
API_KEY = os.environ.get("APPWRITE_API_KEY")


# ============================================================
# CORS HEADERS
# ============================================================

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "https://enibia1.github.io",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
}


# ============================================================
# RESPONSE HELPER
# ============================================================

def response_json(res, status_code, body):
    return res.json(
        body,
        status_code=status_code,
        headers={
            **CORS_HEADERS,
            "Content-Type": "application/json",
        }
    )


# ============================================================
# TRAINEE ID
# ============================================================

def generate_trainee_id():
    chars = string.ascii_uppercase + string.digits
    code = ''.join(secrets.choice(chars) for _ in range(6))
    return f"REM-{code}"


# ============================================================
# EMAIL VALIDATION
# ============================================================

def valid_email(email):
    pattern = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
    return re.match(pattern, email) is not None


# ============================================================
# MAIN FUNCTION
# ============================================================

def main(context):

    req = context.req
    res = context.res

    # --------------------------------------------------------
    # HANDLE CORS PREFLIGHT REQUEST
    # --------------------------------------------------------

    if req.method == "OPTIONS":

        return res.empty(
            status_code=204,
            headers=CORS_HEADERS
        )

    # --------------------------------------------------------
    # ONLY POST ALLOWED
    # --------------------------------------------------------

    if req.method != "POST":

        return response_json(
            res,
            405,
            {
                "success": False,
                "error": "Method not allowed"
            }
        )

    # --------------------------------------------------------
    # READ REQUEST BODY
    # --------------------------------------------------------

    try:

        body = req.body

        if isinstance(body, str):
            data = json.loads(body)

        elif isinstance(body, dict):
            data = body

        else:
            data = {}

    except Exception as error:

        context.error(f"Request parsing error: {str(error)}")

        return response_json(
            res,
            400,
            {
                "success": False,
                "error": "Invalid JSON request"
            }
        )

    # --------------------------------------------------------
    # EXTRACT DATA
    # --------------------------------------------------------

    method = data.get("method", "email")

    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")

    # --------------------------------------------------------
    # VALIDATE PASSWORD
    # --------------------------------------------------------

    if not password:

        return response_json(
            res,
            400,
            {
                "success": False,
                "error": "Password is required"
            }
        )

    if len(password) < 8:

        return response_json(
            res,
            400,
            {
                "success": False,
                "error": "Password must be at least 8 characters"
            }
        )

    if not re.search(r"[a-z]", password):

        return response_json(
            res,
            400,
            {
                "success": False,
                "error": "Password requires a lowercase letter"
            }
        )

    if not re.search(r"[A-Z]", password):

        return response_json(
            res,
            400,
            {
                "success": False,
                "error": "Password requires an uppercase letter"
            }
        )

    if not re.search(r"\d", password):

        return response_json(
            res,
            400,
            {
                "success": False,
                "error": "Password requires a number"
            }
        )

    # --------------------------------------------------------
    # VALIDATE EMAIL OR PHONE
    # --------------------------------------------------------

    if method == "email":

        if not email:

            return response_json(
                res,
                400,
                {
                    "success": False,
                    "error": "Email is required"
                }
            )

        email = email.strip().lower()

        if not valid_email(email):

            return response_json(
                res,
                400,
                {
                    "success": False,
                    "error": "Invalid email address"
                }
            )

    elif method == "phone":

        if not phone:

            return response_json(
                res,
                400,
                {
                    "success": False,
                    "error": "Phone number is required"
                }
            )

        phone = phone.strip()

    else:

        return response_json(
            res,
            400,
            {
                "success": False,
                "error": "Invalid registration method"
            }
        )

    # ========================================================
    # APPWRITE CLIENT
    # ========================================================

    try:

        client = Client()

        client.set_endpoint(
            "https://sfo.cloud.appwrite.io/v1"
        )

        client.set_project(PROJECT_ID)
        client.set_key(API_KEY)

        users = Users(client)

        # ----------------------------------------------------
        # CREATE USER
        # ----------------------------------------------------

        if method == "email":

            user = users.create(
                user_id="unique()",
                email=email,
                password=password
            )

        else:

            user = users.create(
                user_id="unique()",
                phone=phone,
                password=password
            )

        # ----------------------------------------------------
        # SAFE SDK OBJECT EXTRACTION
        # ----------------------------------------------------

        user_id = getattr(user, "id", None)

        if not user_id:

            try:
                user_id = user["$id"]
            except Exception:
                user_id = None

        if not user_id:

            raise Exception(
                "User was created but Appwrite user ID was unavailable"
            )

        trainee_id = generate_trainee_id()

        context.log(
            f"Account created successfully: {user_id}"
        )

        # ----------------------------------------------------
        # SUCCESS
        # ----------------------------------------------------

        return response_json(
            res,
            201,
            {
                "success": True,
                "message": "Account created successfully",
                "data": {
                    "user_id": user_id,
                    "trainee_id": trainee_id,
                    "method": method
                }
            }
        )

    except AppwriteException as error:

        context.error(
            f"Appwrite error: {str(error)}"
        )

        return response_json(
            res,
            400,
            {
                "success": False,
                "error": str(error)
            }
        )

    except Exception as error:

        context.error(
            f"Registration error: {str(error)}"
        )

        return response_json(
            res,
            500,
            {
                "success": False,
                "error": "Account creation failed"
            }
        )
