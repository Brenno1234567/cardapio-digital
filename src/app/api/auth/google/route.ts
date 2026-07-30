import { NextResponse } from "next/server";
import { firebaseAuth } from "../../../../lib/firebase-admin";
import { setAuthCookies } from "../../../../lib/auth";

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

    const decoded = await firebaseAuth().verifyIdToken(idToken);
    const email = decoded.email?.toLowerCase();

    if (!email || !decoded.email_verified || !allowedAdminEmails().has(email)) {
      return NextResponse.json({ error: "Esta conta Google nÃ£o tem acesso." }, { status: 403 });
    }

    await setAuthCookies("admin");
    return NextResponse.json({ success: true, cargo: "admin", nome: decoded.name ?? email });
  } catch (error) {
    console.error("Erro no login Google:", error);
    return NextResponse.json({ error: "NÃ£o foi possÃ­vel validar login Google." }, { status: 401 });
  }
}
