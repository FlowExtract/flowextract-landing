export default async function handler(request, response) {
    if (request.method !== "POST") {
        return response.status(405).json({ error: "Method not allowed" });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.PILOT_TO_EMAIL || "contact@flowextract.dk";
    const fromEmail = process.env.PILOT_FROM_EMAIL || "FlowExtract <onboarding@resend.dev>";

    if (!resendApiKey) {
        return response.status(500).json({ error: "Missing RESEND_API_KEY" });
    }

    const {
        name = "",
        company = "",
        email = "",
        phone = "",
        website = "",
        volume = "",
        channels = "",
        pain = "",
        notes = ""
    } = request.body || {};

    if (!name || !company || !email) {
        return response.status(400).json({ error: "Name, company and email are required" });
    }

    const subject = `New FlowExtract pilot request - ${company}`;

    const text = `
New FlowExtract pilot request

Name: ${name}
Company: ${company}
Email: ${email}
Phone: ${phone || "-"}
Website: ${website || "-"}
Monthly message volume: ${volume || "-"}
Channels: ${channels || "-"}

Workflow pain:
${pain || "-"}

Extra notes:
${notes || "-"}
`.trim();

    const html = `
        <h2>New FlowExtract pilot request</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Company:</strong> ${escapeHtml(company)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone || "-")}</p>
        <p><strong>Website:</strong> ${escapeHtml(website || "-")}</p>
        <p><strong>Monthly message volume:</strong> ${escapeHtml(volume || "-")}</p>
        <p><strong>Channels:</strong> ${escapeHtml(channels || "-")}</p>
        <h3>Workflow pain</h3>
        <p>${escapeHtml(pain || "-").replaceAll("\n", "<br />")}</p>
        <h3>Extra notes</h3>
        <p>${escapeHtml(notes || "-").replaceAll("\n", "<br />")}</p>
    `;

    try {
        const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [toEmail],
                reply_to: email,
                subject,
                text,
                html
            })
        });

        if (!resendResponse.ok) {
            const errorText = await resendResponse.text();
            return response.status(502).json({ error: "Email provider failed", details: errorText });
        }

        return response.status(200).json({ ok: true });
    } catch (error) {
        return response.status(500).json({ error: "Failed to send email" });
    }
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
