'use client';

// Estado de carga global: al hacer click en un link interno marca <html data-cargando>
// (barra de progreso arriba + las zonas con clase "zona-carga" se atenuan) hasta que
// cambia la URL. Mantiene el contenido anterior visible en vez de dejar la pantalla
// quieta sin señal de que algo esta pasando.
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const ATRIBUTO = 'data-cargando';
const MAX_MS = 15000; // red de seguridad: nunca dejar la pantalla atenuada

export default function ProgresoNavegacion() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    document.documentElement.removeAttribute(ATRIBUTO);
  }, [pathname, searchParams]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const alClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.href === window.location.href) return;
      document.documentElement.setAttribute(ATRIBUTO, '');
      clearTimeout(timer);
      timer = setTimeout(() => document.documentElement.removeAttribute(ATRIBUTO), MAX_MS);
    };
    document.addEventListener('click', alClick);
    return () => {
      document.removeEventListener('click', alClick);
      clearTimeout(timer);
    };
  }, []);

  return null;
}
