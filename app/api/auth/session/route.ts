import { NextResponse } from "next/server";
import { getSession } from "../store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const session = getSession(token);
  if (!session) return NextResponse.json({ ok: false, authenticated: false }, { status: 401 });
  return NextResponse.json({ ok: true, authenticated: true, user: { email: session.email, name: session.email.split("@")[0], accessLevel: "ADMIN_OPERATOR" } });
}