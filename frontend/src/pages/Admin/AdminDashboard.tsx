import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminStyles } from './adminStyles';
import { apiUrl, getJwt, handleAuthError } from './adminUtils';

interface AdminStats {
    totalRents: number;
    totalUsers: number;
    totalTools: number;
    mostRentedTool: string;
    averageRentDurationDays: number;
    pendingRents: number;
    approvedRents: number;
    rejectedRents: number;
    approvalRate?: number;
    activeUsers: number;
    availableTools: number;
    rentedTools: number;
}

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const token = getJwt();
            const headers: Record<string, string> = {};
            if (token) headers.Authorization = `Bearer ${token}`;

            const response = await fetch(apiUrl('/api/users/stats/admin'), { headers });

            if (!response.ok) {
                const handled = handleAuthError(response.status, response.statusText, navigate, setError);
                if (handled) return;
                throw new Error(response.statusText || 'Failed to fetch stats');
            }

            const data = await response.json();
            setStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

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

    if (!stats) return null;

    const approvalRateDisplay =
        typeof stats.approvalRate === 'number' && Number.isFinite(stats.approvalRate)
            ? `${stats.approvalRate.toFixed(1)}%`
            : 'N/A';

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Admin Dashboard</h1>
                <nav style={styles.nav}>
                    <Link to="/admin/users" style={styles.navLink}>Users</Link>
                    <Link to="/admin/tools" style={styles.navLink}>Tools</Link>
                    <Link to="/" style={styles.navLink}>Home</Link>
                </nav>
            </header>

            <div style={styles.content}>
                <div style={styles.grid}>
                    <StatCard
                        title="Total Users"
                        value={stats.totalUsers}
                        subtitle={`${stats.activeUsers} active in last 30 days`}
                        color="#4CAF50"
                    />
                    <StatCard
                        title="Total Tools"
                        value={stats.totalTools}
                        subtitle={`${stats.availableTools} available, ${stats.rentedTools} rented`}
                        color="#2196F3"
                    />
                    <StatCard
                        title="Total Rents"
                        value={stats.totalRents}
                        subtitle={`${stats.pendingRents} pending approval`}
                        color="#FF9800"
                    />
                    <StatCard
                        title="Approval Rate"
                        value={approvalRateDisplay}
                        subtitle={`${stats.approvedRents} approved, ${stats.rejectedRents} rejected`}
                        color="#9C27B0"
                    />
                </div>

                <div style={styles.secondaryGrid}>
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>Most Rented Tool</h3>
                        <p style={styles.cardValue}>{stats.mostRentedTool || 'N/A'}</p>
                    </div>
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>Avg Rent Duration</h3>
                        <p style={styles.cardValue}>{stats.averageRentDurationDays.toFixed(1)} days</p>
                    </div>
                </div>

                <div style={styles.actionsSection}>
                    <h2 style={styles.sectionTitle}>Quick Actions</h2>
                    <div style={styles.actionsGrid}>
                        <Link to="/admin/users" style={styles.actionButton}>
                            <span style={styles.actionIcon}>👥</span>
                            <span>Manage Users</span>
                        </Link>
                        <Link to="/admin/tools" style={styles.actionButton}>
                            <span style={styles.actionIcon}>🔧</span>
                            <span>Manage Tools</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface StatCardProps {
    title: string;
    value: number | string;
    subtitle: string;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, color }) => (
    <div style={{ ...styles.statCard, borderLeft: `4px solid ${color}` }}>
        <h3 style={styles.statTitle}>{title}</h3>
        <p style={styles.statValue}>{value}</p>
        <p style={styles.statSubtitle}>{subtitle}</p>
    </div>
);

const styles: { [key: string]: React.CSSProperties } = {
    ...adminStyles,
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '40px',
    },
    statTitle: {
        margin: '0 0 12px 0',
        fontSize: '14px',
        fontWeight: '500',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    statValue: {
        margin: '0 0 8px 0',
        fontSize: '36px',
        fontWeight: 'bold',
        color: '#333',
    },
    statSubtitle: {
        margin: 0,
        fontSize: '14px',
        color: '#999',
    },
    secondaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '40px',
    },
    card: {
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    cardTitle: {
        margin: '0 0 16px 0',
        fontSize: '16px',
        fontWeight: '600',
        color: '#333',
    },
    cardValue: {
        margin: 0,
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#1976d2',
    },
    actionsSection: {
        marginTop: '40px',
    },
    actionsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
    },
    actionButton: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        padding: '32px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textDecoration: 'none',
        color: '#333',
        transition: 'all 0.3s',
        cursor: 'pointer',
    },
    actionIcon: {
        fontSize: '48px',
    },
};

export default AdminDashboard;
