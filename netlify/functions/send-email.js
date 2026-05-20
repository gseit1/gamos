exports.handler = async (event) => {
    // 1. Διασφαλίζουμε ότι λαμβάνουμε POST request
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 2. Μετατρέπουμε τα δεδομένα της φόρμας (urlencoded) σε αντικείμενο
        const querystring = await import('querystring');
        const formData = querystring.parse(event.body);

        // 3. Παίρνουμε το API Key από το Netlify (ΠΡΕΠΕΙ ΝΑ ΤΟ ΟΝΟΜΑΣΕΣ BREVO_API_KEY)
        const apiKey = process.env.BREVO_API_KEY; 
        
        // 4. ΕΔΩ ΒΑΛΤΕ ΤΟ ΠΡΟΣΩΠΙΚΟ ΣΑΣ EMAIL (Που θα λαμβάνετε τις ειδοποιήσεις)
        const YOUR_PERSONAL_EMAIL = "giorgosseitar@gmail.com"; // Αλλάξτε το με το πραγματικό σας

        let subject = "";
        let htmlContent = "";

        // Ελέγχουμε αν είναι η φόρμα του RSVP ή του Quiz βάσει των πεδίων
        if (formData.ATTENDANCE) {
            // Είναι RSVP
            subject = `Νέο RSVP από: ${formData.LASTNAME || 'Άγνωστο'}`;
            htmlContent = `
                <h2>Νέα Επιβεβαίωση Παρουσίας!</h2>
                <p><strong>Όνομα:</strong> ${formData.LASTNAME}</p>
                <p><strong>Email:</strong> ${formData.EMAIL}</p>
                <p><strong>Παρουσία:</strong> ${formData.ATTENDANCE}</p>
                <p><strong>Άτομα:</strong> ${formData.GUESTS}</p>
                <p><strong>Μήνυμα/Ευχές:</strong> ${formData.MESSAGE || '-'}</p>
            `;
        } else {
            // Είναι Quiz
            subject = `Νέο Quiz από: ${formData.QUIZ_NAME || 'Άγνωστο'}`;
            htmlContent = `
                <h2>Νέες Απαντήσεις στο Quiz!</h2>
                <p><strong>Από:</strong> ${formData.QUIZ_NAME}</p>
                <p><strong>Γιώργος (1 λέξη):</strong> ${formData.Q1_WORD}</p>
                <p><strong>Νεκταρία (1 λέξη):</strong> ${formData.Q2_WORD}</p>
                <p><strong>Τραγούδι (Ζευγάρι):</strong> ${formData.Q3_SONG}</p>
                <p><strong>Τραγούδι Εισόδου:</strong> ${formData.Q4_ENTRANCE}</p>
            `;
        }

        // 5. Προετοιμασία των δεδομένων για το Brevo API
        const payload = {
            sender: { 
                name: "giorgos", 
                email: "giorgosseitar@gmail.com" // Το Brevo συνήθως δέχεται οποιοδήποτε email εδώ, αρκεί να στέλνετε σε εσάς
            },
            to: [{ 
                email: YOUR_PERSONAL_EMAIL,
                name: "Γιώργος & Νεκταρία"
            }],
            subject: subject,
            htmlContent: htmlContent
        };

        // 6. Στέλνουμε το αίτημα στο Brevo
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": apiKey,
                "content-type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Brevo API Error:", errorText);
            throw new Error('Failed to send email through Brevo');
        }

        // 7. Αν πετύχει, ανακατευθύνουμε τον χρήστη πίσω στο site με ένα ?success=true στο link
        return {
            statusCode: 302,
            headers: {
                Location: '/?success=true'
            }
        };

    } catch (error) {
        console.error("Function Error:", error);
        return {
            statusCode: 500,
            body: "Κάτι πήγε στραβά κατά την αποστολή... Δοκιμάστε ξανά."
        };
    }
};