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

  const { data: existingUser, error: selectError } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (existingUser) {
    return Response.json({ error: "Username already exists" }, { status: 400 });
  }
  if (selectError && selectError.code !== 'PGRST116') { 
    return Response.json({ error: selectError.message }, { status: 400 });
  }

  const { data: newUser, error: insertError } = await supabase
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

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 400 });
  }

  const token = signToken(newUser);

  return Response.json({
    user: {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      timezone: newUser.timezone
    },
    token
  });
}
