import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminStyles } from './adminStyles';
import { apiUrl, getJwt, handleAuthError } from './adminUtils';

interface AnalyticsSummary {
    uniqueUsers: number;
    totalEvents: number;
    eventsByType: Record<string, number>;
    topTools: Array<{ toolId: number; views: number }>;
}

const AdminAnalytics: React.FC = () => {
    const navigate = useNavigate();

    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - timeRange);
            const token = getJwt();

            const response = await fetch(
                apiUrl(`/api/analytics/summary?since=${encodeURIComponent(daysAgo.toISOString())}`),
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                // tenta tratar 401/403 centralmente; se tratado, retorna
                const handled = handleAuthError(response.status, response.statusText, navigate, setError);
                if (handled) return;
                throw new Error(response.statusText || 'Failed to fetch analytics');
            }

            const data = await response.json();
            setSummary(data);
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

    if (!summary) {
        return null;
    }

    const eventTypes = Object.entries(summary.eventsByType || {});

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Analytics</h1>
                <nav style={styles.nav}>
                    <Link to="/admin" style={styles.navLink}>Dashboard</Link>
                    <Link to="/admin/users" style={styles.navLink}>Users</Link>
                    <Link to="/admin/tools" style={styles.navLink}>Tools</Link>
                    <Link to="/" style={styles.navLink}>Home</Link>
                </nav>
            </header>

            <div style={styles.content}>
                {/* Time Range Selector */}
                <div style={styles.timeRangeSection}>
                    <h2 style={styles.sectionTitle}>Time Range</h2>
                    <div style={styles.timeRangeButtons}>
                        {[7, 30, 90].map(days => (
                            <button
                                key={days}
                                style={{
                                    ...styles.timeRangeButton,
                                    ...(timeRange === days ? styles.timeRangeButtonActive : {}),
                                }}
                                onClick={() => setTimeRange(days as 7 | 30 | 90)}
                            >
                                Last {days} days
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Stats */}
                <div style={styles.statsGrid}>
                    <div style={styles.statCard}>
                        <h3 style={styles.statTitle}>Unique Users</h3>
                        <p style={styles.statValue}>{summary.uniqueUsers}</p>
                        <p style={styles.statSubtitle}>Active users in selected period</p>
                    </div>
                    <div style={styles.statCard}>
                        <h3 style={styles.statTitle}>Total Events</h3>
                        <p style={styles.statValue}>{summary.totalEvents}</p>
                        <p style={styles.statSubtitle}>All tracked events</p>
                    </div>
                </div>

                {/* Events by Type */}
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Events by Type</h2>
                    <div style={styles.eventsGrid}>
                        {eventTypes.map(([type, count]) => (
                            <div key={type} style={styles.eventCard}>
                                <div style={styles.eventType}>{type.replace('_', ' ')}</div>
                                <div style={styles.eventCount}>{count}</div>
                            </div>
                        ))}
                        {eventTypes.length === 0 && (
                            <p style={styles.noData}>No events recorded in this period</p>
                        )}
                    </div>
                </div>

                {/* Top Tools */}
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Most Viewed Tools</h2>
                    <div style={styles.toolsTable}>
                        {summary.topTools && summary.topTools.length > 0 ? (
                            <table style={styles.table}>
                                <thead>
                                <tr style={styles.tableHeaderRow}>
                                    <th style={styles.tableHeader}>Rank</th>
                                    <th style={styles.tableHeader}>Tool ID</th>
                                    <th style={styles.tableHeader}>Views</th>
                                </tr>
                                </thead>
                                <tbody>
                                {summary.topTools.map((tool, index) => (
                                    <tr key={tool.toolId} style={styles.tableRow}>
                                        <td style={styles.tableCell}>#{index + 1}</td>
                                        <td style={styles.tableCell}>{tool.toolId}</td>
                                        <td style={styles.tableCell}>{tool.views}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <p style={styles.noData}>No tool views recorded in this period</p>
                        )}
                    </div>
                </div>

                {/* Event Type Distribution Chart (Simple Bar Chart) */}
                {eventTypes.length > 0 && (
                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Event Distribution</h2>
                        <div style={styles.chartContainer}>
                            {eventTypes.map(([type, count]) => {
                                const maxCount = Math.max(...eventTypes.map(([, c]) => c));
                                const percentage = (count / maxCount) * 100;
                                return (
                                    <div key={type} style={styles.barRow}>
                                        <div style={styles.barLabel}>{type.replace('_', ' ')}</div>
                                        <div style={styles.barContainer}>
                                            <div
                                                style={{
                                                    ...styles.bar,
                                                    width: `${percentage}%`,
                                                }}
                                            />
                                        </div>
                                        <div style={styles.barValue}>{count}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    ...adminStyles,
    timeRangeSection: {
        marginBottom: '32px',
    },
    timeRangeButtons: {
        display: 'flex',
        gap: '12px',
    },
    timeRangeButton: {
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
    timeRangeButtonActive: {
        backgroundColor: '#1976d2',
        borderColor: '#1976d2',
        color: 'white',
    },
    statsGrid: {
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
    section: {
        marginBottom: '40px',
    },
    eventsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
    },
    eventCard: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center',
    },
    eventType: {
        fontSize: '14px',
        color: '#666',
        marginBottom: '12px',
        textTransform: 'capitalize',
    },
    eventCount: {
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#1976d2',
    },
    toolsTable: {
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
    chartContainer: {
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    barRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '16px',
    },
    barLabel: {
        minWidth: '150px',
        fontSize: '14px',
        color: '#666',
        textTransform: 'capitalize',
    },
    barContainer: {
        flex: 1,
        height: '32px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
        backgroundColor: '#1976d2',
        transition: 'width 0.3s ease',
    },
    barValue: {
        minWidth: '60px',
        textAlign: 'right',
        fontSize: '14px',
        fontWeight: '600',
        color: '#333',
    },
    noData: {
        padding: '40px',
        textAlign: 'center',
        color: '#999',
        fontSize: '16px',
    },
};

export default AdminAnalytics;
