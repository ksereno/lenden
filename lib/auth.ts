// Supabase auth is email-based, but the group signs in with plain usernames.
// Each account's real email in Supabase is "<username>@lenden.local".
export const USERNAME_DOMAIN = "lenden.local";

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${USERNAME_DOMAIN}`;
}
