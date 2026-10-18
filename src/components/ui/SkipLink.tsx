type SkipLinkProps = { label: string; targetId?: string };

export function SkipLink({ label, targetId = "main" }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-control focus:bg-foil focus:px-4 focus:py-3 focus:font-semibold focus:text-cover"
    >
      {label}
    </a>
  );
}
