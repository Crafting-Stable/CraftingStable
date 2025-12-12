import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface User {
    id: number;
    name: string;
    email: string;
    type: 'CUSTOMER' | 'ADMIN';
    active: boolean;
}

const AdminUsers: React.FC = () => {
    const apiUrl = (path: string) => {
        const protocol = globalThis.location.protocol;
        const hostname = globalThis.location.hostname;
        const normalized = path.startsWith('/') ? path : `/${path}`;
        return `${protocol}//${hostname}:8081${normalized}`;
    };

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'ADMIN' | 'CUSTOMER'>('ALL');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('jwt');

            const response = await fetch(apiUrl('/api/users'), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch users');

            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };


const handleActivateUser = async (id: number) => {
    try {
        const token = localStorage.getItem('jwt'); // 🔥

        const response = await fetch(apiUrl(`/api/users/${id}/activate`), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // 🔥
            },
        });

        if (!response.ok) throw new Error('Failed to activate user');

        fetchUsers();
    } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to activate user');
    }
};


const handleDeactivateUser = async (id: number) => {
    try {
        const token = localStorage.getItem('jwt');

        const response = await fetch(apiUrl(`/api/users/${id}/deactivate`), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        if (!response.ok) throw new Error('Failed to deactivate user');

        fetchUsers();
    } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to deactivate user');
    }
};


const handleChangeRole = async (id: number, newRole: 'CUSTOMER' | 'ADMIN') => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    try {
        const token = localStorage.getItem('jwt');

        const response = await fetch(apiUrl(`/api/users/${id}/role`), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ role: newRole }),
        });

        if (!response.ok) throw new Error('Failed to change user role');

        fetchUsers();
    } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to change user role');
    }
};


const filteredUsers = users.filter(user => {
        if (filter === 'ALL') return true;
        if (filter === 'ACTIVE') return user.active;
        if (filter === 'INACTIVE') return !user.active;
        if (filter === 'ADMIN') return user.type === 'ADMIN';
        if (filter === 'CUSTOMER') return user.type === 'CUSTOMER';
        return true;
    });

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <div style={styles.error}>Error: {error}</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>User Management</h1>
                <nav style={styles.nav}>
                    <Link to="/admin" style={styles.navLink}>Dashboard</Link>
                    <Link to="/admin/tools" style={styles.navLink}>Tools</Link>
                    <Link to="/admin/analytics" style={styles.navLink}>Analytics</Link>
                    <Link to="/" style={styles.navLink}>Home</Link>
                </nav>
            </header>

            <div style={styles.content}>
                {/* Filters */}
                <div style={styles.filtersSection}>
                    <h2 style={styles.sectionTitle}>Filters</h2>
                    <div style={styles.filters}>
                        {(['ALL', 'ACTIVE', 'INACTIVE', 'ADMIN', 'CUSTOMER'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    ...styles.filterButton,
                                    ...(filter === f ? styles.filterButtonActive : {}),
                                }}
                            >
                                {f === 'ALL' ? 'All' : f}
                            </button>
                        ))}
                    </div>
                    <p style={styles.resultCount}>{filteredUsers.length} users</p>
                </div>

                {/* Users Table */}
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                        <tr style={styles.tableHeaderRow}>
                            <th style={styles.tableHeader}>ID</th>
                            <th style={styles.tableHeader}>Name</th>
                            <th style={styles.tableHeader}>Email</th>
                            <th style={styles.tableHeader}>Role</th>
                            <th style={styles.tableHeader}>Status</th>
                            <th style={styles.tableHeader}>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} style={styles.tableRow}>
                                <td style={styles.tableCell}>{user.id}</td>
                                <td style={styles.tableCell}>{user.name}</td>
                                <td style={styles.tableCell}>{user.email}</td>
                                <td style={styles.tableCell}>
                                        <span style={{ ...styles.badge, backgroundColor: user.type === 'ADMIN' ? '#1976d2' : '#4caf50' }}>
                                            {user.type}
                                        </span>
                                </td>
                                <td style={styles.tableCell}>
                                        <span style={{ ...styles.badge, backgroundColor: user.active ? '#4caf50' : '#f44336' }}>
                                            {user.active ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                </td>
                                <td style={styles.tableCell}>
                                    <div style={styles.actionButtons}>
                                        {user.active ? (
                                            <button style={{ ...styles.actionBtn, backgroundColor: '#f44336' }} onClick={() => handleDeactivateUser(user.id)}>Deactivate</button>
                                        ) : (
                                            <button style={{ ...styles.actionBtn, backgroundColor: '#4caf50' }} onClick={() => handleActivateUser(user.id)}>Activate</button>
                                        )}
                                        <button style={{ ...styles.actionBtn, backgroundColor: '#1976d2' }} onClick={() => handleChangeRole(user.id, user.type === 'ADMIN' ? 'CUSTOMER' : 'ADMIN')}>
                                            Make {user.type === 'ADMIN' ? 'Customer' : 'Admin'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'Inter, Arial, sans-serif',
    },
    header: {
        backgroundColor: '#1976d2',
        color: 'white',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    title: {
        margin: 0,
        fontSize: '28px',
        fontWeight: 'bold',
    },
    nav: {
        display: 'flex',
        gap: '20px',
    },
    navLink: {
        color: 'white',
        textDecoration: 'none',
        fontSize: '16px',
        padding: '8px 16px',
        borderRadius: '4px',
        transition: 'background-color 0.3s',
    },
    content: {
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px 20px',
    },
    filtersSection: {
        marginBottom: '32px',
    },
    sectionTitle: {
        margin: '0 0 16px 0',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#333',
    },
    filters: {
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        flexWrap: 'wrap',
    },
    filterButton: {
        padding: '10px 20px',
        border: '2px solid #ddd',
        borderRadius: '6px',
        backgroundColor: 'white',
        color: '#666',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.3s',
    },
    filterButtonActive: {
        backgroundColor: '#1976d2',
        borderColor: '#1976d2',
        color: 'white',
    },
    resultCount: {
        margin: 0,
        fontSize: '14px',
        color: '#666',
    },
    tableContainer: {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    tableHeaderRow: {
        backgroundColor: '#f5f5f5',
    },
    tableHeader: {
        padding: '16px',
        textAlign: 'left',
        fontWeight: '600',
        color: '#333',
        borderBottom: '2px solid #ddd',
    },
    tableRow: {
        borderBottom: '1px solid #eee',
    },
    tableCell: {
        padding: '16px',
        color: '#666',
    },
    badge: {
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        color: 'white',
    },
    actionButtons: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
    },
    actionBtn: {
        padding: '8px 16px',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'opacity 0.3s',
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '24px',
        color: '#666',
    },
    error: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '20px',
        color: '#f44336',
    },
};

export default AdminUsers;
