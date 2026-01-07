'use client';

import { useEffect, useState, use } from 'react';

export default function BookingPage({ params }) {
    const { hostId } = use(params);
    const [date, setDate] = useState('');
    const [slots, setSlots] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);

    const DURATION = 30; // static 30 mins

    // Fetch slots when date changes
    async function fetchSlots(selectedDate) {
        setLoading(true);
        setError('');
        setSlots([]);
        setSelectedSlot(null);

        const res = await fetch(
            `/api/availability/slots?hostId=${hostId}&date=${selectedDate}&duration=${DURATION}`
        );
        const data = await res.json();

        if (!res.ok) {
            setError(data.error || 'Failed to fetch availability');
            setLoading(false);
            return;
        }

        if (!data.slots || data.slots.length === 0) {
            setError('No availability for selected date');
        } else {
            setSlots(data.slots);
        }

        setLoading(false);
    }

    async function bookSlot() {
        if (!selectedSlot) return;

        const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                hostId,
                guestName: 'Test User',
                guestEmail: 'test@example.com',
                date,
                startTime: selectedSlot.start,
                duration: DURATION
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || 'Booking failed');
            return;
        }

        alert('Booking confirmed');
        setSlots([]);
        setSelectedSlot(null);
    }

    return (
        <div style={{ padding: 24 }}>
            <h2>Book a Meeting</h2>

            {/* Calendar */}
            <input
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => {
                    setDate(e.target.value);
                    fetchSlots(e.target.value);
                }}
            />

            {loading && <p>Loading availability...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {/* Slots */}
            <div style={{ marginTop: 16 }}>
                {slots.map((slot, i) => (
                    <button
                        key={i}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                            margin: 4,
                            padding: 8,
                            border:
                                selectedSlot?.start === slot.start
                                    ? '2px solid black'
                                    : '1px solid gray'
                        }}
                    >
                        {slot.start} – {slot.end}
                    </button>
                ))}
            </div>

            {selectedSlot && (
                <div style={{ marginTop: 16 }}>
                    <p>
                        Selected: {selectedSlot.start} – {selectedSlot.end}
                    </p>
                    <button onClick={bookSlot}>Confirm Booking</button>
                </div>
            )}
        </div>
    );
}
