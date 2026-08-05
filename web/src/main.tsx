import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from './api/client';
import { App } from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      refetchOnWindowFocus: true,
      // Un 401 ya provoco la redireccion al IdP y un 403 es una respuesta correcta
      // ("no tienes el rol"), no un fallo transitorio: reintentar cualquiera de los
      // dos solo genera ruido. Se reintenta el resto una vez, por si fue la red.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && [401, 403, 404].includes(error.status)) return false;
        return failureCount < 1;
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
