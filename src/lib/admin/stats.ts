const DAY = 24 * 60 * 60 * 1000;
export const SIGNUP_WEEKS = 8;

export type AdminUser = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
};

export type AdminStats = {
  total: number;
  active7: number;
  active30: number;
  /** New accounts per week, newest first: [0] is the last 7 days. */
  signupsByWeek: number[];
  /** Finished sessions per exam part, summed over every learner (no one's own data). */
  attemptsByPart: Record<string, number>;
};

/** Aggregates only: counts of accounts and of finished sessions, never anyone's answers. */
export function summarise(
  users: readonly AdminUser[],
  attemptParts: readonly string[],
  now: number,
): AdminStats {
  const signupsByWeek = Array<number>(SIGNUP_WEEKS).fill(0);
  let active7 = 0;
  let active30 = 0;
  for (const user of users) {
    const week = Math.floor((now - Date.parse(user.createdAt)) / (7 * DAY));
    if (week >= 0 && week < SIGNUP_WEEKS) signupsByWeek[week]!++;
    if (user.lastSignInAt) {
      const days = (now - Date.parse(user.lastSignInAt)) / DAY;
      if (days <= 7) active7++;
      if (days <= 30) active30++;
    }
  }
  const attemptsByPart: Record<string, number> = {};
  for (const part of attemptParts)
    attemptsByPart[part] = (attemptsByPart[part] ?? 0) + 1;
  return {
    total: users.length,
    active7,
    active30,
    signupsByWeek,
    attemptsByPart,
  };
}

/** Admin only through `app_metadata`, which a learner cannot edit (unlike `user_metadata`). */
export function isAdminClaims(claims: unknown): boolean {
  const meta = (claims as { app_metadata?: { role?: unknown } } | null)
    ?.app_metadata;
  return meta?.role === "admin";
}
