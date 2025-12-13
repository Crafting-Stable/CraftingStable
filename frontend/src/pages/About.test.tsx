import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AboutPage from './About';
import { BrowserRouter } from 'react-router-dom';

// Mock Header component
vi.mock('../components/Header', () => ({
  default: () => <header data-testid="mock-header">Header</header>,
}));

describe('AboutPage', () => {
  const renderAboutPage = () => {
    return render(
      <BrowserRouter>
        <AboutPage />
      </BrowserRouter>
    );
  };

  it('should render the page', () => {
    renderAboutPage();
    expect(screen.getByTestId('mock-header')).toBeDefined();
  });

  it('should display team members', () => {
    renderAboutPage();

    expect(screen.getByText('Filipe Sousa')).toBeDefined();
    expect(screen.getByText('Daniel Simbe')).toBeDefined();
    expect(screen.getByText('Gonçalo Calvo')).toBeDefined();
  });

  it('should display team member roles', () => {
    renderAboutPage();

    expect(screen.getByText('Team Leader && DevOps Master')).toBeDefined();
    expect(screen.getByText('Product Owner')).toBeDefined();
    expect(screen.getByText('QA Engineer')).toBeDefined();
  });

  it('should display contributor avatars', () => {
    renderAboutPage();

    const avatars = screen.getAllByRole('img');
    expect(avatars.length).toBe(3);

    expect(avatars[0].getAttribute('src')).toContain('FilipePinaSousa');
    expect(avatars[1].getAttribute('src')).toContain('dani1244');
    expect(avatars[2].getAttribute('src')).toContain('Goncasgamer20');
  });

  it('should render three contributor cards', () => {
    renderAboutPage();

    const cards = screen.getAllByRole('img');
    expect(cards).toHaveLength(3);
  });
});
