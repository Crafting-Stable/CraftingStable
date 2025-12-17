import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';

// Mock all page components to isolate App routing tests
vi.mock('./pages/HomePage', () => ({
    default: () => <div data-testid="home-page">HomePage</div>,
}));
vi.mock('./pages/About', () => ({
    default: () => <div data-testid="about-page">About</div>,
}));
vi.mock('./pages/Catalog', () => ({
    default: () => <div data-testid="catalog-page">Catalog</div>,
}));
vi.mock('./pages/LoginPage', () => ({
    default: () => <div data-testid="login-page">LoginPage</div>,
}));
vi.mock('./pages/UserDetailsPage', () => ({
    default: () => <div data-testid="user-page">UserDetailsPage</div>,
}));
vi.mock('./pages/User/ToolDetails', () => ({
    default: () => <div data-testid="tool-details-page">ToolDetails</div>,
}));
vi.mock('./pages/User/AddRent', () => ({
    default: () => <div data-testid="add-rent-page">AddRent</div>,
}));
vi.mock('./pages/Admin/AdminDashboard', () => ({
    default: () => <div data-testid="admin-dashboard">AdminDashboard</div>,
}));
vi.mock('./pages/Admin/AdminUsers', () => ({
    default: () => <div data-testid="admin-users">AdminUsers</div>,
}));
vi.mock('./pages/Admin/AdminTools', () => ({
    default: () => <div data-testid="admin-tools">AdminTools</div>,
}));

vi.mock('./pages/Payment/PaymentSuccess', () => ({
    default: () => <div data-testid="payment-success">PaymentSuccess</div>,
}));
vi.mock('./pages/Payment/PaymentCancel', () => ({
    default: () => <div data-testid="payment-cancel">PaymentCancel</div>,
}));

// Import mocked components
import HomePage from './pages/HomePage';
import About from './pages/About';
import Catalog from './pages/Catalog';
import LoginPage from './pages/LoginPage';
import User from './pages/UserDetailsPage';
import ToolDetails from './pages/User/ToolDetails';
import AddRent from './pages/User/AddRent';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminTools from './pages/Admin/AdminTools';
import PaymentSuccess from './pages/Payment/PaymentSuccess';
import PaymentCancel from './pages/Payment/PaymentCancel';

// Test component that mirrors App routes but uses MemoryRouter
const TestApp = ({ initialEntries }: { initialEntries: string[] }) => (
    <MemoryRouter initialEntries={initialEntries}>
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/loginPage" element={<LoginPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/user" element={<User />} />
            <Route path="/tools/:id" element={<ToolDetails />} />
            <Route path="/user/add-rent" element={<AddRent />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/tools" element={<AdminTools />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </MemoryRouter>
);

describe('App', () => {
    describe('Route Rendering', () => {
        it('should render HomePage on root path', () => {
            render(<TestApp initialEntries={['/']} />);
            expect(screen.getByTestId('home-page')).toBeDefined();
        });

        it('should redirect /home to root path and render HomePage', () => {
            render(<TestApp initialEntries={['/home']} />);
            expect(screen.getByTestId('home-page')).toBeDefined();
        });

        it('should render Catalog on /catalog path', () => {
            render(<TestApp initialEntries={['/catalog']} />);
            expect(screen.getByTestId('catalog-page')).toBeDefined();
        });

        it('should render LoginPage on /loginPage path', () => {
            render(<TestApp initialEntries={['/loginPage']} />);
            expect(screen.getByTestId('login-page')).toBeDefined();
        });

        it('should render About on /about path', () => {
            render(<TestApp initialEntries={['/about']} />);
            expect(screen.getByTestId('about-page')).toBeDefined();
        });

        it('should render User page on /user path', () => {
            render(<TestApp initialEntries={['/user']} />);
            expect(screen.getByTestId('user-page')).toBeDefined();
        });

        it('should render ToolDetails on /tools/:id path', () => {
            render(<TestApp initialEntries={['/tools/123']} />);
            expect(screen.getByTestId('tool-details-page')).toBeDefined();
        });

        it('should render AddRent on /user/add-rent path', () => {
            render(<TestApp initialEntries={['/user/add-rent']} />);
            expect(screen.getByTestId('add-rent-page')).toBeDefined();
        });

        it('should render AdminDashboard on /admin path', () => {
            render(<TestApp initialEntries={['/admin']} />);
            expect(screen.getByTestId('admin-dashboard')).toBeDefined();
        });

        it('should render AdminUsers on /admin/users path', () => {
            render(<TestApp initialEntries={['/admin/users']} />);
            expect(screen.getByTestId('admin-users')).toBeDefined();
        });

        it('should render AdminTools on /admin/tools path', () => {
            render(<TestApp initialEntries={['/admin/tools']} />);
            expect(screen.getByTestId('admin-tools')).toBeDefined();
        });


        it('should render PaymentSuccess on /payment/success path', () => {
            render(<TestApp initialEntries={['/payment/success']} />);
            expect(screen.getByTestId('payment-success')).toBeDefined();
        });

        it('should render PaymentCancel on /payment/cancel path', () => {
            render(<TestApp initialEntries={['/payment/cancel']} />);
            expect(screen.getByTestId('payment-cancel')).toBeDefined();
        });

        it('should redirect unknown paths to HomePage', () => {
            render(<TestApp initialEntries={['/unknown-route']} />);
            expect(screen.getByTestId('home-page')).toBeDefined();
        });

        it('should redirect deeply nested unknown paths to HomePage', () => {
            render(<TestApp initialEntries={['/some/unknown/deep/path']} />);
            expect(screen.getByTestId('home-page')).toBeDefined();
        });
    });
});
