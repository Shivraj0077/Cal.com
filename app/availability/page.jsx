'use client';

import { useEffect, useState} from 'react';

export default function AvailabilityPage() {
    const [weekly, setWeekly] = useState([]);
    const [overrides, setOverrides] = useState([]);
    const [form, setForm] = useState({
        dayOfWeek: 1,
        startTime: '',
        endTime: ''
    });

    function formatTime(timeStr){
        if(!timeStr) '';
        const [hour, minute] = timeStr.split(":");
        const date = new Date()
        date.setHours(hour);
        date.setMinutes(minute);

        return date.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        })
    }

    async function fetchData() {
        const token = localStorage.getItem('token');
        if (!token) return;

        const rules = await fetch('/api/availability/rules', {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json());

        const schedule = await fetch('/api/availability/schedule', {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json());

        setWeekly(rules || []);
        setOverrides(schedule.overrides || []);
    }

    useEffect(() => {
        fetchData();
    }, []);

    async function addRule() {
        const token = localStorage.getItem('token');
        await fetch('/api/availability', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                timezone: 'Asia/Kolkata',
                rules: [
                    {
                        dayOfWeek: form.dayOfWeek,
                        startTime: form.startTime,
                        endTime: form.endTime
                    }
                ]
            })
        });

        fetchData();
    }

    async function addHoliday() {
        const token = localStorage.getItem('token');
        await fetch('/api/availability/overrides', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                timezone: 'Asia/Kolkata',
                overrides: [
                    {
                        date: form.date,
                        isAvailable: false
                    }
                ]
            })
        });

        fetchData();
    }

    return (
        <div style={{ padding: 20, backgroundColor: "#fa0a0aff" }}>
            <h2>Weekly Availability</h2>

            <select
                value={form.dayOfWeek}
                onChange={e => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
            >
                {[0, 1, 2, 3, 4, 5, 6].map(d => (
                    <option key={d} value={d}>Day {d}</option>
                ))}
            </select>

            <input
                type="time"
                onChange={e => setForm({ ...form, startTime: e.target.value })}
            />
            <input
                type="time"
                onChange={e => setForm({ ...form, endTime: e.target.value })}
            />

            <button onClick={addRule}>Add Slot</button>

            <ul>
                {weekly.map(r => (
                    <li key={r.id}>
                        Day {r.day_of_week}: {formatTime(r.start_time)} – {formatTime(r.end_time)}
                    </li>
                ))}
            </ul>

            <h2>Date Overrides</h2>

            <input
                type="date"
                onChange={e => setForm({ ...form, date: e.target.value })}
            />
            <button onClick={addHoliday}>Mark Holiday</button>

            <ul>
                {overrides.map(o => (
                    <li key={o.id}>
                        {o.date} → {o.is_available ? 'Available' : 'Holiday'}
                    </li>
                ))}
            </ul>
        </div>
    );
}
