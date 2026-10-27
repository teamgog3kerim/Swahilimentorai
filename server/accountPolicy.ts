export const normalizedEmail = (email: string) => email.trim().toLowerCase();

export function isOwnerEmail(email: string) {
  const owner = process.env.APP_OWNER_EMAIL;
  return Boolean(owner && normalizedEmail(email) === normalizedEmail(owner));
}

export function verifiedGoogleProfile(claims: Record<string, unknown>) {
  if (claims.email_verified !== true || typeof claims.sub !== "string" ||
      typeof claims.email !== "string" ||
      !/^[^@\s]+@gmail\.com$/i.test(claims.email)) {
    throw new Error("verified_gmail_required");
  }
  return {
    googleId: claims.sub,
    email: normalizedEmail(claims.email),
    username: typeof claims.name === "string" ? claims.name.slice(0, 100) : claims.email.split("@")[0],
    profileImageUrl: typeof claims.picture === "string" ? claims.picture : null,
  };
}

export function mayLinkGoogleAccount(
  existing: { id: string; email: string; googleId: string | null },
  googleId: string,
  currentUserId?: string,
) {
  if (existing.googleId) return existing.googleId === googleId;
  // Only the verified Google identity may bootstrap the configured owner.
  return existing.id === currentUserId || isOwnerEmail(existing.email);
}
