import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/* utils */
const toMinutes = t => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
};

const toTime = m =>
    `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/**
 * GET /api/availability/slots?date=YYYY-MM-DD&duration=30&hostId=...
 */
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const duration = Number(searchParams.get('duration'));
    const hostId = searchParams.get('hostId');

    if (!date || !duration || !hostId) {
        return NextResponse.json({ error: 'date, duration & hostId required' }, { status: 400 });
    }

    const weekday = new Date(date).getDay();

    // 1. Fetch Rules, Overrides, and Bookings
    const [rulesRes, overridesRes, bookingsRes] = await Promise.all([
        supabase.from('availability_rules').select('*').eq('host_id', hostId).eq('day_of_week', weekday),
        supabase.from('date_overrides').select('*').eq('host_id', hostId).eq('date', date),
        supabase.from('bookings').select('*').eq('host_id', hostId).eq('date', date).eq('status', 'confirmed')
    ]);

    if (rulesRes.error) return NextResponse.json({ error: rulesRes.error.message }, { status: 500 });
    if (overridesRes.error) return NextResponse.json({ error: overridesRes.error.message }, { status: 500 });
    if (bookingsRes.error) return NextResponse.json({ error: bookingsRes.error.message }, { status: 500 });

    const rules = rulesRes.data;
    const overrides = overridesRes.data;
    const bookings = bookingsRes.data;

    let windows = [];

    // 2. Determine base windows
    if (overrides.length > 0) {
        // Overrides take precedence
        const availableOverride = overrides.filter(o => o.is_available);
        if (availableOverride.length === 0) {
            return NextResponse.json({ date, slots: [] });
        }
        windows = availableOverride.map(o => ({
            start: toMinutes(o.start_time),
            end: toMinutes(o.end_time)
        }));
    } else {
        windows = rules.map(r => ({
            start: toMinutes(r.start_time),
            end: toMinutes(r.end_time)
        }));
    }

    // 3. Subtract bookings from windows
    // This is a simple subtraction logic: for each window, remove segments that overlap with bookings
    let availableSegments = [...windows];

    for (const booking of bookings) {
        const bStart = toMinutes(booking.start_time);
        const bEnd = toMinutes(booking.end_time);

        const nextSegments = [];
        for (const segment of availableSegments) {
            // No overlap
            if (bEnd <= segment.start || bStart >= segment.end) {
                nextSegments.push(segment);
            } else {
                // Overlap - split segment
                if (bStart > segment.start) {
                    nextSegments.push({ start: segment.start, end: bStart });
                }
                if (bEnd < segment.end) {
                    nextSegments.push({ start: bEnd, end: segment.end });
                }
            }
        }
        availableSegments = nextSegments;
    }

    // 4. Generate slots from available segments
    const slots = [];
    for (const segment of availableSegments) {
        let cursor = segment.start;
        while (cursor + duration <= segment.end) {
            slots.push({
                start: toTime(cursor),
                end: toTime(cursor + duration)
            });
            cursor += duration; // Or cursor += some interval if you want overlapping slots
        }
    }

    return NextResponse.json({ date, slots });
}
