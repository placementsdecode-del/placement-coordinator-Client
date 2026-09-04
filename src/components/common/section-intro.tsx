import type { ReactNode } from "react";

export function SectionIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col justify-between gap-4 lg:flex-row lg:items-start">
      <div className="min-w-0 max-w-3xl">
        <p className="text-sm font-semibold text-primary">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold leading-8 text-foreground md:text-[28px] md:leading-9">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="flex w-full shrink-0 sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">{action}</div> : null}
    </section>
  );
}
