import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore.js';

export function AuthPage({ mode }) {
  const navigate = useNavigate();
  const isRegister = mode === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (isRegister) {
        await register({ ...form, role: 'Employee' });
      } else {
        await login({ email: form.email, password: form.password });
      }
      toast.success(`Welcome to NxtBiz`);
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 text-ink">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-mint">NxtBiz</p>
        <h1 className="mt-2 text-2xl font-semibold">{isRegister ? 'Create operator account' : 'Sign in to operations'}</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {isRegister ? (
            <label className="block text-sm font-medium">
              Name
              <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
          ) : null}
          <label className="block text-sm font-medium">
            Email
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          </label>
          <button className="w-full rounded-md bg-ink px-4 py-2 font-semibold text-white disabled:opacity-60" disabled={submitting}>
            {submitting ? 'Working...' : isRegister ? 'Register' : 'Login'}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          {isRegister ? 'Already have access?' : 'Need an account?'}{' '}
          <Link className="font-semibold text-ink" to={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Login' : 'Register'}
          </Link>
        </p>
      </section>
    </main>
  );
}
