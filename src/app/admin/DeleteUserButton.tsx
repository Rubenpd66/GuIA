"use client";

import { useRef } from "react";
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
  return (
    <>
      <Button onClick={() => dialog.current?.showModal()}>Borrar</Button>
      <dialog
        ref={dialog}
        className="m-auto max-w-[44ch] rounded-page bg-sheet p-6 text-ink backdrop:bg-ink/50"
      >
        <form action={deleteUserAsAdmin} className="space-y-4">
          <input type="hidden" name="userId" value={userId} />
          <p className="font-semibold">
            ¿Borrar la cuenta de {email} y todos sus datos? No se puede
            deshacer.
          </p>
          <div className="flex gap-3">
            <Button type="submit" variant="primary">
              Sí, borrar
            </Button>
            <Button onClick={() => dialog.current?.close()}>Cancelar</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
