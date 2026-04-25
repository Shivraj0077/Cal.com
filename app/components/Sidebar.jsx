'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try { setUser(JSON.parse(storedUser)); } catch (e) {}
        }
    }, []);

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/signIn');
    }

    if (!mounted) return (
        <aside className="sidebar">
            <div className="sidebar-logo"><span>BookWise</span></div>
        </aside>
    );

    const nameToDisplay = user?.username || 'User';
    const initials = nameToDisplay.slice(0, 2).toUpperCase();

    const HOST_NAV = [
        { href: '/dashboard', icon: '', label: 'Dashboard' },
        { href: '/event-types', icon: '', label: 'Event types' },
        { href: '/my-bookings', icon: '', label: 'Bookings' },
        { href: '/availability', icon: '', label: 'Availability' },
    ];

    const BOOKER_NAV = [
        { href: '/dashboard', icon: '', label: 'Dashboard' },
        { href: '/my-bookings', icon: '', label: 'My Bookings' },
        { href: '/', icon: '', label: 'Find a Host' },
    ];

    const navItems = user?.role === 'BOOKER' ? BOOKER_NAV : HOST_NAV;

    return (
        <aside className="sidebar">
            {/* User Profile at Top */}
            <div className="sidebar-user-top">
                <div className="sidebar-avatar-small">{initials}</div>
                <div className="sidebar-user-details">
                    <div className="sidebar-user-name-top">{nameToDisplay}</div>
                </div>
                <div className="sidebar-search-icon">Search</div>
            </div>

            <nav className="sidebar-nav" style={{ marginTop: 20 }}>
                {navItems.map(item => (
                    <button
                        key={item.href}
                        className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                        onClick={() => router.push(item.href)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>

            <div style={{ flex: 1 }}></div>

            {/* Bottom Actions */}
            <div className="sidebar-bottom">
               
                <button className="nav-item-small" onClick={() => router.push('/settings')}>
                    Settings
                </button>
                <button className="nav-item-small" onClick={logout} style={{ color: '#ef4444', marginTop: 8 }}>
                    Sign out
                </button>
            </div>
        </aside>
    );
}
