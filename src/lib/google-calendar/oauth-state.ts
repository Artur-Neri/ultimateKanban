import crypto from "crypto";

const STATE_TTL_MS = 10 * 60 * 1000;

function getSigningKey(): Buffer {
  const envKey = process.env.APP_ENCRYPTION_KEY;
  if (!envKey) {
    throw new Error("APP_ENCRYPTION_KEY não está configurada.");
  }
  return crypto.createHash("sha256").update(envKey).digest();
}

type OAuthStatePayload = {
  projectId: string;
  nonce: string;
  expiresAt: number;
};

export function createOAuthState(projectId: string): string {
  const payload: OAuthStatePayload = {
    projectId,
    nonce: crypto.randomBytes(16).toString("hex"),
    expiresAt: Date.now() + STATE_TTL_MS,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  const signature = crypto
    .createHmac("sha256", getSigningKey())
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

export function verifyOAuthState(state: string): string {
  const [payloadBase64, signature] = state.split(".");
  if (!payloadBase64 || !signature) {
    throw new Error("State OAuth inválido.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", getSigningKey())
    .update(payloadBase64)
    .digest("base64url");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new Error("State OAuth inválido.");
  }

  const payload = JSON.parse(
    Buffer.from(payloadBase64, "base64url").toString("utf8"),
  ) as OAuthStatePayload;

  if (Date.now() > payload.expiresAt) {
    throw new Error("State OAuth expirado. Tente conectar novamente.");
  }

  return payload.projectId;
}
