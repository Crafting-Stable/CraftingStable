import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingScreen from './LoadingScreen';

describe('LoadingScreen', () => {
    it('should render SVG element', () => {
        render(<LoadingScreen />);
        const svg = document.querySelector('svg');
        expect(svg).toBeDefined();
        expect(svg).not.toBeNull();
    });

    it('should have correct SVG dimensions', () => {
        render(<LoadingScreen />);
        const svg = document.querySelector('svg');
        expect(svg?.getAttribute('width')).toBe('340');
        expect(svg?.getAttribute('height')).toBe('340');
    });

    it('should have correct viewBox', () => {
        render(<LoadingScreen />);
        const svg = document.querySelector('svg');
        expect(svg?.getAttribute('viewBox')).toBe('0 0 340 340');
    });

    it('should have role="img" for accessibility', () => {
        render(<LoadingScreen />);
        const svg = screen.getByRole('img');
        expect(svg).toBeDefined();
    });

    it('should have aria-label for accessibility', () => {
        render(<LoadingScreen />);
        const svg = screen.getByLabelText('Loading');
        expect(svg).toBeDefined();
    });

    describe('Gear Elements', () => {
        it('should render outer gear path', () => {
            render(<LoadingScreen />);
            const outerGear = document.querySelector('.e-outer');
            expect(outerGear).not.toBeNull();
        });

        it('should render middle gear path', () => {
            render(<LoadingScreen />);
            const midGear = document.querySelector('.e-mid');
            expect(midGear).not.toBeNull();
        });

        it('should have correct fill color for gears', () => {
            render(<LoadingScreen />);
            const outerGear = document.querySelector('.e-outer');
            const midGear = document.querySelector('.e-mid');
            expect(outerGear?.getAttribute('fill')).toBe('#A58337');
            expect(midGear?.getAttribute('fill')).toBe('#A58337');
        });
    });

    describe('Inner Ellipses', () => {
        it('should render first inner ellipse', () => {
            render(<LoadingScreen />);
            const ellipse = document.querySelector('.e-in-out');
            expect(ellipse).not.toBeNull();
        });

        it('should render second inner ellipse', () => {
            render(<LoadingScreen />);
            const ellipse = document.querySelector('.e-in-mid');
            expect(ellipse).not.toBeNull();
        });

        it('should render third inner ellipse', () => {
            render(<LoadingScreen />);
            const ellipse = document.querySelector('.e-in-in');
            expect(ellipse).not.toBeNull();
        });

        it('should have correct center for rotating ellipses', () => {
            render(<LoadingScreen />);
            const ellipse = document.querySelector('.e-in-out');
            expect(ellipse?.getAttribute('cx')).toBe('170');
            expect(ellipse?.getAttribute('cy')).toBe('170');
        });
    });

    describe('Static Ellipses', () => {
        it('should render static ellipses', () => {
            render(<LoadingScreen />);
            const staticEllipses = document.querySelectorAll('.static');
            expect(staticEllipses.length).toBe(5);
        });

        it('should have different cy positions for static ellipses', () => {
            render(<LoadingScreen />);
            const staticEllipses = document.querySelectorAll('.static');
            const cyValues = Array.from(staticEllipses).map(e => e.getAttribute('cy'));
            expect(cyValues).toContain('100');
            expect(cyValues).toContain('135');
            expect(cyValues).toContain('170');
            expect(cyValues).toContain('205');
            expect(cyValues).toContain('240');
        });

        it('should have stroke color #A5833B for static ellipses', () => {
            render(<LoadingScreen />);
            const staticEllipses = document.querySelectorAll('.static');
            staticEllipses.forEach(ellipse => {
                expect(ellipse.getAttribute('style')).toContain('#A5833B');
            });
        });
    });

    describe('Component Structure', () => {
        it('should render as functional component', () => {
            const { container } = render(<LoadingScreen />);
            expect(container.firstChild?.nodeName.toLowerCase()).toBe('svg');
        });

        it('should contain path elements for gears', () => {
            render(<LoadingScreen />);
            const paths = document.querySelectorAll('path');
            expect(paths.length).toBeGreaterThanOrEqual(2);
        });

        it('should contain ellipse elements', () => {
            render(<LoadingScreen />);
            const ellipses = document.querySelectorAll('ellipse');
            expect(ellipses.length).toBeGreaterThanOrEqual(8);
        });
    });
});
