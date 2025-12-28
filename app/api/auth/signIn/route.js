import { supabase } from '@/lib/supabaseClient';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(req) {
  const { username, password } = await req.json();

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = signToken(user);

  return Response.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      timezone: user.timezone
    },
    token
  });
}
