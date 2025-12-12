import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Tool {
    id: number;
    name: string;
    type: string;
    dailyPrice: number;
    depositAmount: number;
    description: string;
    location: string;
    status: 'AVAILABLE' | 'RENTED' | 'UNDER_MAINTENANCE' | 'INACTIVE';
    available: boolean;
    imageUrl: string | null;
    ownerId: number;
}

const API_PORT = '8081';

function apiUrl(path: string) {
    const protocol = globalThis.location.protocol;
    const hostname = globalThis.location.hostname;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${protocol}//${hostname}:${API_PORT}${normalized}`;
}

const getJwt = () => {
    const jwt = globalThis.localStorage.getItem('jwt');
    return jwt || undefined;
};

const AdminTools: React.FC = () => {
    const navigate = useNavigate();
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'ALL' | 'AVAILABLE' | 'RENTED' | 'UNDER_MAINTENANCE' | 'INACTIVE'>('ALL');
    const [editingTool, setEditingTool] = useState<Tool | null>(null);

    useEffect(() => {
        fetchTools();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAuthError = (status?: number, statusText?: string) => {
        if (status === 401 || status === 403) {
            globalThis.localStorage.removeItem('jwt');
            globalThis.localStorage.removeItem('user');
            setError('Sessão expirada. Por favor faça login novamente.');
            setTimeout(() => navigate('/loginPage'), 1200);
            return true;
        }
        if (status && !statusText) {
            setError(statusText || 'Erro de autenticação');
        }
        return false;
    };

    const fetchTools = async () => {
        setLoading(true);
        setError(null);
        try {
            const jwt = getJwt();
            const res = await fetch(apiUrl('/api/tools'), {
                headers: {
                    'Accept': 'application/json',
                    ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
                }
            });
            if (!res.ok) {
                const text = await res.text().catch(() => res.statusText);
                if (handleAuthError(res.status, text)) return;
                throw new Error(text || res.statusText);
            }
            const data: Tool[] = await res.json().catch(() => []);
            setTools(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch tools');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: number, newStatus: Tool['status']) => {
        try {
            const jwt = getJwt();
            const res = await fetch(apiUrl(`/api/tools/${id}/status`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) {
                const text = await res.text().catch(() => res.statusText);
                if (handleAuthError(res.status, text)) return;
                throw new Error(text || res.statusText);
            }
            await fetchTools();
        } catch (err: any) {
            alert(err.message || 'Failed to update tool status');
        }
    };

    const handleEdit = (tool: Tool) => {
        setEditingTool(tool);
    };

    const handleSaveEdit = async () => {
        if (!editingTool) return;

        try {
            const jwt = getJwt();
            const res = await fetch(apiUrl(`/api/tools/${editingTool.id}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
                },
                body: JSON.stringify(editingTool),
            });
            if (!res.ok) {
                const text = await res.text().catch(() => res.statusText);
                if (handleAuthError(res.status, text)) return;
                throw new Error(text || res.statusText);
            }
            setEditingTool(null);
            await fetchTools();
            alert('Ferramenta atualizada com sucesso!');
        } catch (err: any) {
            alert(err.message || 'Failed to update tool');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this tool?')) {
            return;
        }

        try {
            const jwt = getJwt();
            const res = await fetch(apiUrl(`/api/tools/${id}`), {
                method: 'DELETE',
                headers: {
                    ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
                }
            });
            if (!res.ok) {
                const text = await res.text().catch(() => res.statusText);
                if (handleAuthError(res.status, text)) return;
                throw new Error(text || res.statusText);
            }
            await fetchTools();
            alert('Ferramenta apagada com sucesso!');
        } catch (err: any) {
            alert(err.message || 'Failed to delete tool');
        }
    };

    const filteredTools = tools.filter(tool => {
        if (filter === 'ALL') return true;
        return tool.status === filter;
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
                <h1 style={styles.title}>Tool Management</h1>
                <nav style={styles.nav}>
                    <Link to="/admin" style={styles.navLink}>Dashboard</Link>
                    <Link to="/admin/users" style={styles.navLink}>Users</Link>
                    <Link to="/admin/analytics" style={styles.navLink}>Analytics</Link>
                    <Link to="/" style={styles.navLink}>Home</Link>
                </nav>
            </header>

            <div style={styles.content}>
                {/* Filters */}
                <div style={styles.filtersSection}>
                    <h2 style={styles.sectionTitle}>Filters</h2>
                    <div style={styles.filters}>
                        {(['ALL', 'AVAILABLE', 'RENTED', 'UNDER_MAINTENANCE', 'INACTIVE'] as const).map(f => (
                            <button
                                key={f}
                                style={{
                                    ...styles.filterButton,
                                    ...(filter === f ? styles.filterButtonActive : {}),
                                }}
                                onClick={() => setFilter(f)}
                            >
                                {f === 'ALL' ? 'All' : f}
                            </button>
                        ))}
                    </div>
                    <p style={styles.resultCount}>{filteredTools.length} tools</p>
                </div>

                {/* Tools Table */}
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                        <tr style={styles.tableHeaderRow}>
                            <th style={styles.tableHeader}>ID</th>
                            <th style={styles.tableHeader}>Name</th>
                            <th style={styles.tableHeader}>Type</th>
                            <th style={styles.tableHeader}>Location</th>
                            <th style={styles.tableHeader}>Price/day</th>
                            <th style={styles.tableHeader}>Status</th>
                            <th style={styles.tableHeader}>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredTools.map(tool => (
                            <tr key={tool.id} style={styles.tableRow}>
                                <td style={styles.tableCell}>{tool.id}</td>
                                <td style={styles.tableCell}>{tool.name}</td>
                                <td style={styles.tableCell}>{tool.type}</td>
                                <td style={styles.tableCell}>{tool.location}</td>
                                <td style={styles.tableCell}>€{tool.dailyPrice}</td>
                                <td style={styles.tableCell}>
                                    <select
                                        value={tool.status}
                                        onChange={(e) => handleUpdateStatus(tool.id, e.target.value as Tool['status'])}
                                        style={styles.statusSelect}
                                    >
                                        <option value="AVAILABLE">AVAILABLE</option>
                                        <option value="RENTED">RENTED</option>
                                        <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
                                        <option value="INACTIVE">INACTIVE</option>
                                    </select>
                                </td>
                                <td style={styles.tableCell}>
                                    <div style={styles.actionButtons}>
                                        <button style={{ ...styles.actionBtn, backgroundColor: '#1976d2' }} onClick={() => handleEdit(tool)}>Edit</button>
                                        <button style={{ ...styles.actionBtn, backgroundColor: '#f44336' }} onClick={() => handleDelete(tool.id)}>Delete</button>
                                        <Link to={`/tools/${tool.id}`} style={{ textDecoration: 'none' }}>
                                            <button style={{ ...styles.actionBtn, backgroundColor: '#4caf50' }}>View</button>
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingTool && (
                <div style={styles.modalOverlay} onClick={() => setEditingTool(null)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 style={styles.modalTitle}>Edit Tool #{editingTool.id}</h2>

                        <div style={styles.formGroup}>
                            <label htmlFor={`name-${editingTool.id}`} style={styles.label}>Name</label>
                            <input id={`name-${editingTool.id}`} style={styles.input} value={editingTool.name} onChange={(e) => setEditingTool(prev => prev ? { ...prev, name: e.target.value } : prev)} />
                        </div>

                        <div style={styles.formGroup}>
                            <label htmlFor={`type-${editingTool.id}`} style={styles.label}>Type</label>
                            <select
                                id={`type-${editingTool.id}`}
                                value={editingTool.type ?? ''}
                                onChange={(e) => setEditingTool(prev => prev ? { ...prev, type: e.target.value } : prev)}
                                style={styles.input as React.CSSProperties}
                            >
                                <option value="">Selecione uma categoria</option>
                                <option value="Jardinagem">Jardinagem</option>
                                <option value="Obras">Obras</option>
                                <option value="Carpintaria">Carpintaria</option>
                                <option value="Elétricas">Elétricas</option>
                            </select>
                        </div>

                        <div style={styles.formGroup}>
                            <label htmlFor={`location-${editingTool.id}`} style={styles.label}>Location</label>
                            <input id={`location-${editingTool.id}`} style={styles.input} value={editingTool.location} onChange={(e) => setEditingTool(prev => prev ? { ...prev, location: e.target.value } : prev)} />
                        </div>

                        <div style={styles.formGroup}>
                            <label htmlFor={`dailyPrice-${editingTool.id}`} style={styles.label}>Daily Price</label>
                            <input id={`dailyPrice-${editingTool.id}`} style={styles.input} type="number" value={editingTool.dailyPrice} onChange={(e) => setEditingTool(prev => prev ? { ...prev, dailyPrice: Number(e.target.value) } : prev)} />
                        </div>

                        <div style={styles.formGroup}>
                            <label htmlFor={`depositAmount-${editingTool.id}`} style={styles.label}>Deposit Amount</label>
                            <input id={`depositAmount-${editingTool.id}`} style={styles.input} type="number" value={editingTool.depositAmount} onChange={(e) => setEditingTool(prev => prev ? { ...prev, depositAmount: Number(e.target.value) } : prev)} />
                        </div>

                        <div style={styles.formGroup}>
                            <label htmlFor={`imageUrl-${editingTool.id}`} style={styles.label}>Image URL</label>
                            <input
                                id={`imageUrl-${editingTool.id}`}
                                style={styles.input}
                                value={editingTool.imageUrl ?? ''}
                                onChange={(e) => setEditingTool(prev => prev ? { ...prev, imageUrl: e.target.value || null } : prev)}
                                placeholder="https://exemplo.com/imagem.jpg"
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label htmlFor={`description-${editingTool.id}`} style={styles.label}>Description</label>
                            <textarea id={`description-${editingTool.id}`} style={{ ...styles.input, height: 100 }} value={editingTool.description} onChange={(e) => setEditingTool(prev => prev ? { ...prev, description: e.target.value } : prev)} />
                        </div>

                        <div style={styles.modalActions}>
                            <button style={styles.cancelBtn} onClick={() => setEditingTool(null)}>Cancel</button>
                            <button style={styles.saveBtn} onClick={handleSaveEdit}>Save</button>
                        </div>
                    </div>
                </div>
            )}
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
    statusSelect: {
        padding: '6px 12px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        backgroundColor: 'white',
        cursor: 'pointer',
        fontSize: '13px',
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
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '32px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
    },
    modalTitle: {
        margin: '0 0 24px 0',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#333',
    },
    formGroup: {
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#333',
    },
    input: {
        width: '100%',
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px',
        boxSizing: 'border-box',
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '24px',
    },
    cancelBtn: {
        padding: '10px 24px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: 'white',
        color: '#666',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
    },
    saveBtn: {
        padding: '10px 24px',
        border: 'none',
        borderRadius: '4px',
        backgroundColor: '#1976d2',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
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

export default AdminTools;
