"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Link, getPathname } from "@/i18n/navigation";
import {
  deleteMyAccount,
  signOut,
  updatePassword,
  type AuthResult,
} from "@/lib/auth/actions";
import { useUser } from "@/lib/auth/useUser";
import { clearLocalStudyData } from "@/lib/sync/engine";
import { releaseOwner } from "@/lib/sync/owner";
import { clearCachedPages } from "@/lib/access/offline";
import { useSyncStatus } from "@/lib/sync/status";
import { AuthForm, fieldClass } from "./AuthForm";

/** Account details, sync state, password change, sign-out and account deletion. */
export function AccountPanel() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const user = useUser();
  const sync = useSyncStatus();
  const confirmDialog = useRef<HTMLDialogElement>(null);
  const [keepLocal, setKeepLocal] = useState(true);
  const [deleted, remove, removing] = useActionState<AuthResult>(
    async () => {
      const result = await deleteMyAccount();
      if (result.status === "ok") {
        releaseOwner();
        await clearCachedPages();
        if (!keepLocal) clearLocalStudyData();
        // A full load, so nothing filtered for this session stays in memory.
        window.location.assign(getPathname({ href: "/", locale }));
      }
      return result;
    },
    { status: "idle" },
  );

  if (user === undefined) return <p aria-busy="true">{t("loading")}</p>;
  if (user === null)
    return (
      <div className="space-y-4">
        <p>{t("signedOut")}</p>
        <ButtonLink href="/sign-in" variant="primary">
          {t("signIn")}
        </ButtonLink>
      </div>
    );

  return (
    <div className="max-w-[68ch] space-y-10">
      <section aria-labelledby="who-heading">
        <h2 id="who-heading" className="text-lg font-bold">
          {t("signedInAs", { email: user.email ?? "" })}
        </h2>
        <p role="status" className="mt-2 text-ink-soft">
          {t(`sync.${sync}`)}
        </p>
        <p className="mt-2 text-ink-soft">
          {t.rich("exportHint", {
            settings: (chunks) => (
              <Link href="/settings" className="underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
        <form
          action={async () => {
            await signOut();
            await clearCachedPages();
            // A full load, so nothing filtered for this session stays in memory.
            window.location.assign(getPathname({ href: "/", locale }));
          }}
          className="mt-4"
        >
          <Button type="submit">{t("signOut")}</Button>
        </form>
      </section>
      <section id="password" aria-labelledby="password-heading">
        <h2 id="password-heading" className="text-lg font-bold">
          {t("changePassword")}
        </h2>
        <div className="mt-3 max-w-[44ch]">
          <AuthForm
            action={updatePassword}
            locale={locale}
            submit={t("updatePassword")}
          >
            <div>
              <label htmlFor="new-password" className="block font-semibold">
                {t("newPassword")}
              </label>
              <input
                id="new-password"
                name="password"
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
                className={fieldClass}
              />
            </div>
          </AuthForm>
        </div>
      </section>
      <section aria-labelledby="delete-heading">
        <h2 id="delete-heading" className="text-lg font-bold">
          {t("deleteTitle")}
        </h2>
        <p className="mt-2 text-ink-soft">{t("deleteBody")}</p>
        <Button
          className="mt-4"
          onClick={() => confirmDialog.current?.showModal()}
        >
          {t("deleteButton")}
        </Button>
        <dialog
          ref={confirmDialog}
          className="m-auto max-w-[44ch] rounded-page bg-sheet p-6 text-ink backdrop:bg-ink/50"
        >
          <form action={remove} className="space-y-4">
            <p className="font-semibold">{t("deleteConfirm")}</p>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={keepLocal}
                onChange={(event) => setKeepLocal(event.target.checked)}
                className="mt-1.5 size-5"
              />
              <span>{t("keepLocal")}</span>
            </label>
            <div className="flex gap-3">
              <Button type="submit" variant="primary" disabled={removing}>
                {t("deleteFinal")}
              </Button>
              <Button onClick={() => confirmDialog.current?.close()}>
                {t("cancel")}
              </Button>
            </div>
            {deleted.status === "error" ? (
              <p role="alert" className="font-semibold text-refusal">
                {t("messages.failed")}
              </p>
            ) : null}
          </form>
        </dialog>
      </section>
    </div>
  );
}
