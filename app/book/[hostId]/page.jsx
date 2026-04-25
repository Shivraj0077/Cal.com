'use client';
import { useEffect, useState, use } from 'react';
import { getAllTimezones } from '@/lib/timezone';

function fmt(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function BookingPage({ params }) {
    const { hostId } = use(params);
    const [eventTypes, setEventTypes] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    const [date, setDate] = useState('');
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [timezone, setTimezone] = useState('UTC');
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [bookingStatus, setBookingStatus] = useState(null);
    const [bookingError, setBookingError] = useState('');

    useEffect(() => { setMounted(true); }, []);
    const detectedTz = mounted ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
    const allTimezones = mounted ? getAllTimezones() : ['UTC'];
    
    useEffect(() => { 
        if (mounted && timezone === 'UTC') setTimezone(detectedTz); 
        
        // Auto-fill guest info if logged in
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const u = JSON.parse(storedUser);
                setGuestName(u.username);
                setGuestEmail(u.username.includes('@') ? u.username : u.username + '@example.com');
            } catch (e) {}
        }
    }, [mounted, detectedTz, timezone]);

    useEffect(() => {
        fetch(`/api/event-types?hostId=${hostId}`).then(r => r.json()).then(d => setEventTypes(Array.isArray(d) ? d : []));
    }, [hostId]);

    async function fetchSlots(selDate, typeId, tz) {
        if (!selDate || !typeId) return;
        setLoading(true); setSelectedSlot(null);
        const data = await fetch(`/api/availability/slots?hostId=${hostId}&date=${selDate}&eventTypeId=${typeId}&timezone=${tz || timezone}`).then(r => r.json());
        setSlots(data.slots || []); setLoading(false);
    }

    async function handleBooking(e) {
        e.preventDefault();
        setBookingStatus('loading'); setBookingError('');
        const res = await fetch('/api/bookings', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hostId, eventTypeId: selectedType.id, guestName, guestEmail, startTimeUTC: selectedSlot.start_utc, bookerTimezone: timezone }),
        });
        const data = await res.json();
        if (!res.ok) { setBookingStatus('error'); setBookingError(data.error || 'Booking failed'); return; }
        setBookingStatus('success');
    }

    function reset() { setSelectedSlot(null); setGuestName(''); setGuestEmail(''); setBookingStatus(null); setBookingError(''); setSelectedType(null); setSlots([]); setDate(''); }

    if (bookingStatus === 'success') return (
        <div className="booking-page">
            <div className="card-outer" style={{ textAlign: 'center', padding: '60px 40px' }}>
                <div style={{ fontWeight: 800, fontSize: 46, letterSpacing: '-0.04em', marginBottom: 12 }}>Booking Confirmed</div>
                <p style={{ color: '#6e6e73', marginBottom: 32 }}>We&apos;ve sent an invitation to your email address.</p>
                <div style={{ borderTop: '1px solid #eaecef', paddingTop: 24, display: 'inline-block', textAlign: 'left' }}>
                    <p style={{ color: '#6b7280', marginBottom: 4 }}><strong style={{ color: '#111' }}>{selectedType?.title}</strong></p>
                    <p style={{ color: '#9ca3af', fontSize: 18.7, marginBottom: 4 }}>{date} · {fmt(selectedSlot?.start)} · {timezone}</p>
                    <p style={{ color: '#9ca3af', fontSize: 18.7, marginBottom: 24 }}>Confirmation sent to {guestEmail}</p>
                </div>
                <button className="btn btn-secondary" onClick={reset}>Book another</button>
            </div>
        </div>
    );

    return (
        <div className="booking-page">
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
                <span style={{ fontWeight: 700, fontSize: '1.44rem' }}>BookWise</span>
            </div>

            <div style={{ width: '100%', maxWidth: 520 }}>
                {/* STEP 1 — Pick event type */}
                {!selectedType && (
                    <div>
                        <h1 style={{ fontWeight: 700, fontSize: '1.58rem', marginBottom: 4 }}>Choose a meeting type</h1>
                        <p style={{ fontSize: 18.7, color: '#6b7280', marginBottom: 20 }}>Select the type of meeting you&apos;d like to book.</p>
                        {eventTypes.length === 0 && <div className="card"><div className="empty"><div className="empty-desc">This host hasn&apos;t set up any event types yet.</div></div></div>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {eventTypes.map(type => (
                                <div key={type.id} className="card list-row" style={{ cursor: 'pointer' }} onClick={() => setSelectedType(type)}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 4 }}>{type.title}</div>
                                        {type.description && <div style={{ fontSize: 17.3, color: '#6b7280', marginBottom: 6 }}>{type.description}</div>}
                                        <span className="badge badge-gray">{type.duration}m</span>
                                    </div>
                                    <span style={{ color: '#9ca3af', fontSize: 21.6 }}>&gt;</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2 — Pick date + slot */}
                {selectedType && !selectedSlot && (
                    <div>
                        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16, paddingLeft: 0 }} onClick={() => { setSelectedType(null); setSlots([]); setDate(''); }}>
                            Back
                        </button>
                        <h1 style={{ fontWeight: 700, fontSize: '1.32rem', marginBottom: 2 }}>{selectedType.title}</h1>
                        <p style={{ fontSize: 15.6, color: '#6b7280', marginBottom: 20 }}>{selectedType.duration} min · Select a date and time</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                            <div>
                                <label className="label">Date</label>
                                <input type="date" className="input input-full" value={date} min={new Date().toISOString().split('T')[0]}
                                    onChange={e => { setDate(e.target.value); fetchSlots(e.target.value, selectedType.id); }} />
                            </div>
                            <div>
                                <label className="label">Timezone</label>
                                <select className="input input-full" value={timezone} onChange={e => { setTimezone(e.target.value); fetchSlots(date, selectedType.id, e.target.value); }} disabled={!mounted}>
                                    {allTimezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="card" style={{ padding: 20 }}>
                            <div style={{ fontWeight: 600, fontSize: 15.6, marginBottom: 12 }}>Available times</div>
                            {!date && <p style={{ fontSize: 15.6, color: '#9ca3af' }}>Select a date to see available slots.</p>}
                            {date && loading && <p style={{ fontSize: 15.6, color: '#9ca3af' }}>Loading slots…</p>}
                            {date && !loading && slots.length === 0 && <p style={{ fontSize: 15.6, color: '#9ca3af' }}>No slots available on this day.</p>}
                            {!loading && slots.length > 0 && (
                                <div className="slot-grid">
                                    {slots.map((slot, i) => (
                                        <button key={i} className="slot-btn" onClick={() => setSelectedSlot(slot)}>{fmt(slot.start)} - {fmt(slot.end)}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 3 — Fill details */}
                {selectedType && selectedSlot && bookingStatus !== 'success' && (
                    <div>
                        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16, paddingLeft: 0 }} onClick={() => { setSelectedSlot(null); setBookingError(''); setBookingStatus(null); }}>
                            Change time
                        </button>
                        <h1 style={{ fontWeight: 700, fontSize: '1.32rem', marginBottom: 16 }}>Your details</h1>

                        {/* Summary */}
                        <div className="card" style={{ padding: 16, marginBottom: 20, background: '#f9fafb' }}>
                            <div style={{ fontWeight: 600, fontSize: 15.6, marginBottom: 4 }}>{selectedType.title}</div>
                            <div style={{ fontSize: 15.6, color: '#6b7280' }}>Date: {date} · Time: {fmt(selectedSlot.start)} – {fmt(selectedSlot.end)}</div>
                            <div style={{ fontSize: 14.4, color: '#9ca3af', marginTop: 2 }}>Timezone: {timezone}</div>
                        </div>

                        {bookingError && <div className="alert-error">{bookingError}</div>}

                        <form onSubmit={handleBooking}>
                            <div className="field">
                                <label className="label">Your name *</label>
                                <input className="input input-full" placeholder="Alex Johnson" value={guestName} onChange={e => setGuestName(e.target.value)} required autoFocus />
                            </div>
                            <div className="field">
                                <label className="label">Your email *</label>
                                <input className="input input-full" type="email" placeholder="alex@example.com" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} required />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }} disabled={bookingStatus === 'loading'}>
                                {bookingStatus === 'loading' ? 'Confirming…' : 'Confirm booking'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}