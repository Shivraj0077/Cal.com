import { supabase } from '@/lib/supabaseClient';
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = verifyToken(req);
    if (user.role !== 'HOST') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: weekly, error: weeklyError } = await supabase
      .from('availability_rules')
      .select('*')
      .eq('host_id', user.userId)
      .order('day_of_week')
      .order('start_time');

    if (weeklyError) {
      console.error('Supabase weekly error:', weeklyError);
      return Response.json({ error: weeklyError.message }, { status: 500 });
    }

    const { data: overrides, error: overridesError } = await supabase
      .from('date_overrides')
      .select('*')
      .eq('host_id', user.userId)
      .order('date')
      .order('start_time');

    if (overridesError) {
      console.error('Supabase overrides error:', overridesError);
      return Response.json({ error: overridesError.message }, { status: 500 });
    }

    return Response.json({
      weekly,
      overrides
    });
  } catch (err) {
    console.error('GET /api/availability/schedule error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
