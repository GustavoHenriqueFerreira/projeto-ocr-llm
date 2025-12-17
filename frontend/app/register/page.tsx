'use client';

import { useState } from 'react';
import { register } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validação básica
    if (!email || !password) {
      setError('Preencha todos os campos.');
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
      setMessage('Cadastro realizado com sucesso! Redirecionando...');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-20 space-y-4">
      <h1 className="text-2xl font-bold">Cadastro</h1>

      <input
        className="border p-2 w-full rounded"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        className="border p-2 w-full rounded"
        type="password"
        placeholder="Senha"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      {loading && <p className="text-blue-500">Cadastrando...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {message && <p className="text-green-500">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white p-2 w-full rounded"
      >
        {loading ? 'Aguarde...' : 'Criar conta'}
      </button>
    </form>
  );
}