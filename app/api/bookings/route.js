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
 * body: { hostId, eventTypeId, guestName, guestEmail, startTimeUTC, bookerTimezone }
 * 
 * startTimeUTC: ISO 8601 string (e.g., "2026-01-26T05:20:00.000Z")
 * bookerTimezone: IANA timezone string (e.g., "America/New_York") - stored for reference
 */
export async function POST(req) {
    try {
        const { hostId, eventTypeId, guestName, guestEmail, startTimeUTC, bookerTimezone } = await req.json();

        if (!hostId || !eventTypeId || !guestName || !guestEmail || !startTimeUTC) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Parse the UTC timestamp
        const bookingDateTime = new Date(startTimeUTC);
        if (isNaN(bookingDateTime.getTime())) {
            return NextResponse.json({ error: 'Invalid startTimeUTC format' }, { status: 400 });
        }

        // Extract date (YYYY-MM-DD) and time (HH:mm) in UTC for storage
        const date = bookingDateTime.toISOString().split('T')[0];
        const startTime = bookingDateTime.toISOString().split('T')[1].slice(0, 5);

        const { data: eventType, error: eventTypeError } = await supabase
            .from("event_types")
            .select("*")
            .eq("id", eventTypeId)
            .single();

        if (eventTypeError) {
            return NextResponse.json({ error: "Event type not found" }, { status: 500 });
        }

        const { duration, buffer_before_min, buffer_after_min, min_notice_mins } = eventType;

        // Minimum notice window check (comparing UTC times)
        const nowMs = Date.now();
        const bookingMs = bookingDateTime.getTime();
        const minNoticeMs = min_notice_mins * 60 * 1000;

        if (bookingMs - nowMs < minNoticeMs) {
            return NextResponse.json(
                { error: `Minimum ${min_notice_mins} minutes notice required` },
                { status: 400 });
        }

        const startMin = toMinutes(startTime);
        const endMin = startMin + Number(duration);
        const endTimeStr = toTime(endMin);

        // 1. Check for overlapping bookings
        const { data: existingBookings, error: fetchError } = await supabase
            .from('bookings')
            //this is for fetching all bookings for that date and that event's buffer cause buffers are store for events not for slots
            .select('*, event_types(buffer_before_min, buffer_after_min)')
            .eq('host_id', hostId)
            .eq('date', date)
            .eq('status', 'confirmed');

        if (fetchError) {
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        const newBookingStart = startMin - buffer_before_min;
        const newBookingEnd = endMin + buffer_after_min;

        for (const booking of existingBookings) {
            const existingBufferBefore = booking.event_types?.buffer_before_min || 0;
            const existingBufferAfter = booking.event_types?.buffer_after_min || 0;

            const existingStart = toMinutes(booking.start_time_utc) - existingBufferBefore;
            const existingEnd = toMinutes(booking.end_time_utc) + existingBufferAfter;

            if (newBookingStart < existingEnd && newBookingEnd > existingStart) {
                return NextResponse.json({
                    error: 'Slot conflicts with existing booking (including buffers)'
                }, { status: 409 });
            }
        }

        // 2. Insert booking
        const bookingId = randomUUID();
        const { data: newBooking, error: insertError } = await supabase
            .from('bookings')
            .insert({
                id: bookingId,
                host_id: hostId,
                event_type_id: eventTypeId,
                guest_name: guestName,
                guest_email: guestEmail,
                date: date,
                start_time_utc: startTime,
                end_time_utc: endTimeStr,
                booker_timezone: bookerTimezone || 'UTC',
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
    const guestEmail = searchParams.get('guestEmail');
    const date = searchParams.get('date');

    if (!hostId && !guestEmail) {
        return NextResponse.json({ error: 'hostId or guestEmail is required' }, { status: 400 });
    }

    let query = supabase
        .from('bookings')
        .select('*, event_types(title, duration, buffer_before_min, buffer_after_min), users:host_id(username, timezone)');

    if (hostId) {
        query = query.eq('host_id', hostId);
    }
    
    if (guestEmail) {
        query = query.eq('guest_email', guestEmail);
    }

    if (date) {
        query = query.eq('date', date);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookings: data });
}

