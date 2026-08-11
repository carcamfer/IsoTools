import type { ReactNode } from 'react';

/**
 * Cabecera de pantalla. Misma altura y mismo ritmo en TODAS las paginas, aqui y
 * en el dashboard.
 *
 * La razon de que exista como componente y no como un `<h1>` suelto: en cuanto
 * cada pantalla escribe su propia cabecera, cada una elige su tamaño y su
 * espaciado, y el titulo salta de sitio al navegar entre pestañas. Ese salto se
 * nota mucho mas de lo que parece.
 *
 *   <PageHeader
 *     eyebrow="8.7 · salidas no conformes"
 *     title="Registro de no conformidades"
 *     description="Todo hallazgo abierto, su disposicion y su verificacion."
 *     actions={<Button variant="primary">Registrar</Button>}
 *   />
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  /** Contexto corto sobre el titulo: clausula ISO, area, filtro activo. */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Acciones primarias de la pantalla. A la derecha, alineadas con el titulo. */
  actions?: ReactNode;
}) {
  return (
    <header className="flex items-start gap-4 border-b border-border pb-4">
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
