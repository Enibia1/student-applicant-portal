from appwrite.client import Client
from appwrite.services.users import Users
from appwrite.exception import AppwriteException

import os
import re
import json
import random


def main(context):

    # ============================================================
    # CORS HEADERS
    # ============================================================

    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    }

    # ============================================================
    # HANDLE CORS PREFLIGHT
    # ============================================================

    if context.req.method == "OPTIONS":

        return context.res.json(
            {
                "success": True,
                "message": "CORS OK"
            },
            200,
            cors_headers
        )

    # ============================================================
    # ONLY POST IS ALLOWED
    # ============================================================

    if context.req.method != "POST":

        return context.res.json(
            {
                "success": False,
                "error": "Only POST requests are allowed"
            },
            405,
            cors_headers
        )

    try:

        # ========================================================
        # READ REQUEST BODY
        # ========================================================

        body = context.req.body

        if not body:

            return context.res.json(
                {
                    "success": False,
                    "error": "Missing request body"
                },
                400,
                cors_headers
            )

        # ========================================================
        # PARSE JSON
        # ========================================================

        try:

            data = json.loads(body)

        except (json.JSONDecodeError, TypeError):

            return context.res.json(
                {
                    "success": False,
                    "error": "Invalid JSON request body"
                },
                400,
                cors_headers
            )

        # ========================================================
        # READ REGISTRATION DATA
        # ========================================================

        method = str(
            data.get("method", "email")
        ).strip().lower()

        email = str(
            data.get("email", "") or ""
        ).strip().lower()

        phone = str(
            data.get("phone", "") or ""
        ).strip()

        password = str(
            data.get("password", "") or ""
        )

        name = str(
            data.get("name", "") or "Remora Trainee"
        ).strip()

        # ========================================================
        # VALIDATE METHOD
        # ========================================================

        if method not in ["email", "phone"]:

            return context.res.json(
                {
                    "success": False,
                    "error": "Invalid registration method"
                },
                400,
                cors_headers
            )

        # ========================================================
        # EMAIL REGISTRATION
        # ========================================================

        if method == "email":

            if not email:

                return context.res.json(
                    {
                        "success": False,
                        "error": "Email is required"
                    },
                    400,
                    cors_headers
                )

            email_pattern = (
                r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
            )

            if not re.match(
                email_pattern,
                email
            ):

                return context.res.json(
                    {
                        "success": False,
                        "error": "Invalid email address"
                    },
                    400,
                    cors_headers
                )

            phone = None

        # ========================================================
        # PHONE REGISTRATION
        # ========================================================

        elif method == "phone":

            if not phone:

                return context.res.json(
                    {
                        "success": False,
                        "error": "Phone number is required"
                    },
                    400,
                    cors_headers
                )

            clean_phone = re.sub(
                r"\D",
                "",
                phone
            )

            # Nigerian local format:
            # 08012345678
            if (
                len(clean_phone) == 11
                and clean_phone.startswith("0")
            ):

                phone = "+234" + clean_phone[1:]

            # Nigerian format without zero:
            # 8012345678
            elif len(clean_phone) == 10:

                phone = "+234" + clean_phone

            # International Nigerian format:
            # 2348012345678
            elif (
                len(clean_phone) == 13
                and clean_phone.startswith("234")
            ):

                phone = "+" + clean_phone

            else:

                return context.res.json(
                    {
                        "success": False,
                        "error": "Invalid Nigerian phone number"
                    },
                    400,
                    cors_headers
                )

            email = None

        # ========================================================
        # PASSWORD VALIDATION
        # ========================================================

        if not password:

            return context.res.json(
                {
                    "success": False,
                    "error": "Password is required"
                },
                400,
                cors_headers
            )

        if len(password) < 8:

            return context.res.json(
                {
                    "success": False,
                    "error": "Password must be at least 8 characters"
                },
                400,
                cors_headers
            )

        # ========================================================
        # GET APPWRITE DYNAMIC FUNCTION API KEY
        # ========================================================

        api_key = context.req.headers.get(
            "x-appwrite-key"
        )

        if not api_key:

            context.error(
                "Missing x-appwrite-key header"
            )

            return context.res.json(
                {
                    "success": False,
                    "error": "Server authorization unavailable"
                },
                500,
                cors_headers
            )

        # ========================================================
        # GET PROJECT ID
        # ========================================================

        project_id = os.environ.get(
            "APPWRITE_PROJECT_ID"
        )

        if not project_id:

            context.error(
                "APPWRITE_PROJECT_ID is missing"
            )

            return context.res.json(
                {
                    "success": False,
                    "error": "Server configuration error"
                },
                500,
                cors_headers
            )

        # ========================================================
        # INITIALIZE APPWRITE CLIENT
        # ========================================================

        client = Client()

        client.set_endpoint(
            "https://cloud.appwrite.io/v1"
        )

        client.set_project(
            project_id
        )

        client.set_key(
            api_key
        )

        users = Users(client)

        # ========================================================
        # GENERATE USER ID
        # ========================================================

        user_id = (
            "rem_"
            + str(
                random.randint(
                    100000000,
                    999999999
                )
            )
        )

        # ========================================================
        # PREPARE USER DATA
        # ========================================================

        user_data = {
            "user_id": user_id,
            "password": password,
            "name": name
        }

        if email:

            user_data["email"] = email

        if phone:

            user_data["phone"] = phone

        # ========================================================
        # CREATE APPWRITE USER
        # ========================================================

        try:

            new_user = users.create(
                **user_data
            )

            # ====================================================
            # GENERATE REMADEF TRAINEE ID
            # ====================================================

            trainee_id = (
                "REM-"
                + str(
                    random.randint(
                        1,
                        9999
                    )
                ).zfill(4)
            )

            # ====================================================
            # SUCCESS RESPONSE
            # ====================================================

            return context.res.json(
                {
                    "success": True,
                    "message": "Account created successfully!",
                    "data": {
                        "user_id": new_user.get("$id"),
                        "email": new_user.get("email"),
                        "phone": new_user.get("phone"),
                        "name": new_user.get("name"),
                        "trainee_id": trainee_id
                    }
                },
                201,
                cors_headers
            )

        # ========================================================
        # APPWRITE ERROR HANDLING
        # ========================================================

        except AppwriteException as e:

            error_message = str(e)

            error_lower = error_message.lower()

            context.error(
                "Appwrite user creation error: "
                + error_message
            )

            if (
                "email already exists"
                in error_lower
                or "user with the same email"
                in error_lower
            ):

                return context.res.json(
                    {
                        "success": False,
                        "error": "This email is already registered"
                    },
                    409,
                    cors_headers
                )

            if (
                "phone already exists"
                in error_lower
                or "user with the same phone"
                in error_lower
            ):

                return context.res.json(
                    {
                        "success": False,
                        "error": "This phone number is already registered"
                    },
                    409,
                    cors_headers
                )

            context.error(
                "Full Appwrite error: "
                + error_message
            )

            return context.res.json(
                {
                    "success": False,
                    "error": "Registration failed",
                    "details": error_message
                },
                500,
                cors_headers
            )

        # ========================================================
        # GENERAL USER CREATION ERROR
        # ========================================================

        except Exception as e:

            context.error(
                "Unexpected account creation error: "
                + str(e)
            )

            return context.res.json(
                {
                    "success": False,
                    "error": "Account creation failed",
                    "details": str(e)
                },
                500,
                cors_headers
            )

    # ============================================================
    # GLOBAL ERROR HANDLER
    # ============================================================

    except Exception as e:

        context.error(
            "Unexpected server error: "
            + str(e)
        )

        return context.res.json(
            {
                "success": False,
                "error": "Internal server error",
                "details": str(e)
            },
            500,
            cors_headers
        )
