import { google } from "googleapis";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { db } from "@/lib/db";

export const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar";

export const GOOGLE_USERINFO_EMAIL_SCOPE =
  "https://www.googleapis.com/auth/userinfo.email";

function getOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Credenciais Google OAuth não configuradas (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI).",
    );
  }

  return { clientId, clientSecret, redirectUri };
}

export function createOAuth2Client() {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthorizationUrl(state: string): string {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [GOOGLE_CALENDAR_SCOPE, GOOGLE_USERINFO_EMAIL_SCOPE],
    state,
  });
}

async function fetchAccountEmail(
  client: ReturnType<typeof createOAuth2Client>,
  refreshToken: string,
): Promise<string | null> {
  try {
    client.setCredentials({ refresh_token: refreshToken });
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const userInfo = await oauth2.userinfo.get();
    return userInfo.data.email ?? null;
  } catch {
    return null;
  }
}

export async function disconnectGoogleIntegration() {
  await db.googleIntegration.deleteMany();
}

export async function exchangeCodeForTokens(code: string) {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);

  const existing = await db.googleIntegration.findFirst();

  if (!tokens.refresh_token) {
    throw new Error(
      "Google não enviou um novo token de acesso. Revogue o ultimateKanban em myaccount.google.com/permissions e conecte de novo para conceder acesso ao calendário.",
    );
  }

  const refreshToken = tokens.refresh_token;

  let accountEmail =
    (await fetchAccountEmail(client, refreshToken)) ?? existing?.accountEmail ?? null;

  if (existing) {
    await db.googleIntegration.update({
      where: { id: existing.id },
      data: {
        encryptedRefreshToken: encryptSecret(refreshToken),
        accountEmail,
      },
    });
  } else {
    await db.googleIntegration.create({
      data: {
        encryptedRefreshToken: encryptSecret(refreshToken),
        accountEmail,
      },
    });
  }

  return accountEmail;
}

export async function getAuthenticatedClient() {
  const integration = await db.googleIntegration.findFirst();
  if (!integration) {
    return null;
  }

  const client = createOAuth2Client();
  const refreshToken = decryptSecret(integration.encryptedRefreshToken);
  client.setCredentials({ refresh_token: refreshToken });

  return client;
}

export async function isGoogleConnected(): Promise<boolean> {
  const integration = await db.googleIntegration.findFirst();
  return Boolean(integration);
}

export async function getGoogleAccountEmail(): Promise<string | null> {
  const integration = await db.googleIntegration.findFirst();
  return integration?.accountEmail ?? null;
}
