import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NotFoundPage from './NotFoundPage';
import { BrowserRouter } from 'react-router-dom';

describe('NotFoundPage', () => {
  it('should render 404 error message', () => {
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );
    expect(screen.getByText(/404/i)).toBeDefined();
  });

  it('should have a link to go home', () => {
    render(
      <BrowserRouter>
        <NotFoundPage />
      </BrowserRouter>
    );
    const homeLink = screen.getByRole('link', { name: /go home/i });
    expect(homeLink).toBeDefined();
  });
});
