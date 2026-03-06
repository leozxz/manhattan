import { PluggyClient } from "pluggy-sdk";

export function createPluggyClient() {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing PLUGGY_CLIENT_ID or PLUGGY_CLIENT_SECRET in environment variables"
    );
  }

  return new PluggyClient({
    clientId,
    clientSecret,
  });
}
