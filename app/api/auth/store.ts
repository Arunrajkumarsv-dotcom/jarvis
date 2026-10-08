import { randomBytes } from "node:crypto";

type OtpRecord = { code: string; expiresAt: number };
type SessionRecord = { email: string; expiresAt: number };

const globalStore = globalThis as typeof globalThis & {
  __jarvisAuth?: { otps: Map<string, OtpRecord>; sessions: Map<string, SessionRecord> };
};
const store = globalStore.__jarvisAuth ?? { otps: new Map<string, OtpRecord>(), sessions: new Map<string, SessionRecord>() };
globalStore.__jarvisAuth = store;

export const AUTH_TTL = 5 * 60 * 1000;
export const RESEND_TTL = 60 * 1000;

export function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
export function createOtp() { return String(parseInt(randomBytes(4).toString("hex"), 16) % 1_000_000).padStart(6, "0"); }
export function saveOtp(email: string, code: string) { store.otps.set(normalizeEmail(email), { code, expiresAt: Date.now() + AUTH_TTL }); }
export function consumeOtp(email: string, code: string) {
  const key = normalizeEmail(email);
  const record = store.otps.get(key);
  if (!record || record.expiresAt < Date.now() || record.code !== code) return false;
  store.otps.delete(key);
  return true;
}
export function saveSession(token: string, email: string) { store.sessions.set(token, { email: normalizeEmail(email), expiresAt: Date.now() + 24 * 60 * 60 * 1000 }); }
export function getSession(token: string) {
  const session = store.sessions.get(token);
  if (!session || session.expiresAt < Date.now()) { if (session) store.sessions.delete(token); return null; }
  return session;
}