// Подпись ссылок на скачивание готового плана — без пароля и без личного кабинета.
import crypto from "crypto";

const SECRET = process.env.AUTH_SECRET || "dev-secret-change-me";

export type DownloadPayload = { orderId: string; email: string };

export function signToken(payload: DownloadPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyToken(token: string | undefined | null): DownloadPayload | null {
  if (!token) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString()) as DownloadPayload;
  } catch {
    return null;
  }
}
