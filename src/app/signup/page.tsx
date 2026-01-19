'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push('/login');
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-[80vh] w-full p-4">
      <div className="w-full max-w-[400px] bg-card-bg backdrop-blur-xl border border-glass-border p-10 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-5 duration-500">
        <div className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400 mb-2 text-center">Gerne</div>
        <h2 className="text-2xl font-bold mb-8 text-center text-slate-200">Create Account</h2>
        
        {error && (
          <div className="text-rose-500 text-sm font-medium text-center mb-6 bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400 ml-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-900/50 border border-glass-border rounded-xl text-white transition-all focus:outline-none focus:border-secondary focus:bg-slate-900/70 focus:ring-4 focus:ring-secondary/10"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-900/50 border border-glass-border rounded-xl text-white transition-all focus:outline-none focus:border-secondary focus:bg-slate-900/70 focus:ring-4 focus:ring-secondary/10"
            />
          </div>
          <button 
            type="submit" 
            className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all outline-none shadow-lg shadow-primary/20 hover:shadow-primary/30 mt-2"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>
        <div className="mt-8 text-center text-sm text-slate-400">
          Already have an account? <Link href="/login" className="text-primary hover:text-primary-hover font-semibold transition-colors">Login</Link>
        </div>
      </div>
    </main>
  );
}
