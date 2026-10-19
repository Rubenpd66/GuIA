import { cacheLife } from "next/cache";
import { BANKS, BANK_NAMES, type Banks } from "@/lib/content/banks";
import { getContent } from "@/lib/content/load";

/** Every bank is a static JSON file built with the site; content only changes on deploy. */
export function generateStaticParams() {
  return BANK_NAMES.map((name) => ({ name }));
}

async function bank(name: keyof Banks) {
  "use cache";
  cacheLife("max");
  return BANKS[name](await getContent());
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/banks/[name]">,
) {
  const { name } = await params;
  if (!(BANK_NAMES as string[]).includes(name))
    return new Response("Not found", { status: 404 });
  return Response.json(await bank(name as keyof Banks));
}
