import { loadAdminData } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/admin/guard";
import { SIGNUP_WEEKS } from "@/lib/admin/stats";
import { DeleteUserButton } from "./DeleteUserButton";

const SHOWN = 50;
const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "—");

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const me = await requireAdmin();
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim().toLowerCase() ?? "";
  const data = await loadAdminData();
  if (!data) return <p>Falta SUPABASE_SECRET_KEY en el servidor.</p>;
  const { users, stats } = data;
  const matches = users
    .filter((u) => u.email.toLowerCase().includes(query))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-extrabold font-expanded">Administración</h1>
      <section aria-labelledby="users-stats" className="space-y-2">
        <h2 id="users-stats" className="text-lg font-bold">
          Usuarios
        </h2>
        <p>
          Total: {stats.total} · Activos 7 días: {stats.active7} · Activos 30
          días: {stats.active30}
        </p>
        <p>
          Altas por semana (de la más reciente a la más antigua, {SIGNUP_WEEKS}{" "}
          semanas): {stats.signupsByWeek.join(", ")}
        </p>
      </section>
      <section aria-labelledby="usage" className="space-y-2">
        <h2 id="usage" className="text-lg font-bold">
          Sesiones terminadas por parte
        </h2>
        <p className="text-ink-soft">
          Suma de todos los usuarios con cuenta; no se ve el contenido de nadie.
        </p>
        <ul className="grid gap-x-8 sm:grid-cols-2">
          {Object.entries(stats.attemptsByPart)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([part, count]) => (
              <li
                key={part}
                className="flex justify-between border-b border-hairline py-1"
              >
                <span>{part}</span>
                <span>{count}</span>
              </li>
            ))}
        </ul>
      </section>
      <section aria-labelledby="list" className="space-y-3">
        <h2 id="list" className="text-lg font-bold">
          Lista de usuarios
        </h2>
        <form className="flex gap-3">
          <label htmlFor="q" className="sr-only">
            Buscar por email
          </label>
          <input
            id="q"
            name="q"
            defaultValue={query}
            placeholder="Buscar por email"
            className="min-h-12 flex-1 rounded-control border-[1.5px] border-line bg-paper px-3"
          />
          <button className="min-h-12 rounded-control border-[1.5px] border-line px-5 font-semibold">
            Buscar
          </button>
        </form>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line">
              <th className="py-2">Email</th>
              <th>Alta</th>
              <th>Último acceso</th>
              <th>
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {matches.slice(0, SHOWN).map((u) => (
              <tr key={u.id} className="border-b border-hairline">
                <td className="py-2 break-all">{u.email}</td>
                <td>{day(u.createdAt)}</td>
                <td>{day(u.lastSignInAt)}</td>
                <td className="text-right">
                  {u.id === me.id ? null : (
                    <DeleteUserButton userId={u.id} email={u.email} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {matches.length > SHOWN ? (
          <p className="text-ink-soft">
            Se muestran {SHOWN} de {matches.length}. Afina la búsqueda.
          </p>
        ) : null}
      </section>
    </div>
  );
}
