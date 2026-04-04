'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (action: 'login' | 'signup') => {
    setLoading(true);
    setError(null);

    const authOpts = { email, password };
    const { error: authError } = 
      action === 'login' 
        ? await supabase.auth.signInWithPassword(authOpts)
        : await supabase.auth.signUp(authOpts);

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push('/upload');
      router.refresh(); // Refresh middleware/server components
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-base p-4">
      <div className="w-full max-w-sm rounded-xl border border-border-muted bg-surface-base p-6 shadow-sm">
        <h1 className="mb-6 text-xl font-medium text-text-primary">
          Acesso Temporário (Dev)
        </h1>
        
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-text-secondary">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border-muted bg-bg-base px-3 py-2 text-text-primary focus:border-brand-primary focus:outline-none"
              placeholder="teste@contabiliz.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-text-secondary">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border-muted bg-bg-base px-3 py-2 text-text-primary focus:border-brand-primary focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleAuth('login')}
              disabled={loading}
              className="flex-1 rounded-lg bg-brand-primary py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Entrar
            </button>
            <button
              onClick={() => handleAuth('signup')}
              disabled={loading}
              className="flex-1 rounded-lg border border-border-muted bg-surface-base py-2 text-sm font-medium text-text-primary transition-colors hover:bg-bg-hover disabled:opacity-50"
            >
              Criar Conta
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
