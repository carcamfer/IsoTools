import { Route, Routes } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from './api/client';
import { Sidebar } from './components/Sidebar';
import { ErrorState, Loading } from './components/primitives';
import { OverviewPage } from './pages/OverviewPage';
import { ToolsPage } from './pages/ToolsPage';
import { ToolDetailPage } from './pages/ToolDetailPage';
import { EventsPage } from './pages/EventsPage';
import { ChainPage } from './pages/ChainPage';
import { CatalogPage } from './pages/CatalogPage';
import { AuditReportPage } from './pages/AuditReportPage';
import { NotFoundPage } from './pages/NotFoundPage';

/**
 * El shell del orquestador.
 *
 * `bootstrap` trae plataforma, sesion y barra lateral en UNA peticion. Es
 * deliberado: encadenar cuatro llamadas al arrancar deja la pantalla vacia justo
 * cuando el usuario mide si la aplicacion es rapida.
 */
export function App() {
  const bootstrap = useQuery({
    queryKey: ['bootstrap'],
    queryFn: api.bootstrap,
    // La salud viaja dentro; se refresca sola para que los indicadores no envejezcan
    // con la pestana abierta.
    refetchInterval: 30_000,
  });

  if (bootstrap.isPending) {
    return (
      <div className="grid h-full place-items-center">
        <Loading label="Conectando con la plataforma" />
      </div>
    );
  }

  if (bootstrap.isError || !bootstrap.data) {
    return (
      <div className="grid h-full place-items-center p-6">
        <div className="max-w-md">
          <ErrorState
            title="No se pudo contactar al core de IsoTools"
            detail={bootstrap.error instanceof Error ? bootstrap.error.message : undefined}
          />
        </div>
      </div>
    );
  }

  const { agents, session, platform, counts } = bootstrap.data;

  return (
    <div className="fixed inset-0 flex">
      <Sidebar agents={agents} session={session} />
      <main className="min-w-0 flex-1 overflow-y-auto overscroll-contain">
        <Routes>
          <Route path="/" element={<OverviewPage agents={agents} counts={counts} platform={platform} />} />
          <Route path="/herramientas" element={<ToolsPage />} />
          <Route path="/herramientas/:toolId" element={<ToolDetailPage />} />
          <Route path="/eventos" element={<EventsPage />} />
          <Route path="/eventos/cadena/:correlationId" element={<ChainPage />} />
          <Route path="/catalogo" element={<CatalogPage />} />
          <Route path="/auditoria" element={<AuditReportPage session={session} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}
