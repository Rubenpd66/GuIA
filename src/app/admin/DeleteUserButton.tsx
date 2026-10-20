"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { deleteUserAsAdmin } from "@/lib/admin/actions";

export function DeleteUserButton({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [result, action, pending] = useActionState(deleteUserAsAdmin, null);
  return (
    <>
      <Button onClick={() => dialog.current?.showModal()}>Borrar</Button>
      <dialog
        ref={dialog}
        className="m-auto max-w-[44ch] rounded-card bg-surface p-6 text-ink backdrop:bg-ink/50"
      >
        <form action={action} className="space-y-4">
          <input type="hidden" name="userId" value={userId} />
          <p className="font-semibold">
            ¿Borrar la cuenta de {email} y todos sus datos? No se puede
            deshacer.
          </p>
          {result ? (
            <p role="alert" className="font-semibold text-danger">
              {result.error}
            </p>
          ) : null}
          <div className="flex gap-3">
            <Button type="submit" variant="primary" disabled={pending}>
              Sí, borrar
            </Button>
            <Button onClick={() => dialog.current?.close()}>Cancelar</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
