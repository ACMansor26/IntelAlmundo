// components/LoginForm.tsx
'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { loginAction } from '@/app/actions/auth';

export default function LoginForm() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await loginAction(usuario, password);
      if (res.success) {
        router.replace('/');
        router.refresh();
      } else {
        setError(res.error || 'Credenciales inválidas.');
      }
    } catch {
      setError('Ocurrió un error de conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  const claseInput =
    'w-full bg-[color:var(--sunk)] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-[color:var(--acc)] transition placeholder:text-slate-500';

  return (
    <div className="w-full max-w-sm bg-[color:var(--surf)] border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/80 space-y-5">
      <div className="text-center space-y-1.5">
        <Image src="/almundo-logo-blanco.png" alt="Almundo" width={775} height={175} priority className="mx-auto mb-3 h-9 w-auto" />
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[color:var(--acc)]/15 text-[color:var(--acc2)] border border-[color:var(--acc)]/40 tracking-wider uppercase">
          Acceso Protegido
        </span>
        <h1 className="text-xl font-bold text-white tracking-tight">Almundo Intelligence</h1>
        <p className="text-xs text-slate-400">Ingresá tus credenciales para ver el panel</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div role="alert" className="bg-rose-950/70 border border-rose-800 text-rose-300 text-xs p-2.5 rounded-lg flex items-center gap-2">
            <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="usuario" className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            Usuario
          </label>
          <input
            id="usuario"
            type="text"
            required
            autoFocus
            autoComplete="username"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className={claseInput}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={claseInput}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[color:var(--acc)] hover:bg-[color:var(--acc2)] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-xs transition duration-150 shadow-lg shadow-[color:var(--acc)]/25 mt-2 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Validando...</span>
            </>
          ) : (
            'Ingresar'
          )}
        </button>
      </form>

      <p className="text-[10px] text-slate-400 text-center">
        Panel confidencial · Performance Marketing & Growth
      </p>
    </div>
  );
}
