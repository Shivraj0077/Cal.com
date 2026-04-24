'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await fetch('/api/auth/signIn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Login failed'); return; }
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user)); // Store user info for role checks
    
    if (data.user.role === 'HOST') {
      router.push('/event-types');
    } else {
      router.push('/dashboard');
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-icon">📅</div>
          <span className="auth-logo-text">BookWise</span>
        </div>

        <div className="auth-card">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your BookWise account</p>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="field">
              <label className="label">Username</label>
              <input className="input input-full" placeholder="your_username" value={username}
                onChange={e => setUsername(e.target.value)} required autoFocus />
            </div>
            <div className="field">
              <label className="label">Password</label>
              <input className="input input-full" type="password" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          Don't have an account?{' '}
          <button onClick={() => router.push('/signUp')}>Create one</button>
        </div>
      </div>
    </div>
  );
}
