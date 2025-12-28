import { supabase } from '@/lib/supabaseClient';
import { hash_password, signToken } from '@/lib/auth';
import { randomUUID } from 'crypto';

export async function POST(req) {
  const body = await req.json();
  const { username, password, role, timezone } = body;

  if (!username || !password || !role || !timezone) {
    return Response.json({ error: 'Missing fields' }, { status: 400 });
  }

  const password_hash = await hash_password(password);

  const { data, error } = await supabase
    .from('users')
    .insert({
      id: randomUUID(),
      username,
      password_hash,
      role,
      timezone
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  const token = signToken(data);

  return Response.json({
    user: {
      id: data.id,
      username: data.username,
      role: data.role,
      timezone: data.timezone
    },
    token
  });
}
