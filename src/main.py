# ============================================================
# REMADEF ACCOUNT REGISTRATION FUNCTION
# Appwrite Cloud Function - Python
# ============================================================

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

PROJECT_ID = os.environ.get(
    "APPWRITE_PROJECT_ID",
    "6a5bc178003a2529271e"
)

API_KEY = os.environ.get(
    "APPWRITE_API_KEY"
)

ALLOWED_ORIGIN = "https://enibia1.github.io"


# ============================================================
# CORS HEADERS
# ============================================================

CORS_HEADERS = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
}


# ============================================================
# RESPONSE HELPER
# ============================================================

def response_json(res, status_code, data):

    return res.json(
        data,
        status_code,
        CORS_HEADERS
    )


# ============================================================
# VALIDATE EMAIL
# ============================================================

def valid_email(email):

    pattern = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"

    return re.match(pattern, email) is not None


# ============================================================
# NORMALIZE PHONE NUMBER
# ============================================================

def normalize_phone(phone):

    phone = re.sub(r"\D", "", phone)

    if phone.startswith("0"):

        return "+234" + phone[1:]

    if phone.startswith("234"):

        return "+" + phone

    if len(phone) == 10:

        return "+234" + phone

    return phone


# ============================================================
# GENERATE TRAINEE ID
# ============================================================

def generate_trainee_id():

    characters = string.ascii_uppercase + string.digits

    random_part = "".join(
        secrets.choice(characters)
        for _ in range(8)
    )

    return f"REM-{random_part}"


# ============================================================
# MAIN FUNCTION
# ============================================================

def main(context):

    req = context.req
    res = context.res

    # ========================================================
    # CORS PREFLIGHT REQUEST
    # ========================================================

    if req.method == "OPTIONS":

        return res.empty(
            204,
            CORS_HEADERS
        )

    # ========================================================
    # ONLY POST REQUESTS
    # ========================================================

    if req.method != "POST":

        return response_json(
            res,
            405,
            {
                "success": False,
                "error": "Method not allowed"
            }
        )

    # ========================================================
    # CHECK APPWRITE API KEY
    # ========================================================

    if not API_KEY:

        context.error(
            "APPWRITE_API_KEY environment variable is missing"
        )

        return response_json(
            res,
            500,
            {
                "success": False,
                "error": "Server configuration error"
            }
        )

    # ========================================================
    # READ REQUEST BODY
    # ========================================================

    try:

        body = req.body

        # Appwrite may provide body as a string
        if isinstance(body, str):

            if not body.strip():

                body = {}

            else:

                body = json.loads(body)

        # Safety fallback
        if not isinstance(body, dict):

            body = {}

    except Exception as error:

        context.error(
            f"Invalid request body: {str(error)}"
        )

        return response_json(
            res,
            400,
            {
                "success": False,
                "error": "Invalid JSON request"
            }
        )

    # ========================================================
    # EXTRACT DATA
    # ========================================================

    method = body.get("method")
    email = body.get("email")
    phone = body.get("phone")
    password = body.get("password")

    # ========================================================
    # BASIC VALIDATION
    # ========================================================

    if not method:

        return response_json(
            res,
            400,
            {
                "success": False,
                "error": "Registration method is required"
            }
        )

    if not password:

        return response_json(
            res,
            400,
            {
                "success": False,
                "error": "Password is required"
            }
        )

    # ========================================================
    # PASSWORD VALIDATION
    # ========================================================

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
                "error": "Password must contain a lowercase letter"
            }
        )

    if not re.search(r"[A-Z]", password):

        return response_json(
            res,
            400,
            {
                "success": False,
                "error": "Password must contain an uppercase letter"
            }
        )

    if not re.search(r"\d", password):

        return response_json(
            res,
            400,
            {
                "success": False,
                "error": "Password must contain a number"
            }
        )

    # ========================================================
    # VALIDATE EMAIL OR PHONE
    # ========================================================

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

        email = str(email).strip().lower()

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

        phone = normalize_phone(str(phone))

        if not phone.startswith("+234"):

            return response_json(
                res,
                400,
                {
                    "success": False,
                    "error": "Invalid Nigerian phone number"
                }
            )

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

        client.set_project(
            PROJECT_ID
        )

        client.set_key(
            API_KEY
        )

        users = Users(client)

        # ====================================================
        # CREATE USER
        # ====================================================

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

        # ====================================================
        # SAFE APPWRITE USER ID EXTRACTION
        #
        # IMPORTANT:
        # Appwrite Python SDK may return a User object,
        # not a normal Python dictionary.
        # Therefore DO NOT use user.get().
        # ====================================================

        user_id = getattr(
            user,
            "id",
            None
        )

        if not user_id:

            user_id = getattr(
                user,
                "$id",
                None
            )

        if not user_id and isinstance(user, dict):

            user_id = user.get(
                "$id"
            )

        if not user_id:

            raise Exception(
                "User created but Appwrite user ID could not be found"
            )

        # ====================================================
        # GENERATE TRAINEE ID
        # ====================================================

        trainee_id = generate_trainee_id()

        context.log(
            f"Account created successfully: {user_id}"
        )

        context.log(
            f"Trainee ID generated: {trainee_id}"
        )

        # ====================================================
        # SUCCESS RESPONSE
        # ====================================================

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

    # ========================================================
    # APPWRITE ERROR
    # ========================================================

    except AppwriteException as error:

        error_message = str(error)

        context.error(
            f"Appwrite error: {error_message}"
        )

        return response_json(
            res,
            400,
            {
                "success": False,
                "error": error_message
            }
        )

    # ========================================================
    # GENERAL ERROR
    # ========================================================

    except Exception as error:

        error_message = str(error)

        context.error(
            f"Registration error: {error_message}"
        )

        return response_json(
            res,
            500,
            {
                "success": False,
                "error": "Account creation failed"
            }
        )
