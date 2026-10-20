"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cancelStripeFor } from "@/lib/stripe/cancel";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "./guard";

export type AdminDeleteResult = { error: string } | null;

/** Deletes a learner's account (and, by cascade, their study data) and records who did it. */
export async function deleteUserAsAdmin(
  _previous: AdminDeleteResult,
  form: FormData,
): Promise<AdminDeleteResult> {
  const admin = await requireAdmin();
  const target = z.uuid().safeParse(form.get("userId"));
  const client = supabaseAdmin();
  // An administrator cannot remove their own account from here (use the account page).
  if (!target.success || !client || target.data === admin.id)
    return { error: "No se puede borrar esta cuenta desde aquí." };
  if (!(await cancelStripeFor(target.data)))
    return {
      error:
        "No se pudo cancelar su suscripción en Stripe, así que la cuenta sigue. Inténtalo más tarde o cancélala en Stripe.",
    };
  const { error } = await client.auth.admin.deleteUser(target.data);
  if (error)
    return { error: "No se pudo borrar la cuenta. Inténtalo de nuevo." };
  await client.from("admin_log").insert({
    admin_id: admin.id,
    action: "delete_user",
    target_id: target.data,
  });
  revalidatePath("/admin");
  return null;
}
