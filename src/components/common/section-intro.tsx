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
    <section className="flex min-w-0 flex-col justify-between gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center">
      <div className="min-w-0 max-w-3xl">
        {eyebrow.toLowerCase() !== title.toLowerCase() && <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>}
        <h1 className="break-words text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-[28px]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="section-intro-actions flex w-full shrink-0 flex-wrap gap-2 sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">{action}</div> : null}
    </section>
  );
}
