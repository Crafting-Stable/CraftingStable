import { describe, it, expect } from 'vitest';

describe('Frontend Utility Functions', () => {
  it('should format date correctly', () => {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    const testDate = new Date('2025-01-15');
    expect(formatDate(testDate)).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('should calculate rental duration in days', () => {
    const calculateDays = (start: Date, end: Date) => {
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    };

    const start = new Date('2025-01-15');
    const end = new Date('2025-01-20');
    expect(calculateDays(start, end)).toBe(5);
  });

  it('should format currency correctly', () => {
    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
    
    expect(formatCurrency(99.5)).toBe('$99.50');
    expect(formatCurrency(1000)).toBe('$1000.00');
  });

  it('should validate URL', () => {
    const isValidUrl = (url: string) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    expect(isValidUrl('http://localhost:8080')).toBe(true);
    expect(isValidUrl('invalid-url')).toBe(false);
  });

  it('should debounce function calls', (done) => {
    let callCount = 0;
    
    const debounce = (func: Function, delay: number) => {
      let timeoutId: any;
      return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
      };
    };

    const increment = () => callCount++;
    const debouncedIncrement = debounce(increment, 100);

    debouncedIncrement();
    debouncedIncrement();
    debouncedIncrement();

    setTimeout(() => {
      expect(callCount).toBe(1);
      done();
    }, 150);
  });

  it('should parse JSON safely', () => {
    const safeJsonParse = (jsonString: string) => {
      try {
        return JSON.parse(jsonString);
      } catch {
        return null;
      }
    };

    expect(safeJsonParse('{"name": "test"}')).toEqual({ name: 'test' });
    expect(safeJsonParse('invalid json')).toBeNull();
  });
});

describe('Data Transformation Tests', () => {
  it('should filter array of objects', () => {
    const tools = [
      { id: 1, name: 'Drill', status: 'AVAILABLE' },
      { id: 2, name: 'Saw', status: 'RENTED' },
      { id: 3, name: 'Hammer', status: 'AVAILABLE' }
    ];

    const available = tools.filter(t => t.status === 'AVAILABLE');
    expect(available).toHaveLength(2);
    expect(available[0].name).toBe('Drill');
  });

  it('should map and transform data', () => {
    const users = [
      { id: 1, firstName: 'John', lastName: 'Doe' },
      { id: 2, firstName: 'Jane', lastName: 'Smith' }
    ];

    const fullNames = users.map(u => `${u.firstName} ${u.lastName}`);
    expect(fullNames).toEqual(['John Doe', 'Jane Smith']);
  });

  it('should sort array by property', () => {
    const rentals = [
      { id: 3, startDate: '2025-01-20' },
      { id: 1, startDate: '2025-01-15' },
      { id: 2, startDate: '2025-01-18' }
    ];

    const sorted = rentals.sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    expect(sorted[0].id).toBe(1);
    expect(sorted[1].id).toBe(2);
    expect(sorted[2].id).toBe(3);
  });

  it('should group data by category', () => {
    const tools = [
      { name: 'Drill', type: 'Power Tools' },
      { name: 'Saw', type: 'Power Tools' },
      { name: 'Hammer', type: 'Hand Tools' }
    ];

    const grouped = tools.reduce((acc: any, tool) => {
      if (!acc[tool.type]) acc[tool.type] = [];
      acc[tool.type].push(tool);
      return acc;
    }, {});

    expect(Object.keys(grouped)).toContain('Power Tools');
    expect(grouped['Power Tools']).toHaveLength(2);
  });
});
