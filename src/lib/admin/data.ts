import "server-only";
import { parseProgress } from "@/lib/progress/progress";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { summarise, type AdminStats, type AdminUser } from "./stats";

const PAGE = 1000;

/** Every account (email, sign-up and last sign-in) and the aggregate numbers. Server only. */
export async function loadAdminData(): Promise<{
  users: AdminUser[];
  stats: AdminStats;
} | null> {
  const admin = supabaseAdmin();
  if (!admin) return null;
  const users: AdminUser[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: PAGE,
    });
    if (error) throw error;
    for (const u of data.users)
      users.push({
        id: u.id,
        email: u.email ?? "",
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
      });
    if (data.users.length < PAGE) break;
  }
  const { data: rows, error } = await admin
    .from("user_data")
    .select("value")
    .eq("key", "progress");
  if (error) throw error;
  // Only the part of each finished session is read, to count it.
  const parts = rows.flatMap((row) =>
    parseProgress(JSON.stringify(row.value?.data)).attempts.map((a) => a.part),
  );
  return { users, stats: summarise(users, parts, Date.now()) };
}
