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

const DEFAULT_TIMES = { startTime: '09:00', endTime: '17:00' };
const DEFAULT_ENABLED = [1, 2, 3, 4, 5]; // Mon-Fri

function CalendarModal({ onClose, onSelect }) {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
    function firstDayOfMonth(y, m) { return new Date(y, m, 1).getDay(); }

    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);

    function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
    function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }

    function selectDay(d) {
        const m = String(month + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        onSelect(`${year}-${m}-${dd}`);
    }

    const today = now.getDate();
    const todayMonth = now.getMonth();
    const todayYear = now.getFullYear();

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">Select the dates to override</div>
                <div className="modal-body">
                    {/* Month nav */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{monthNames[month]} {year}</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn-icon" onClick={prevMonth}>‹</button>
                            <button className="btn-icon" onClick={nextMonth}>›</button>
                        </div>
                    </div>
                    {/* Grid */}
                    <table className="cal-grid">
                        <thead>
                            <tr>{['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => <th key={d}>{d}</th>)}</tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: Math.ceil(cells.length / 7) }).map((_, ri) => (
                                <tr key={ri}>
                                    {cells.slice(ri * 7, ri * 7 + 7).map((d, ci) => (
                                        <td key={ci}>
                                            {d ? (
                                                <button
                                                    className={`cal-day ${d === today && month === todayMonth && year === todayYear ? 'today' : ''}`}
                                                    onClick={() => selectDay(d)}
                                                >
                                                    {d}
                                                </button>
                                            ) : ''}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

function formatTime12(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')}${ampm}`;
}

export default function AvailabilityPage() {
    const [schedule, setSchedule] = useState(() =>
        DAYS.map(d => ({
            ...d,
            enabled: DEFAULT_ENABLED.includes(d.value),
            startTime: '09:00',
            endTime: '17:00',
        }))
    );
    const [overrides, setOverrides] = useState([]);
    const [timezone, setTimezone] = useState(() => (typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC'));
    const [saving, setSaving] = useState(false);
    const [showCal, setShowCal] = useState(false);
    const [saved, setSaved] = useState(false);

    function getUserTimezone() { return Intl.DateTimeFormat().resolvedOptions().timeZone; }

    // Load existing rules
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

        fetch('/api/availability/schedule', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => { if (Array.isArray(d.overrides)) setOverrides(d.overrides); })
            .catch(() => { });
    }, []);

    function toggleDay(dayValue) {
        setSchedule(s => s.map(d => d.value === dayValue ? { ...d, enabled: !d.enabled } : d));
    }
    function setTime(dayValue, field, val) {
        setSchedule(s => s.map(d => d.value === dayValue ? { ...d, [field]: val } : d));
    }

    async function save() {
        setSaving(true);
        const token = localStorage.getItem('token');
        const tz = getUserTimezone();
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

    async function addOverride(date) {
        setShowCal(false);
        const token = localStorage.getItem('token');
        await fetch('/api/availability/overrides', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ timezone: getUserTimezone(), overrides: [{ date, isAvailable: false }] }),
        });
        const d = await fetch('/api/availability/schedule', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
        if (Array.isArray(d.overrides)) setOverrides(d.overrides);
    }

    // Summary line like "Mon - Fri, 9:00 AM - 5:00 PM"
    const enabledDays = schedule.filter(d => d.enabled);
    const summaryDays = enabledDays.map(d => d.label.slice(0, 3)).join(', ');
    const summaryTime = enabledDays.length > 0
        ? `${formatTime12(enabledDays[0].startTime).toUpperCase()} – ${formatTime12(enabledDays[0].endTime).toUpperCase()}`
        : '';

    return (
        <div className="shell">
            <Sidebar />
            <main className="main">
                {/* Topbar */}
                <div className="topbar">
                    <div className="topbar-left">
                        <button className="topbar-back" onClick={() => { }}>‹</button>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                                Working Hours
                                <button className="btn-icon" style={{ width: 20, height: 20, fontSize: 11 }}>✏</button>
                            </div>
                            {summaryDays && <div style={{ fontSize: 11, color: '#6b7280' }}>{summaryDays}, {summaryTime}</div>}
                        </div>
                    </div>
                    <div className="topbar-right">
                        <span style={{ fontSize: 13, color: '#6b7280' }}>Set as default</span>
                        <label className="toggle">
                            <input type="checkbox" />
                            <span className="toggle-slider" />
                        </label>
                        <div style={{ width: 1, height: 20, background: '#e5e7eb', margin: '0 4px' }} />
                        <button className="btn-icon" title="Delete">🗑</button>
                        <div style={{ width: 1, height: 20, background: '#e5e7eb', margin: '0 4px' }} />
                        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
                            {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="page-wrap" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, maxWidth: 960, alignItems: 'start' }}>
                    {/* Left: schedule + overrides */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Weekly hours card */}
                        <div className="card">
                            {schedule.map(day => (
                                <div key={day.value} className="day-row">
                                    {/* Toggle */}
                                    <label className="toggle" style={{ marginRight: 16 }}>
                                        <input type="checkbox" checked={day.enabled} onChange={() => toggleDay(day.value)} />
                                        <span className="toggle-slider" />
                                    </label>

                                    {/* Day name */}
                                    <span className={`day-name ${!day.enabled ? 'disabled-day' : ''}`}>{day.label}</span>

                                    {/* Times (only if enabled) */}
                                    {day.enabled ? (
                                        <div className="day-times">
                                            <input type="time" className="time-input" value={day.startTime}
                                                onChange={e => setTime(day.value, 'startTime', e.target.value)} />
                                            <span className="time-sep">–</span>
                                            <input type="time" className="time-input" value={day.endTime}
                                                onChange={e => setTime(day.value, 'endTime', e.target.value)} />
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: 13, color: '#9ca3af', flex: 1 }}>Unavailable</span>
                                    )}

                                    {/* Actions */}
                                    {day.enabled && (
                                        <div className="day-actions">
                                            <button className="btn-icon" style={{ fontSize: 15 }} title="Add slot">+</button>
                                            <button className="btn-icon" style={{ fontSize: 13 }} title="Copy times">⎘</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Date overrides card */}
                        <div className="card" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <span style={{ fontWeight: 600, fontSize: 14 }}>Date overrides</span>
                                <span style={{
                                    width: 16, height: 16, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '50%',
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#6b7280'
                                }}>?</span>
                            </div>
                            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
                                Add dates when your availability changes from your daily hours.
                            </p>

                            {/* Existing overrides */}
                            {overrides.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                                    {overrides.map(o => (
                                        <div key={o.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '8px 12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6
                                        }}>
                                            <span style={{ fontSize: 13 }}>
                                                {new Date(o.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                            </span>
                                            <span style={{ fontSize: 12, color: '#ef4444' }}>Unavailable</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button className="btn btn-secondary btn-sm" onClick={() => setShowCal(true)}>
                                + Add an override
                            </button>
                        </div>
                    </div>

                    {/* Right: timezone */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div className="card" style={{ padding: 16 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Timezone</div>
                            <select className="input input-full" value={timezone} onChange={e => setTimezone(e.target.value)}
                                style={{ fontSize: 13 }}>
                                <option value={timezone}>{timezone}</option>
                            </select>
                        </div>

                        <div className="card" style={{ padding: 16 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Something doesn&apos;t look right?</div>
                            <button className="btn btn-ghost btn-sm">Launch troubleshooter</button>
                        </div>
                    </div>
                </div>
            </main>

            {showCal && <CalendarModal onClose={() => setShowCal(false)} onSelect={addOverride} />}
        </div>
    );
}
