import { describe, it, expect } from 'vitest';
import { adminStyles } from './adminStyles';

describe('adminStyles', () => {
    describe('container style', () => {
        it('should have minHeight of 100vh', () => {
            expect(adminStyles.container.minHeight).toBe('100vh');
        });

        it('should have correct backgroundColor', () => {
            expect(adminStyles.container.backgroundColor).toBe('#f5f5f5');
        });

        it('should have correct fontFamily', () => {
            expect(adminStyles.container.fontFamily).toBe('Inter, Arial, sans-serif');
        });
    });

    describe('header style', () => {
        it('should have correct backgroundColor', () => {
            expect(adminStyles.header.backgroundColor).toBe('#1976d2');
        });

        it('should have white color', () => {
            expect(adminStyles.header.color).toBe('white');
        });

        it('should have correct padding', () => {
            expect(adminStyles.header.padding).toBe('20px 40px');
        });

        it('should have flex display', () => {
            expect(adminStyles.header.display).toBe('flex');
        });

        it('should have space-between justifyContent', () => {
            expect(adminStyles.header.justifyContent).toBe('space-between');
        });

        it('should have center alignItems', () => {
            expect(adminStyles.header.alignItems).toBe('center');
        });

        it('should have boxShadow', () => {
            expect(adminStyles.header.boxShadow).toBe('0 2px 4px rgba(0,0,0,0.1)');
        });
    });

    describe('title style', () => {
        it('should have margin 0', () => {
            expect(adminStyles.title.margin).toBe(0);
        });

        it('should have correct fontSize', () => {
            expect(adminStyles.title.fontSize).toBe('28px');
        });

        it('should have bold fontWeight', () => {
            expect(adminStyles.title.fontWeight).toBe('bold');
        });
    });

    describe('nav style', () => {
        it('should have flex display', () => {
            expect(adminStyles.nav.display).toBe('flex');
        });

        it('should have correct gap', () => {
            expect(adminStyles.nav.gap).toBe('20px');
        });
    });

    describe('navLink style', () => {
        it('should have white color', () => {
            expect(adminStyles.navLink.color).toBe('white');
        });

        it('should have no textDecoration', () => {
            expect(adminStyles.navLink.textDecoration).toBe('none');
        });

        it('should have correct fontSize', () => {
            expect(adminStyles.navLink.fontSize).toBe('16px');
        });

        it('should have correct padding', () => {
            expect(adminStyles.navLink.padding).toBe('8px 16px');
        });

        it('should have correct borderRadius', () => {
            expect(adminStyles.navLink.borderRadius).toBe('4px');
        });

        it('should have transition', () => {
            expect(adminStyles.navLink.transition).toBe('background-color 0.3s');
        });
    });

    describe('navLinkActive style', () => {
        it('should have semi-transparent white background', () => {
            expect(adminStyles.navLinkActive.backgroundColor).toBe('rgba(255,255,255,0.12)');
        });
    });

    describe('content style', () => {
        it('should have correct maxWidth', () => {
            expect(adminStyles.content.maxWidth).toBe('1400px');
        });

        it('should have auto horizontal margin', () => {
            expect(adminStyles.content.margin).toBe('0 auto');
        });

        it('should have correct padding', () => {
            expect(adminStyles.content.padding).toBe('40px 20px');
        });
    });

    describe('loading style', () => {
        it('should have flex display', () => {
            expect(adminStyles.loading.display).toBe('flex');
        });

        it('should have center justifyContent', () => {
            expect(adminStyles.loading.justifyContent).toBe('center');
        });

        it('should have center alignItems', () => {
            expect(adminStyles.loading.alignItems).toBe('center');
        });

        it('should have minHeight of 100vh', () => {
            expect(adminStyles.loading.minHeight).toBe('100vh');
        });

        it('should have correct fontSize', () => {
            expect(adminStyles.loading.fontSize).toBe('24px');
        });

        it('should have correct color', () => {
            expect(adminStyles.loading.color).toBe('#666');
        });
    });

    describe('error style', () => {
        it('should have flex display', () => {
            expect(adminStyles.error.display).toBe('flex');
        });

        it('should have center justifyContent', () => {
            expect(adminStyles.error.justifyContent).toBe('center');
        });

        it('should have center alignItems', () => {
            expect(adminStyles.error.alignItems).toBe('center');
        });

        it('should have minHeight of 100vh', () => {
            expect(adminStyles.error.minHeight).toBe('100vh');
        });

        it('should have correct fontSize', () => {
            expect(adminStyles.error.fontSize).toBe('20px');
        });

        it('should have red color', () => {
            expect(adminStyles.error.color).toBe('#f44336');
        });
    });

    describe('sectionTitle style', () => {
        it('should have correct margin', () => {
            expect(adminStyles.sectionTitle.margin).toBe('0 0 16px 0');
        });

        it('should have correct fontSize', () => {
            expect(adminStyles.sectionTitle.fontSize).toBe('24px');
        });

        it('should have bold fontWeight', () => {
            expect(adminStyles.sectionTitle.fontWeight).toBe('bold');
        });

        it('should have correct color', () => {
            expect(adminStyles.sectionTitle.color).toBe('#333');
        });
    });

    describe('statCard style', () => {
        it('should have white background', () => {
            expect(adminStyles.statCard.backgroundColor).toBe('white');
        });

        it('should have correct padding', () => {
            expect(adminStyles.statCard.padding).toBe('24px');
        });

        it('should have correct borderRadius', () => {
            expect(adminStyles.statCard.borderRadius).toBe('8px');
        });

        it('should have boxShadow', () => {
            expect(adminStyles.statCard.boxShadow).toBe('0 2px 8px rgba(0,0,0,0.1)');
        });
    });

    describe('Style Object Structure', () => {
        it('should export adminStyles as an object', () => {
            expect(typeof adminStyles).toBe('object');
        });

        it('should contain all expected keys', () => {
            const expectedKeys = [
                'container',
                'header',
                'title',
                'nav',
                'navLink',
                'navLinkActive',
                'content',
                'loading',
                'error',
                'sectionTitle',
                'statCard',
            ];
            expectedKeys.forEach(key => {
                expect(adminStyles).toHaveProperty(key);
            });
        });
    });
});
