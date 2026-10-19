"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cancelStripeFor } from "@/lib/stripe/cancel";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "./guard";

/** Deletes a learner's account (and, by cascade, their study data) and records who did it. */
export async function deleteUserAsAdmin(form: FormData) {
  const admin = await requireAdmin();
  const target = z.uuid().safeParse(form.get("userId"));
  const client = supabaseAdmin();
  // An administrator cannot remove their own account from here (use the account page).
  if (!target.success || !client || target.data === admin.id) return;
  if (!(await cancelStripeFor(target.data))) return;
  const { error } = await client.auth.admin.deleteUser(target.data);
  if (error) return;
  await client.from("admin_log").insert({
    admin_id: admin.id,
    action: "delete_user",
    target_id: target.data,
  });
  revalidatePath("/admin");
}
