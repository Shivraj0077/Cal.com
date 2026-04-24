'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';

export default function Dashboard() {
    const router = useRouter();
    const [role, setRole] = useState(() => {
        if (typeof window === 'undefined') return 'HOST';
        const user = localStorage.getItem('user');
        if (user) {
            try { return JSON.parse(user).role; } catch (e) {}
        }
        return 'HOST';
    });

    const hostCards = [
        { icon: '⊞', title: 'Event types', desc: 'Create meeting types for people to book.', href: '/event-types' },
        { icon: '⏰', title: 'Availability', desc: 'Set your weekly working hours.', href: '/availability' },
    ];

    const bookerCards = [
        { icon: '🗓', title: 'My Bookings', desc: 'View and manage your scheduled meetings.', href: '/my-bookings' },
        { icon: '🔍', title: 'Find a Host', desc: 'Book a new session with a team member.', href: '/' },
    ];

    const cards = role === 'HOST' ? hostCards : bookerCards;

    return (
        <div className="shell">
            <Sidebar />
            <main className="main">
                <div className="page-wrap">
                    <div className="page-topbar">
                        <div>
                            <div className="page-title">Dashboard</div>
                            <div className="page-desc">Your {role.toLowerCase()} overview</div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {cards.map(c => (
                            <div key={c.title} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => router.push(c.href)}>
                                <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>{c.icon}</div>
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>{c.title}</div>
                                <div style={{ fontSize: 13, color: '#6b7280' }}>{c.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}