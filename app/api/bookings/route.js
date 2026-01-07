import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { randomUUID } from 'crypto';

const toMinutes = t => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
};

const toTime = m =>
    `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/**
 * POST /api/bookings
 * body: { hostId, guestName, guestEmail, date, startTime, duration }
 */
export async function POST(req) {
    try {
        const { hostId, guestName, guestEmail, date, startTime, duration } = await req.json();

        if (!hostId || !guestName || !guestEmail || !date || !startTime || !duration) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const startMin = toMinutes(startTime);
        const endMin = startMin + Number(duration);
        const endTimeStr = toTime(endMin);

        // 1. Check for overlapping bookings
        const { data: existingBookings, error: fetchError } = await supabase
            .from('bookings')
            .select('*')
            .eq('host_id', hostId)
            .eq('date', date)
            .eq('status', 'confirmed');

        if (fetchError) {
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        const hasOverlap = existingBookings.some(b => {
            const bStart = toMinutes(b.start_time);
            const bEnd = toMinutes(b.end_time);
            return (startMin < bEnd && endMin > bStart);
        });

        if (hasOverlap) {
            return NextResponse.json({ error: 'Slot already booked' }, { status: 409 });
        }

        // 2. Insert booking
        const bookingId = randomUUID();
        const { data: newBooking, error: insertError } = await supabase
            .from('bookings')
            .insert({
                id: bookingId,
                host_id: hostId,
                guest_name: guestName,
                guest_email: guestEmail,
                date: date,
                start_time: startTime,
                end_time: endTimeStr,
                duration: Number(duration),
                status: 'confirmed'
            })
            .select()
            .single();

        if (insertError) {
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        return NextResponse.json({ booking: newBooking }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * GET /api/bookings?hostId=...&date=...
 */
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const hostId = searchParams.get('hostId');
    const date = searchParams.get('date');

    if (!hostId) {
        return NextResponse.json({ error: 'hostId is required' }, { status: 400 });
    }

    let query = supabase
        .from('bookings')
        .select('*')
        .eq('host_id', hostId);

    if (date) {
        query = query.eq('date', date);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookings: data });
}


/*
[
  {
    "id": "97d32eb7-6273-4d4e-9db4-a100433c6d13"
  },
  {
    "id": "05c5801e-f2f0-4835-8b8f-1e095a27b188"
  },
  {
    "id": "39f11695-f1ab-4fff-a584-e037112235b4"
  },
  {
    "id": "ed4c6aeb-a7e9-4096-bc30-8081d688f4ee"
  },
  {
    "id": "c343431a-b056-4114-8b33-59d394913917"
  }
]
*/
