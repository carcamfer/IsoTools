import type { ReactNode } from 'react';

/** Cabecera de pantalla. Misma altura y ritmo en todas las paginas. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex items-start gap-4 border-b border-border bg-surface px-6 py-4">
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="font-mono text-2xs uppercase tracking-wide text-faint">{eyebrow}</p>
        )}
        <h1 className="truncate text-lg font-medium leading-tight text-text">{title}</h1>
        {description && <p className="mt-0.5 text-2xs text-muted">{description}</p>}
      </div>
      {actions}
    </header>
  );
}
