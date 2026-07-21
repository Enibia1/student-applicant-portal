const client = new Appwrite.Client();

client
.setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('6a5bc178003a2529271e');

const functions = new Appwrite.Functions(client);

document.getElementById('applicantForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const msgDiv = document.getElementById('msg');

    msgDiv.style.color = "#1e293b";
    msgDiv.innerText = "Processing application...";

    const payload = {
        StudentID: document.getElementById('studentId').value.trim(),
        FullName: document.getElementById('fullName').value.trim(),
        NationalIdentityNumber: document.getElementById('nin').value.trim(),
        MobileNumber: document.getElementById('mobileNumber').value.trim(),
        HubLocation: document.getElementById('hubLocation').value,
        KYW_Consent_Signed: document.getElementById('kywConsent').checked
    };

    if (
        !payload.StudentID ||
        !payload.FullName ||
        !payload.NationalIdentityNumber ||
        !payload.MobileNumber ||
        !payload.HubLocation
    ) {
        msgDiv.style.color = "#ef4444";
        msgDiv.innerText = "Please complete all required fields.";
        return;
    }

    if (!payload.KYW_Consent_Signed) {
        msgDiv.style.color = "#ef4444";
        msgDiv.innerText = "You must accept the KYW Consent terms to proceed.";
        return;
    }

    try {
        const response = await functions.createExecution(
            '6a5be27a00193cc88c24',
            JSON.stringify(payload),
            false
        );

        console.log("Appwrite response:", response);

        if (response.statusCode >= 200 && response.statusCode < 300) {
            msgDiv.style.color = "#10b981";
            msgDiv.innerText = "Application submitted successfully!";
            document.getElementById('applicantForm').reset();
        } else {
            msgDiv.style.color = "#ef4444";
            msgDiv.innerText = "Application failed. Status: " + response.statusCode;
        }

    } catch (error) {
        console.error("Appwrite error:", error);

        msgDiv.style.color = "#ef4444";
        msgDiv.innerText = "Error: " + error.message;
    }
});
