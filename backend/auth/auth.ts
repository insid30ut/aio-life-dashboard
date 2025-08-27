import { auth, AuthError } from "encore.dev/auth";
import { clerkClient } from "@clerk/clerk-sdk-node";

// This is the auth handler for the application.
// It is used by other endpoints to protect them from unauthorized access.
//
// Encore API endpoints that want to use this auth handler should specify
// `auth: true` in their options.
//
// Learn more: https://encore.dev/docs/develop/auth
export const handler = auth(async (req) => {
  const header = req.headers.get("Authorization");
  if (!header) {
    throw new AuthError("missing Authorization header");
  }

  const match = header.match(/^Bearer (.+)$/);
  if (!match) {
    throw new AuthError("invalid Authorization header");
  }
  const token = match[1];

  try {
    const claims = await clerkClient.verifyToken(token);
    if (!claims.sub) {
      throw new AuthError("invalid token: missing sub claim");
    }

    // The `sub` claim is the user ID from Clerk.
    // We pass this in the payload to downstream APIs.
    return {
      userID: claims.sub,
    };
  } catch (err) {
    throw new AuthError(`invalid token: ${(err as Error).message}`);
  }
});

// Define a public type for the auth payload, so other services can import it.
export type AuthPayload = {
  userID: string;
};
