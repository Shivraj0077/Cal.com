import { supabase } from '@/lib/supabaseClient';
import { verifyToken } from '@/lib/auth';
import { validateRule, normalizeRule } from '@/lib/availability';
import { randomUUID } from 'crypto';

export async function POST(req) {
  const user = verifyToken(req);
  if (user.role !== 'HOST') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { rules, timezone } = body;

  const normalizedRules = rules.flatMap(rule => {
    validateRule(rule);
    return normalizeRule({
      ...rule,
      timezone,
      buffer_before_min: rule.bufferBeforeMin || 0,
      buffer_after_min: rule.bufferAfterMin || 0
    });
  });

  for (const r of normalizedRules) {
    await supabase.from('availability_rules').insert({
      id: randomUUID(),
      host_id: user.userId,
      day_of_week: r.dayOfWeek,
      start_time: r.startTime,
      end_time: r.endTime,
      timezone: r.timezone,
      buffer_before_min: r.buffer_before_min,
      buffer_after_min: r.buffer_after_min
    });
  }

  return Response.json({ success: true });
}

export async function GET(req) {
  const user = verifyToken(req);
  if (user.role !== 'HOST') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data } = await supabase
    .from('availability_rules')
    .select('*')
    .eq('host_id', user.userId)
    .order('day_of_week')
    .order('start_time');

  return Response.json(data);
}



