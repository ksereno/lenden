import type { Profile } from "@/lib/types";

export function FriendBadge({ profile }: { profile: Pick<Profile, "full_name" | "email" | "highlight_color"> }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: profile.highlight_color }}
        aria-hidden
      />
      {profile.full_name || profile.email}
    </span>
  );
}
