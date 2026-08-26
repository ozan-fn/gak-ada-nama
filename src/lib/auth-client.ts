import { createAuthClient } from "better-auth/react";

const resolvedBaseUrl =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.BETTER_AUTH_URL ?? "http://localhost:3001";

export const authClient = createAuthClient({
  baseURL: resolvedBaseUrl,
});

export const { useSession, signOut } = authClient;
