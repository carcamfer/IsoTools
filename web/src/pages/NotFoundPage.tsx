import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';

export function NotFoundPage() {
  return (
    <>
      <PageHeader eyebrow="404" title="Esa pantalla no existe" />
      <div className="p-6">
        <p className="text-2xs text-muted">
          Revisa el enlace, o vuelve al{' '}
          <Link to="/" className="text-brass hover:underline">
            resumen
          </Link>
          .
        </p>
      </div>
    </>
  );
}
