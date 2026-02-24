import { NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/googleCalendar";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(request) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }
        const token = authHeader.split("Bearer ")[1];
        try {
            await adminAuth.verifyIdToken(token);
        } catch {
            return NextResponse.json(
                { error: "Invalid token" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { clientName, clientEmail, date, time, reason, tipoConsulta } =
            body;

        if (!clientName || !clientEmail || !date || !time) {
            return NextResponse.json(
                {
                    error: "Missing required fields: clientName, clientEmail, date, time",
                },
                { status: 400 }
            );
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return NextResponse.json(
                { error: "Invalid date format. Expected YYYY-MM-DD" },
                { status: 400 }
            );
        }

        if (!/^\d{2}:\d{2}$/.test(time)) {
            return NextResponse.json(
                { error: "Invalid time format. Expected HH:MM" },
                { status: 400 }
            );
        }

        const result = await createCalendarEvent({
            clientName,
            clientEmail,
            date,
            time,
            reason: reason || "",
            tipoConsulta: tipoConsulta || "",
        });

        return NextResponse.json({
            success: true,
            meetLink: result.meetLink,
            eventId: result.eventId,
            htmlLink: result.htmlLink,
        });
    } catch (error) {
        console.error("Error creating calendar event:", error);
        return NextResponse.json(
            {
                error: "Failed to create calendar event",
                details: error.message,
            },
            { status: 500 }
        );
    }
}
