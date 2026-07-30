import { NextResponse } from "next/server";
import { setAuthCookies } from "../../../../lib/auth";

export const runtime = "nodejs";

interface FirebaseAccount {
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
}

function allowedAdminEmails() {
  return new Set(
    (process.env.GOOGLE_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "Token Google invÃ¡lido." }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) throw new Error("Firebase ainda nÃ£o configurado.");

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    const accountData = await response.json();
    const account = accountData.users?.[0] as FirebaseAccount | undefined;
    const email = account?.email?.toLowerCase();

    if (!response.ok || !email || !account?.emailVerified || !allowedAdminEmails().has(email)) {
      return NextResponse.json({ error: "Esta conta Google nÃ£o tem acesso." }, { status: 403 });
    }

    await setAuthCookies("admin");
    return NextResponse.json({ success: true, cargo: "admin", nome: account?.displayName ?? email });
  } catch (error) {
    console.error("Erro no login Google:", error);
    return NextResponse.json({ error: "NÃ£o foi possÃ­vel validar login Google." }, { status: 401 });
  }
}
