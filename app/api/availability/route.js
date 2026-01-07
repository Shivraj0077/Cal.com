import { supabase } from '@/lib/supabaseClient';
import { verifyToken } from '@/lib/auth';
import { validateRule, normalizeRule } from '@/lib/availability';
import { randomUUID } from 'crypto';
import { validateNoOverlap } from '@/lib/validateNoOverlap';

export async function POST(req) {
  try {
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

    validateNoOverlap(
      normalizedRules.map(r => ({
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
      }))
    );

    for (const r of normalizedRules) {
      // before inserting rules for a day
      const { error: deleteError } = await supabase
        .from('availability_rules')
        .delete()
        .eq('host_id', user.userId)
        .eq('day_of_week', r.dayOfWeek);

      if (deleteError) {
        console.error('Supabase delete error:', deleteError);
        return Response.json({ error: deleteError.message }, { status: 500 });
      }

      const { error: insertError } = await supabase.from('availability_rules').insert({
        id: randomUUID(),
        host_id: user.userId,
        day_of_week: r.dayOfWeek,
        start_time: r.startTime,
        end_time: r.endTime,
        timezone: r.timezone,
        buffer_before_min: r.buffer_before_min,
        buffer_after_min: r.buffer_after_min
      });

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        return Response.json({ error: insertError.message }, { status: 500 });
      }
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('POST /api/availability error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const user = verifyToken(req);
    if (user.role !== 'HOST') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('availability_rules')
      .select('*')
      .eq('host_id', user.userId)
      .order('day_of_week')
      .order('start_time');

    if (error) {
      console.error('Supabase error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (err) {
    console.error('GET /api/availability error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}



