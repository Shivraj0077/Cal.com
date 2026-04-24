'use client';
import React, { useEffect, useState } from 'react';
import Sidebar from '@/app/components/Sidebar';

const DAYS = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
];

export default function AvailabilityPage() {
    const [schedule, setSchedule] = useState(() =>
        DAYS.map(d => ({
            ...d,
            enabled: [1, 2, 3, 4, 5].includes(d.value),
            startTime: '09:00',
            endTime: '17:00',
        }))
    );
    const [timezone, setTimezone] = useState(() => (typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC'));
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        fetch('/api/availability/rules', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(rules => {
                if (!Array.isArray(rules) || rules.length === 0) return;
                setSchedule(DAYS.map(d => {
                    const rule = rules.find(r => r.day_of_week === d.value);
                    return {
                        ...d,
                        enabled: !!rule,
                        startTime: rule?.start_time_utc?.slice(0, 5) || '09:00',
                        endTime: rule?.end_time_utc?.slice(0, 5) || '17:00',
                    };
                }));
            })
            .catch(() => { });
    }, []);

    async function save() {
        setSaving(true);
        const token = localStorage.getItem('token');
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const rules = schedule.filter(d => d.enabled).map(d => ({
            dayOfWeek: d.value, startTime: d.startTime, endTime: d.endTime,
        }));
        await fetch('/api/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ timezone: tz, rules }),
        });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    return (
        <div className="shell">
            <Sidebar />
            <main className="main">
                

               

                <div className="page-header" style={{ marginBottom: 32 }}>
                    <div>
                        <h1 className="page-title">Availability</h1>
                        <p className="page-subtitle">Set your weekly schedule and working hours.</p>
                    </div>
                    <button className="btn btn-primary" onClick={save} disabled={saving}>
                        {saved ? 'Saved' : saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                <div className="calendar-layout">
                    <div className="mini-cal" style={{ gridColumn: 'span 2' }}>
                        <div className="card-outer" style={{ marginBottom: 24 }}>
                            <div className="card-header-inner">
                                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Your Timezone</h3>
                            </div>
                            <div style={{ padding: 20 }}>
                                <div style={{ fontSize: 13 }}>Current preference: <strong>{timezone}</strong></div>
                                <div style={{ fontSize: 11, color: '#6e6e73', marginTop: 8 }}>All availability is stored in UTC and converted automatically.</div>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {schedule.map(day => (
                                <div key={day.value} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                                    <div style={{ width: 120 }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={day.enabled} 
                                                onChange={() => setSchedule(s => s.map(d => d.value === day.value ? { ...d, enabled: !d.enabled } : d))}
                                                style={{ width: 16, height: 16, accentColor: '#1d1d1f' }}
                                            />
                                            <span style={{ fontWeight: day.enabled ? 600 : 400, color: day.enabled ? '#1d1d1f' : '#6e6e73' }}>{day.label}</span>
                                        </label>
                                    </div>

                                    {day.enabled ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <input 
                                                type="time" 
                                                className="btn" 
                                                value={day.startTime}
                                                onChange={e => setSchedule(s => s.map(d => d.value === day.value ? { ...d, startTime: e.target.value } : d))}
                                                style={{ height: 36, padding: '4px 12px' }}
                                            />
                                            <span style={{ color: '#6e6e73' }}>–</span>
                                            <input 
                                                type="time" 
                                                className="btn" 
                                                value={day.endTime}
                                                onChange={e => setSchedule(s => s.map(d => d.value === day.value ? { ...d, endTime: e.target.value } : d))}
                                                style={{ height: 36, padding: '4px 12px' }}
                                            />
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: 13, color: '#6e6e73', fontStyle: 'italic' }}>Unavailable</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
