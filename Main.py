import json
import os
import urllib.request
import urllib.error


def main(context):
    try:
        # Read request body
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

        # Check missing fields
        missing_fields = [
            field for field in required_fields
            if field not in data or data[field] in ["", None]
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

        # Appwrite configuration
        endpoint = "https://sfo.cloud.appwrite.io/v1"
        project_id = os.environ["APPWRITE_FUNCTION_PROJECT_ID"]
        api_key = os.environ["APPWRITE_FUNCTION_API_KEY"]

        database_id = "6a5bdf2e0014484b10c9"
        table_id = "students"

        # Data to save
        row_data = {
            "studentID": data["StudentID"],
            "fullName": data["FullName"],
            "nationalIdentityNumber": data["NationalIdentityNumber"],
            "mobileNumber": data["MobileNumber"],
            "hubLocation": data["HubLocation"],
            "kycConsentSigned": data["KYW_Consent_Signed"]
        }

        # Appwrite TablesDB REST API
        url = (
            f"{endpoint}/tablesdb/"
            f"{database_id}/tables/{table_id}/rows"
        )

        payload = {
            "rowId": "unique()",
            "data": row_data
        }

        request = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "X-Appwrite-Project": project_id,
                "X-Appwrite-Key": api_key
            },
            method="POST"
        )

        with urllib.request.urlopen(request) as response:
            result = json.loads(response.read().decode("utf-8"))

        return context.res.json({
            "success": True,
            "message": "Student application submitted successfully.",
            "rowId": result.get("$id")
        }, 201)

    except urllib.error.HTTPError as error:
        error_body = error.read().decode("utf-8")

        context.error(
            f"Appwrite API Error {error.code}: {error_body}"
        )

        return context.res.json({
            "success": False,
            "error": error_body
        }, error.code)

    except Exception as error:
        context.error(str(error))

        return context.res.json({
            "success": False,
            "error": str(error)
        }, 500)
