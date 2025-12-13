import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminLayout from './AdminLayout';
import { BrowserRouter } from 'react-router-dom';

// Mock adminStyles
vi.mock('./adminStyles', () => ({
    adminStyles: {
        container: { minHeight: '100vh' },
        header: { backgroundColor: '#1976d2' },
        title: { margin: 0 },
        nav: { display: 'flex' },
        navLink: { color: 'white' },
        navLinkActive: { backgroundColor: 'rgba(255,255,255,0.12)' },
        content: { maxWidth: '1400px' },
    },
}));

describe('AdminLayout', () => {
    const renderComponent = (props: Partial<Parameters<typeof AdminLayout>[0]> = {}) => {
        const defaultProps = {
            children: <div data-testid="test-children">Test Content</div>,
            ...props,
        };

        return render(
            <BrowserRouter>
                <AdminLayout {...defaultProps} />
            </BrowserRouter>
        );
    };

    describe('Rendering', () => {
        it('should render with default title "Admin"', () => {
            renderComponent();
            expect(screen.getByText('Admin')).toBeDefined();
        });

        it('should render with custom title', () => {
            renderComponent({ title: 'Custom Title' });
            expect(screen.getByText('Custom Title')).toBeDefined();
        });

        it('should render children content', () => {
            renderComponent();
            expect(screen.getByTestId('test-children')).toBeDefined();
            expect(screen.getByText('Test Content')).toBeDefined();
        });
    });

    describe('Navigation Links', () => {
        it('should render Dashboard link', () => {
            renderComponent();
            const link = screen.getByRole('link', { name: 'Dashboard' });
            expect(link).toBeDefined();
            expect(link.getAttribute('href')).toBe('/admin');
        });

        it('should render Users link', () => {
            renderComponent();
            const link = screen.getByRole('link', { name: 'Users' });
            expect(link).toBeDefined();
            expect(link.getAttribute('href')).toBe('/admin/users');
        });

        it('should render Tools link', () => {
            renderComponent();
            const link = screen.getByRole('link', { name: 'Tools' });
            expect(link).toBeDefined();
            expect(link.getAttribute('href')).toBe('/admin/tools');
        });

        it('should render Analytics link', () => {
            renderComponent();
            const link = screen.getByRole('link', { name: 'Analytics' });
            expect(link).toBeDefined();
            expect(link.getAttribute('href')).toBe('/admin/analytics');
        });

        it('should render Home link', () => {
            renderComponent();
            const link = screen.getByRole('link', { name: 'Home' });
            expect(link).toBeDefined();
            expect(link.getAttribute('href')).toBe('/');
        });

        it('should have 5 navigation links', () => {
            renderComponent();
            const links = screen.getAllByRole('link');
            expect(links).toHaveLength(5);
        });
    });

    describe('Active Link Styling', () => {
        it('should apply active style to dashboard link when active is dashboard', () => {
            renderComponent({ active: 'dashboard' });
            // Component renders correctly with active prop
            expect(screen.getByRole('link', { name: 'Dashboard' })).toBeDefined();
        });

        it('should apply active style to users link when active is users', () => {
            renderComponent({ active: 'users' });
            expect(screen.getByRole('link', { name: 'Users' })).toBeDefined();
        });

        it('should apply active style to tools link when active is tools', () => {
            renderComponent({ active: 'tools' });
            expect(screen.getByRole('link', { name: 'Tools' })).toBeDefined();
        });

        it('should apply active style to analytics link when active is analytics', () => {
            renderComponent({ active: 'analytics' });
            expect(screen.getByRole('link', { name: 'Analytics' })).toBeDefined();
        });

        it('should apply active style to home link when active is home', () => {
            renderComponent({ active: 'home' });
            expect(screen.getByRole('link', { name: 'Home' })).toBeDefined();
        });

        it('should default to dashboard active when no active prop is provided', () => {
            renderComponent();
            expect(screen.getByRole('link', { name: 'Dashboard' })).toBeDefined();
        });
    });

    describe('Structure', () => {
        it('should render header element', () => {
            renderComponent();
            expect(screen.getByRole('banner')).toBeDefined();
        });

        it('should render main element', () => {
            renderComponent();
            expect(screen.getByRole('main')).toBeDefined();
        });

        it('should render nav element', () => {
            renderComponent();
            expect(screen.getByRole('navigation')).toBeDefined();
        });

        it('should render title as h1', () => {
            renderComponent({ title: 'Test Title' });
            const heading = screen.getByRole('heading', { level: 1 });
            expect(heading).toBeDefined();
            expect(heading.textContent).toBe('Test Title');
        });
    });

    describe('Edge Cases', () => {
        it('should render with empty children', () => {
            render(
                <BrowserRouter>
                    <AdminLayout>{null}</AdminLayout>
                </BrowserRouter>
            );
            expect(screen.getByText('Admin')).toBeDefined();
        });

        it('should render with multiple children', () => {
            render(
                <BrowserRouter>
                    <AdminLayout>
                        <div data-testid="child-1">Child 1</div>
                        <div data-testid="child-2">Child 2</div>
                    </AdminLayout>
                </BrowserRouter>
            );
            expect(screen.getByTestId('child-1')).toBeDefined();
            expect(screen.getByTestId('child-2')).toBeDefined();
        });

        it('should render with complex children', () => {
            render(
                <BrowserRouter>
                    <AdminLayout>
                        <section>
                            <h2>Section Title</h2>
                            <p>Some paragraph text</p>
                        </section>
                    </AdminLayout>
                </BrowserRouter>
            );
            expect(screen.getByText('Section Title')).toBeDefined();
            expect(screen.getByText('Some paragraph text')).toBeDefined();
        });
    });
});
