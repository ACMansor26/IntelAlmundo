// app/login/page.tsx
import type { Metadata } from 'next';
import LoginForm from '@/components/LoginForm';
import TramaArcos from '@/components/TramaArcos';

export const metadata: Metadata = {
  title: 'Almundo | Acceso',
  robots: { index: false, follow: false }
};

export default function LoginPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <TramaArcos />
      <div className="relative z-10 w-full flex justify-center">
        <LoginForm />
      </div>
    </main>
  );
}
