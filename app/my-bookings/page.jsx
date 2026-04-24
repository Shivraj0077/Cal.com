'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/app/components/Sidebar';

export default function MyBookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBookings() {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            if (!token || !storedUser) return;

            const user = JSON.parse(storedUser);
            // In this prototype, we're assuming the booker's email is their username or we can fetch it.
            // Since our SignUp doesn't ask for email, we'll use a placeholder or assume username is email for now.
            // Ideally, we'd add an email field to the user table.
            const guestEmail = user.username.includes('@') ? user.username : `${user.username}@example.com`;

            try {
                const res = await fetch(`/api/bookings?guestEmail=${guestEmail}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setBookings(data.bookings || []);
            } catch (error) {
                console.error("Failed to fetch bookings", error);
            }
            setLoading(false);
        }
        fetchBookings();
    }, []);

    return (
        <div className="shell">
            <Sidebar />
            <main className="main">
                <div className="page-wrap">
                    <div className="page-topbar">
                        <div>
                            <div className="page-title">My Bookings</div>
                            <div className="page-desc">Meetings you have scheduled with others.</div>
                        </div>
                    </div>

                    <div className="card">
                        {loading ? (
                            <div className="empty"><div className="empty-desc">Loading your bookings...</div></div>
                        ) : bookings.length === 0 ? (
                            <div className="empty">
                                <div className="empty-title">No bookings found</div>
                                <div className="empty-desc">You haven't scheduled any meetings yet.</div>
                            </div>
                        ) : (
                            <div style={{ padding: '0 20px' }}>
                                {bookings.map((booking) => (
                                    <div key={booking.id} className="list-row" style={{ padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{booking.event_types?.title} with {booking.users?.username}</div>
                                            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                                                📅 {new Date(booking.date).toLocaleDateString()} at {booking.start_time_utc} UTC
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span className={`badge ${booking.status === 'confirmed' ? 'badge-success' : 'badge-gray'}`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
