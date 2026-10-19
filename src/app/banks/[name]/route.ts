import { cacheLife } from "next/cache";
import { getEntitlement } from "@/lib/access/entitlement";
import { BANKS, BANK_NAMES, bankFor, type Banks } from "@/lib/content/banks";
import { getContent } from "@/lib/content/load";

/** The placement bank is public and built with the site; content only changes on deploy. */
export function generateStaticParams() {
  return BANK_NAMES.map((name) => ({ name }));
}

async function placementBank() {
  "use cache";
  cacheLife("max");
  return BANKS.placement(await getContent());
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/banks/[name]">,
) {
  const { name } = await params;
  if (!(BANK_NAMES as string[]).includes(name))
    return new Response("Not found", { status: 404 });
  if (name === "placement") return Response.json(await placementBank());
  // The mock exam and the flashcards depend on who asks, so they are never shared in a cache.
  const [content, tier] = await Promise.all([getContent(), getEntitlement()]);
  return Response.json(bankFor(name as keyof Banks, content, tier), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
