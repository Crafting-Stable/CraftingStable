import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface AdminStats {
  totalRents: number;
  totalUsers: number;
  totalTools: number;
  mostRentedTool: string;
  averageRentDurationDays: number;
  pendingRents: number;
  approvedRents: number;
  rejectedRents: number;
  approvalRate: number;
  activeUsers: number;
  availableTools: number;
  rentedTools: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/users/admin/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
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

  if (!stats) {
    return null;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <nav style={styles.nav}>
          <Link to="/admin/users" style={styles.navLink}>Users</Link>
          <Link to="/admin/tools" style={styles.navLink}>Tools</Link>
          <Link to="/admin/analytics" style={styles.navLink}>Analytics</Link>
          <Link to="/" style={styles.navLink}>Home</Link>
        </nav>
      </header>

      <div style={styles.content}>
        {/* Main Stats Grid */}
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
            value={`${stats.approvalRate.toFixed(1)}%`}
            subtitle={`${stats.approvedRents} approved, ${stats.rejectedRents} rejected`}
            color="#9C27B0"
          />
        </div>

        {/* Secondary Stats */}
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

        {/* Quick Actions */}
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
            <Link to="/admin/analytics" style={styles.actionButton}>
              <span style={styles.actionIcon}>📊</span>
              <span>View Analytics</span>
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '40px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
  sectionTitle: {
    margin: '0 0 24px 0',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
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

export default AdminDashboard;
