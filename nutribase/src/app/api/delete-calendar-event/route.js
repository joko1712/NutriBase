import { NextResponse } from "next/server";
import { deleteCalendarEvent } from "@/lib/googleCalendar";
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

        const { eventId } = await request.json();
        if (!eventId) {
            return NextResponse.json(
                { error: "Missing eventId" },
                { status: 400 }
            );
        }

        await deleteCalendarEvent(eventId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting calendar event:", error);
        return NextResponse.json(
            {
                error: "Failed to delete calendar event",
                details: error.message,
            },
            { status: 500 }
        );
    }
}
