// app/login/page.tsx
import type { Metadata } from 'next';
import LoginForm from '@/components/LoginForm';

export const metadata: Metadata = {
  title: 'Almundo | Acceso',
  robots: { index: false, follow: false }
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <LoginForm />
    </main>
  );
}
