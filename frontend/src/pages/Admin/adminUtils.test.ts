import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiUrl, getJwt, handleAuthError } from './adminUtils';

describe('adminUtils', () => {

    describe('apiUrl (Relative Path)', () => {
        it('should return /api/path when path starts with /', () => {
            const result = apiUrl('/test');
            expect(result).toBe('/api/test');
        });

        it('should return /api/path when path does not start with /', () => {
            const result = apiUrl('test');
            expect(result).toBe('/api/test');
        });

        it('should handle nested paths', () => {
            const result = apiUrl('/rents/123/details');
            expect(result).toBe('/api/rents/123/details');
        });

        it('should not add /api if path already starts with /api', () => {
            const result = apiUrl('/api/tools');
            expect(result).toBe('/api/tools');
        });

        it('should handle empty path', () => {
            const result = apiUrl('');
            expect(result).toBe('/api/');
        });
    });

    describe('getJwt', () => {
        const originalLocalStorage = globalThis.localStorage;

        beforeEach(() => {
            // Mock localStorage
            const store: Record<string, string> = {};
            Object.defineProperty(globalThis, 'localStorage', {
                value: {
                    getItem: vi.fn((key: string) => store[key] || null),
                    setItem: vi.fn((key: string, value: string) => {
                        store[key] = value;
                    }),
                    removeItem: vi.fn((key: string) => {
                        delete store[key];
                    }),
                    clear: vi.fn(() => {
                        Object.keys(store).forEach(key => delete store[key]);
                    }),
                },
                writable: true,
            });
        });

        afterEach(() => {
            Object.defineProperty(globalThis, 'localStorage', {
                value: originalLocalStorage,
                writable: true,
            });
        });

        it('should return jwt from localStorage', () => {
            (globalThis.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('test-jwt-token');

            const result = getJwt();

            expect(result).toBe('test-jwt-token');
            expect(globalThis.localStorage.getItem).toHaveBeenCalledWith('jwt');
        });

        it('should return null when jwt is not in localStorage', () => {
            (globalThis.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

            const result = getJwt();

            expect(result).toBeNull();
        });

        it('should return null when localStorage throws an error', () => {
            Object.defineProperty(globalThis, 'localStorage', {
                value: {
                    getItem: vi.fn(() => {
                        throw new Error('localStorage not available');
                    }),
                },
                writable: true,
            });

            const result = getJwt();
            expect(result).toBeNull();
        });

        it('should return null when localStorage is undefined', () => {
            Object.defineProperty(globalThis, 'localStorage', {
                value: undefined,
                writable: true,
            });

            const result = getJwt();
            expect(result).toBeNull();
        });
    });

    describe('handleAuthError', () => {
        const originalLocalStorage = globalThis.localStorage;
        let mockNavigate: ReturnType<typeof vi.fn>;
        let mockSetError: ReturnType<typeof vi.fn>;

        beforeEach(() => {
            vi.useFakeTimers();
            mockNavigate = vi.fn();
            mockSetError = vi.fn();

            // Mock localStorage
            Object.defineProperty(globalThis, 'localStorage', {
                value: {
                    removeItem: vi.fn(),
                },
                writable: true,
            });
        });

        afterEach(() => {
            vi.useRealTimers();
            Object.defineProperty(globalThis, 'localStorage', {
                value: originalLocalStorage,
                writable: true,
            });
        });

        it('should handle 401 status - remove tokens and set error', () => {
            const result = handleAuthError(401, undefined, mockNavigate, mockSetError);

            expect(result).toBe(true);
            expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('jwt');
            expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('user');
            expect(mockSetError).toHaveBeenCalledWith('Sessão expirada. Por favor faça login novamente.');
        });

        it('should handle 403 status - remove tokens and set error', () => {
            const result = handleAuthError(403, undefined, mockNavigate, mockSetError);

            expect(result).toBe(true);
            expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('jwt');
            expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('user');
            expect(mockSetError).toHaveBeenCalledWith('Sessão expirada. Por favor faça login novamente.');
        });

        it('should navigate to login after delay on 401', () => {
            handleAuthError(401, undefined, mockNavigate, mockSetError);

            expect(mockNavigate).not.toHaveBeenCalled();

            vi.advanceTimersByTime(900);

            expect(mockNavigate).toHaveBeenCalledWith('/loginPage');
        });

        it('should navigate to login after delay on 403', () => {
            handleAuthError(403, undefined, mockNavigate, mockSetError);

            vi.advanceTimersByTime(900);

            expect(mockNavigate).toHaveBeenCalledWith('/loginPage');
        });

        it('should return false for non-auth errors', () => {
            const result = handleAuthError(500, 'Internal Server Error', mockNavigate, mockSetError);

            expect(result).toBe(false);
            expect(globalThis.localStorage.removeItem).not.toHaveBeenCalled();
        });

        it('should set error message from statusText for non-auth errors', () => {
            handleAuthError(500, 'Internal Server Error', mockNavigate, mockSetError);

            expect(mockSetError).toHaveBeenCalledWith('Internal Server Error');
        });

        it('should return false for 200 status', () => {
            const result = handleAuthError(200, undefined, mockNavigate, mockSetError);

            expect(result).toBe(false);
        });

        it('should work without navigate function', () => {
            const result = handleAuthError(401, undefined, undefined, mockSetError);

            expect(result).toBe(true);
            expect(mockSetError).toHaveBeenCalledWith('Sessão expirada. Por favor faça login novamente.');

            vi.advanceTimersByTime(900);
            // Should not throw even without navigate
        });

        it('should work without setError function', () => {
            const result = handleAuthError(401, undefined, mockNavigate, undefined);

            expect(result).toBe(true);
            expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('jwt');
        });

        it('should work without any callback functions', () => {
            const result = handleAuthError(401);

            expect(result).toBe(true);
            expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('jwt');
        });

        it('should handle undefined status', () => {
            const result = handleAuthError(undefined, 'Some error', mockNavigate, mockSetError);

            expect(result).toBe(false);
            expect(mockSetError).toHaveBeenCalledWith('Some error');
        });

        it('should not set error when statusText is undefined for non-auth errors', () => {
            const result = handleAuthError(404, undefined, mockNavigate, mockSetError);

            expect(result).toBe(false);
            expect(mockSetError).not.toHaveBeenCalled();
        });

        it('should handle localStorage error gracefully', () => {
            Object.defineProperty(globalThis, 'localStorage', {
                value: {
                    removeItem: vi.fn(() => {
                        throw new Error('Storage error');
                    }),
                },
                writable: true,
            });

            // Should not throw
            const result = handleAuthError(401, undefined, mockNavigate, mockSetError);
            expect(result).toBe(true);
        });
    });
});