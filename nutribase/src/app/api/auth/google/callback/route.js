import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
        return new NextResponse(
            `<html><body>
                <h1>Authorization Failed</h1>
                <p>Error: ${error}</p>
                <a href="/api/auth/google">Try again</a>
            </body></html>`,
            { headers: { "Content-Type": "text/html" } }
        );
    }

    if (!code) {
        return new NextResponse(
            `<html><body>
                <h1>No authorization code received</h1>
                <a href="/api/auth/google">Try again</a>
            </body></html>`,
            { headers: { "Content-Type": "text/html" } }
        );
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        const { tokens } = await oauth2Client.getToken(code);

        return new NextResponse(
            `<html><body style="font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px;">
                <h1 style="color: #4caf50;">✅ Authorization Successful!</h1>
                <p>Copy the refresh token below and add it to your <code>.env</code> file:</p>
                <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; word-break: break-all; margin: 16px 0;">
                    <code>GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}</code>
                </div>
                <p style="color: #666;">After adding it to <code>.env</code>, restart <code>npm run dev</code>.</p>
                <p style="color: #666;">You only need to do this once. The refresh token works permanently.</p>
            </body></html>`,
            { headers: { "Content-Type": "text/html" } }
        );
    } catch (err) {
        console.error("OAuth2 callback error:", err);
        return new NextResponse(
            `<html><body>
                <h1>Token Exchange Failed</h1>
                <p>Error: ${err.message}</p>
                <a href="/api/auth/google">Try again</a>
            </body></html>`,
            { headers: { "Content-Type": "text/html" } }
        );
    }
}
