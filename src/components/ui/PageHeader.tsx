type PageHeaderProps = { title: string; lead?: string };

export function PageHeader({ title, lead }: PageHeaderProps) {
  return (
    <header className="mb-12 max-w-[68ch]">
      <h1 className="text-2xl font-extrabold text-balance sm:text-3xl">
        {title}
      </h1>
      {lead ? (
        <p className="mt-3 text-lg text-pretty text-ink-soft">{lead}</p>
      ) : null}
    </header>
  );
}
