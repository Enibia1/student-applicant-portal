import json
import os

from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.id import ID


def main(context):
    try:
        body = context.req.body

        if isinstance(body, str):
            data = json.loads(body)
        else:
            data = body

        required_fields = [
            "StudentID",
            "FullName",
            "NationalIdentityNumber",
            "MobileNumber",
            "HubLocation",
            "KYW_Consent_Signed"
        ]

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

        if data["KYW_Consent_Signed"] is not True:
            return context.res.json({
                "success": False,
                "error": "KYW Consent must be accepted"
            }, 400)

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

        databases = Databases(client)

        result = databases.create_document(
            database_id="6a5bdf2e0014484b10c9",
            collection_id="students",
            document_id=ID.unique(),
            data={
                "studentID": data["StudentID"],
                "fullName": data["FullName"],
                "nationalIdentityNumber": data["NationalIdentityNumber"],
                "mobileNumber": data["MobileNumber"],
                "hubLocation": data["HubLocation"],
                "kywConsentSigned": data["KYW_Consent_Signed"]
            }
        )

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
