# student-applicant-portal
Student validation mobile form backend integration.
# Student Applicant Portal

A mobile-responsive frontend workspace built with Vanilla HTML5 and JavaScript. This interface serves as the entry point for student registrations across regional hubs, capturing core data payloads and securely transferring them to a centralized backend routing function.

---

## 🏗️ Project Architecture

*   **Frontend Deployment:** Hosted via GitHub Pages for direct mobile accessibility.
*   **API Gateway & Infrastructure:** Managed through Appwrite Cloud services.
*   **Backend Runtime:** Integrated with a consolidated Python serverless execution model handling endpoint routing (`/submit`).

---

## 📊 Standard Payload Structure

The form enforces strict client-side validation before dispatching the following JSON schema to the serverless architecture:

| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `StudentID` | String | Unique student identifier token |
| `FullName` | String | Applicant's documented full name |
| `NationalIdentityNumber` | String | Regulatory identity check string (NIN) |
| `MobileNumber` | String | Primary communication line |
| `HubLocation` | String | Selected operational hub (Lagos, Kano, Owerri) |
| `KYW_Consent_Signed` | Boolean | Strict legal and workflow compliance flag |

---

## 🚀 Execution & Local Verification

To run a secure, zero-dependency local instance of this interface for form transmission analysis:

1. Clone or pull the repository branch to your local terminal workspace.
2. Initialize a local server context using the Python network module:
   ```bash
   python -m http.server 8000
