'use client';

import { useState } from 'react';
import { login } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { access_token } = await login(email, password);
      localStorage.setItem('token', access_token);
      setSuccess('Login realizado com sucesso!');
      // Pequena espera para mostrar a mensagem de sucesso antes de redirecionar
      setTimeout(() => {
        router.push('/');
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1 className="text-2xl font-bold">Login</h1>

        <input
          className="border p-2 w-full"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          className="border p-2 w-full"
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {loading && <p className="text-blue-500">Carregando...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}

        <button
          type="submit"
          className="bg-black text-white p-2 w-full"
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="text-center">
        Não tem uma conta?{' '}
        <Link href="/register" className="text-blue-500 underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}