// components/AuthModal.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginModalAction } from '@/app/actions/auth';

interface Props {
  isAuthenticated: boolean;
}

export default function AuthModal({ isAuthenticated }: Props) {
  const [isOpen, setIsOpen] = useState(!isAuthenticated);
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await loginModalAction(usuario, password);
      if (res.success) {
        setIsOpen(false);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#111C30] border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-black/80 space-y-5">
        
        {/* Encabezado del Popup */}
        <div className="text-center space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF5A00]/15 text-[#FF7A29] border border-[#FF5A00]/40 tracking-wider uppercase">
            Acceso Protegido
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Almundo Intelligence
          </h2>
          <p className="text-xs text-slate-400">
            Ingresa tus credenciales para desbloquear el panel
          </p>
        </div>

        {/* Formulario de Validación */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="bg-rose-950/70 border border-rose-800 text-rose-300 text-xs p-2.5 rounded-lg flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Usuario
            </label>
            <input
              type="text"
              required
              autoFocus
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="almundo"
              className="w-full bg-[#0B1120] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A00] focus:ring-1 focus:ring-[#FF5A00] transition placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#0B1120] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A00] focus:ring-1 focus:ring-[#FF5A00] transition placeholder:text-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FF5A00] hover:bg-[#FF7A29] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-xs transition duration-150 shadow-lg shadow-[#FF5A00]/25 mt-2 flex items-center justify-center gap-2"
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

        <p className="text-[10px] text-slate-500 text-center">
          Panel confidencial · Performance Marketing & Growth
        </p>

      </div>
    </div>
  );
}