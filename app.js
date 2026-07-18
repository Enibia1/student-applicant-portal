const client = new Appwrite.Client();
const functions = new Appwrite.Functions(client);

// Replace placeholder strings with your actual Appwrite IDs from cloud.appwrite.io
client
    .setEndpoint('https://cloud.appwrite.io/v1') 
    .setProject('6a5bc178003a2529271e');              

document.getElementById('applicantForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgDiv = document.getElementById('msg');
    msgDiv.style.color = "#1e293b";
    msgDiv.innerText = "Processing application...";

    const payload = {
        StudentID: document.getElementById('studentId').value,
        FullName: document.getElementById('fullName').value,
        NationalIdentityNumber: document.getElementById('nin').value,
        MobileNumber: document.getElementById('mobileNumber').value,
        HubLocation: document.getElementById('hubLocation').value,
        KYW_Consent_Signed: document.getElementById('kywConsent').checked
    };

    if (!payload.KYW_Consent_Signed) {
        msgDiv.style.color = "#ef4444";
        msgDiv.innerText = "You must accept the KYW Consent terms to proceed.";
        return;
    }

    try {
        const response = await functions.createExecution(
            '6a5be27a00193cc88c24',          // Replace with your Appwrite Function ID
            JSON.stringify(payload),      
            false,                        
            '/submit',                    
            'POST'                        
        );

        const result = JSON.parse(response.responseBody);

        if (response.statusCode === 201 || response.statusCode === 200) {
            msgDiv.style.color = "#10b981";
            msgDiv.innerText = "Application submitted successfully!";
            document.getElementById('applicantForm').reset();
        } else {
            msgDiv.style.color = "#ef4444";
            msgDiv.innerText = result.errors ? result.errors.join(" | ") : (result.error || "Submission failed.");
        }

    } catch (error) {
        console.error("Submission error:", error);
        msgDiv.style.color = "#ef4444";
        msgDiv.innerText = "Submission failed. Please check backend network routing.";
    }
});
