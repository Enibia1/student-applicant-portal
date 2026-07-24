const API_URL =
    "https://6a60f589000c366da0d3.sfo.appwrite.run";

console.log("REGISTER.JS LOADED");
console.log("API URL:", API_URL);

window.addEventListener("load", async function () {

    const error = document.getElementById("error");

    error.style.display = "block";
    error.textContent =
        "🔄 Testing connection to registration server...";

    try {

        const response = await fetch(API_URL, {
            method: "POST",

            headers: {
                "Content-Type": "text/plain"
            },

            body: JSON.stringify({
                method: "email",
                email: "test@example.com",
                password: "TestPassword123"
            })
        });

        const text = await response.text();

        error.textContent =
            "✅ SERVER REACHED\n\n" +
            "Status: " +
            response.status +
            "\n\n" +
            text;

        console.log("STATUS:", response.status);
        console.log("RESPONSE:", text);

    } catch (error) {

        console.error("FETCH ERROR:", error);

        error.textContent =
            "❌ FETCH FAILED\n\n" +
            error.message;

    }

});
