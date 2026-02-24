import { google } from "googleapis";

function getAuthClient() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    return oauth2Client;
}

/**
 *
 * @param {Object} params
 * @param {string} params.clientName - Client's name
 * @param {string} params.clientEmail - Client's email
 * @param {string} params.date - Date in YYYY-MM-DD format
 * @param {string} params.time - Time in HH:MM format
 * @param {string} params.reason - Reason for consultation (optional)
 * @param {string} params.tipoConsulta - Type of consultation (optional)
 * @returns {Promise<{ meetLink: string, eventId: string, htmlLink: string }>}
 */
export async function createCalendarEvent({
    clientName,
    clientEmail,
    date,
    time,
    reason,
    tipoConsulta,
}) {
    const auth = getAuthClient();
    const calendar = google.calendar({ version: "v3", auth });

    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
    const nutritionistEmail = process.env.NUTRITIONIST_EMAIL;
    const nutritionistName =
        process.env.NUTRITIONIST_NAME || "Teresa Pereira Soares";

    const startDateTime = `${date}T${time}:00`;
    const timeZone = "Europe/Lisbon";

    const [h, m] = time.split(":").map(Number);
    const endH = h + 1;
    const endTime = `${String(endH).padStart(2, "0")}:${String(m).padStart(
        2,
        "0"
    )}`;
    const endDateTime = `${date}T${endTime}:00`;

    const descriptionParts = [];
    if (tipoConsulta) descriptionParts.push(`Tipo: ${tipoConsulta}`);
    if (reason) descriptionParts.push(`Motivo: ${reason}`);
    const description =
        descriptionParts.length > 0
            ? descriptionParts.join("\n")
            : "Consulta de Nutrição";

    const event = {
        summary: `Consulta de Nutrição - ${clientName}`,
        description,
        start: {
            dateTime: startDateTime,
            timeZone,
        },
        end: {
            dateTime: endDateTime,
            timeZone,
        },
        attendees: [
            {
                email: nutritionistEmail,
                displayName: nutritionistName,
                responseStatus: "accepted",
            },
            { email: clientEmail, displayName: clientName },
        ],
        reminders: {
            useDefault: false,
            overrides: [
                { method: "email", minutes: 30 },
                { method: "popup", minutes: 30 },
            ],
        },
        conferenceData: {
            createRequest: {
                requestId: `nutribase-${date}-${time}-${Date.now()}`,
                conferenceSolutionKey: {
                    type: "hangoutsMeet",
                },
            },
        },
    };

    const response = await calendar.events.insert({
        calendarId,
        resource: event,
        conferenceDataVersion: 1,
        sendUpdates: "all",
    });

    const meetLink =
        response.data.conferenceData?.entryPoints?.find(
            (ep) => ep.entryPointType === "video"
        )?.uri || "";

    return {
        meetLink,
        eventId: response.data.id,
        htmlLink: response.data.htmlLink,
    };
}

/**
 *
 * @param {string} eventId 
 */
export async function deleteCalendarEvent(eventId) {
    const auth = getAuthClient();
    const calendar = google.calendar({ version: "v3", auth });

    await calendar.events.delete({
        calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
        eventId,
        sendUpdates: "all",
    });
}
