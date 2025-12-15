/**
 * Catalog and Tool Search E2E Tests
 * 
 * Tests the tool catalog page functionality including:
 * - Displaying tools from API
 * - Search and filtering
 * - Navigation to tool details
 */

describe('Tool Catalog and Search', () => {
  beforeEach(() => {
    // Visit catalog page before each test
    cy.visit('/catalog');
  });

  describe('Catalog Page Display', () => {
    it('should display the catalog page with header', () => {
      // Check page loads with main elements
      cy.contains('Promoções e Ofertas').should('be.visible');
      cy.get('input[placeholder*="Pesquisar"]').should('be.visible');
    });

    it('should display tools from the database', () => {
      // Wait for tools to load (article elements)
      cy.get('article', { timeout: 15000 }).should('have.length.at.least', 1);
    });

    it('should display tool cards with name and price', () => {
      cy.get('article', { timeout: 15000 }).first().within(() => {
        // Each card should have price with €/dia
        cy.contains('€').should('be.visible');
        cy.contains('/dia').should('be.visible');
      });
    });

    it('should show results count', () => {
      cy.contains('resultados').should('be.visible');
    });
  });

  describe('Search Functionality', () => {
    it('should filter tools when searching by name', () => {
      // Wait for initial load
      cy.get('article', { timeout: 15000 }).should('have.length.at.least', 1);
      
      // Type a search term
      cy.get('input[placeholder*="Pesquisar"]').type('a');
      
      // Results should update
      cy.get('article').should('exist');
    });

    it('should show no results for non-matching search', () => {
      cy.get('article', { timeout: 15000 }).should('have.length.at.least', 1);
      
      // Search for something that won't exist
      cy.get('input[placeholder*="Pesquisar"]').type('xyznonexistent123');
      
      // Should show 0 results
      cy.contains('0 resultados').should('be.visible');
    });

    it('should clear search and show all tools again', () => {
      cy.get('article', { timeout: 15000 }).should('have.length.at.least', 1);
      
      // Search
      cy.get('input[placeholder*="Pesquisar"]').type('test');
      
      // Clear search
      cy.get('input[placeholder*="Pesquisar"]').clear();
      
      // Should show tools again
      cy.get('article').should('have.length.at.least', 1);
    });
  });

  describe('Category Filters', () => {
    it('should have category filter buttons', () => {
      // Check for quick filter buttons
      cy.contains('button', 'Ver tudo').should('be.visible');
    });

    it('should have sort options', () => {
      cy.contains('option', 'Relevância').should('exist');
      cy.contains('option', 'Preço ↑').should('exist');
      cy.contains('option', 'Preço ↓').should('exist');
    });

    it('should sort tools by price ascending', () => {
      cy.get('article', { timeout: 15000 }).should('have.length.at.least', 1);
      
      // Find sort dropdown (last select) and select price ascending
      cy.get('select').last().select('price-asc');
      
      // Tools should still be visible
      cy.get('article').should('have.length.at.least', 1);
    });
  });

  describe('Tool Navigation', () => {
    it('should redirect to login when clicking "Ver" link without authentication', () => {
      cy.get('article', { timeout: 15000 }).should('have.length.at.least', 1);
      
      // Click the "Ver" link on first tool
      cy.get('article').first().find('a').contains('Ver').click();
      
      // Should redirect to login page (requires auth)
      cy.url().should('include', '/login');
    });

    it('should navigate to tool details when authenticated', () => {
      // Login first
      cy.visit('/loginPage');
      cy.get('input[type="email"]').first().type('tiago@gmail.com');
      cy.get('input[type="password"]').first().type('password');
      cy.get('button[type="submit"]').first().click();
      
      // Wait for redirect after login
      cy.url().should('not.include', '/loginPage', { timeout: 10000 });
      
      // Go to catalog
      cy.visit('/catalog');
      cy.get('article', { timeout: 15000 }).first().find('a').contains('Ver').click();
      
      // Should be on tool details
      cy.url().should('include', '/tools/');
    });
  });

  describe('Responsive Behavior', () => {
    it('should display tools in grid layout', () => {
      cy.get('article', { timeout: 15000 }).should('have.length.at.least', 1);
      
      // Grid should have proper display
      cy.get('article').parent().should('have.css', 'display', 'grid');
    });
  });
});
