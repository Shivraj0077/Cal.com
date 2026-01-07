'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('HOST');
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  //new browsers :: Intl.DateTimeFormat().resolvedOptions().timeZone();
  //older browesers :: new Date().getTimezoneOffset();
  const [error, setError] = useState('');

  async function handleSignup(e) {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/signUp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        role,
        timezone
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Signup failed');
      return;
    }

    localStorage.setItem('token', data.token);
    router.push('/'); // redirect after signup

    if (res.ok) {
      router.push("/signIn");
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <h2>Signup</h2>

      <form onSubmit={handleSignup}>
        <input
          placeholder="Email"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="HOST">Host</option>
          <option value="BOOKER">Booker</option>
        </select>

        <input value={timezone} disabled />

        <button type="submit">Create Account</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}



