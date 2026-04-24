'use client';

import { useRouter, usePathname } from 'next/navigation';

const HOST_NAV = [
    { href: '/event-types', icon: '⊞', label: 'Event types' },
    { href: '/availability', icon: '⏰', label: 'Availability' },
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
];

const BOOKER_NAV = [
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/my-bookings', icon: '🗓', label: 'My Bookings' },
];

const FOOTER_ITEMS = [
    { icon: '⚙', label: 'Settings' },
];

export default function Sidebar({ username = 'User' }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user", e);
            }
        }
    }, []);

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/signIn');
    }

    const role = user?.role || 'HOST';
    const activeNav = role === 'HOST' ? HOST_NAV : BOOKER_NAV;
    const nameToDisplay = user?.username || username;
    const initials = nameToDisplay.slice(0, 2).toUpperCase();

    return (
        <aside className="sidebar">
            {/* User */}
            <div className="sidebar-user" style={{ gap: 12 }}>
                <div className="sidebar-avatar">{initials}</div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span className="sidebar-username" style={{ fontSize: 13, fontWeight: 600 }}>{nameToDisplay}</span>
                    <span style={{ fontSize: 10, color: '#9ca3af', textTransform: 'capitalize' }}>{role.toLowerCase()}</span>
                </div>
            </div>

            {/* Nav */}
            <nav className="sidebar-nav">
                {activeNav.map(item => (
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

            {/* Footer */}
            <div className="sidebar-footer">
                {FOOTER_ITEMS.map(item => (
                    <button key={item.label} className="nav-item">
                        <span className="nav-icon">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
                <button className="nav-item" onClick={logout} style={{ color: '#ef4444' }}>
                    <span className="nav-icon">⎋</span>
                    Sign out
                </button>
            </div>
        </aside>
    );
}
