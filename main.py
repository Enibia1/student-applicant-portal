import json
import os

from appwrite.client import Client
from appwrite.services.tables_db import TablesDB
from appwrite.id import ID


def main(context):
    try:
        # Read the data sent from the frontend
        body = context.req.body

        if isinstance(body, str):
            data = json.loads(body)
        else:
            data = body

        # Required fields
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

        # Check consent
        if data["KYW_Consent_Signed"] is not True:
            return context.res.json({
                "success": False,
                "error": "KYW Consent must be accepted"
            }, 400)

        # Initialize Appwrite
        client = Client()

        client.set_endpoint(
            "https://sfo.cloud.appwrite.io/v1"
        )

        client.set_project(
            os.environ["APPWRITE_FUNCTION_PROJECT_ID"]
        )

        client.set_key(
            os.environ["APPWRITE_FUNCTION_API_KEY"]
        )

        tables_db = TablesDB(client)

        # Create a new student row
        result = tables_db.create_row(
            database_id="6a5bdf2e0014484b10c9",
            table_id="students",
            row_id=ID.unique(),
            data={
                "studentID": data["StudentID"],
                "fullName": data["FullName"],
                "nationalIdentityNumber": data["NationalIdentityNumber"],
                "mobileNumber": data["MobileNumber"],
                "hubLocation": data["HubLocation"],
                "kycConsentSigned": data["KYW_Consent_Signed"]
            }
        )

        # Success
        return context.res.json({
            "success": True,
            "message": "Student application submitted successfully.",
            "rowId": result["$id"]
        }, 201)

    except Exception as error:
        context.error(str(error))

        return context.res.json({
            "success": False,
            "error": str(error)
        }, 500)
