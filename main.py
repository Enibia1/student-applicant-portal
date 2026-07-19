import json
import os

from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.id import ID


def main(context):
    try:
        # Read the incoming request body
        body = context.req.body

        if isinstance(body, str):
            data = json.loads(body)
        else:
            data = body

        # These names must exactly match the frontend
        required_fields = [
            "StudentID",
            "FullName",
            "NationalIdentityNumber",
            "MobileNumber",
            "HubLocation",
            "KYW_Consent_Signed"
        ]

        # Check for missing fields
        missing_fields = [
            field for field in required_fields
            if field not in data
        ]

        if missing_fields:
            return context.res.json({
                "success": False,
                "error": "Missing required fields",
                "fields": missing_fields
            }, 400)

        # Consent must be accepted
        if data["KYW_Consent_Signed"] is not True:
            return context.res.json({
                "success": False,
                "error": "KYW Consent must be accepted"
            }, 400)

        # Initialize Appwrite client
        client = Client()

        client.set_endpoint(
            "https://cloud.appwrite.io/v1"
        )

        client.set_project(
            os.environ["APPWRITE_FUNCTION_PROJECT_ID"]
        )

        client.set_key(
            os.environ["APPWRITE_FUNCTION_API_KEY"]
        )

        databases = Databases(client)

        # Create student record
        result = databases.create_document(
            database_id="6a5bdf2e0014484b10c9"
            collection_id="students",
            document_id=ID.unique(),
            data={
                "studentID": data["StudentID"],
                "fullName": data["FullName"],
                "nationalIdentityNumber": data["NationalIdentityNumber"],
                "mobileNumber": data["MobileNumber"],
                "hubLocation": data["HubLocation"],
                "kycConsentSigned": data["KYW_Consent_Signed"]
            }
        )

        # Successful response
        return context.res.json({
            "success": True,
            "message": "Student application submitted successfully.",
            "documentId": result["$id"]
        }, 201)

    except Exception as error:
        context.error(str(error))

        return context.res.json({
            "success": False,
            "error": str(error)
        }, 500)
