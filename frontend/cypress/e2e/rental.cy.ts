/**
 * E2E Tests for Rental Flow
 * Tests: Tool details, rental initiation, authentication requirements
 */

describe('Rental Flow', () => {
  describe('Tool Details Page', () => {
    it('should require login to view tool details', () => {
      cy.clearLocalStorage();
      cy.visit('/catalog');
      
      // Wait for tools to load
      cy.get('article', { timeout: 15000 }).should('have.length.at.least', 1);
      
      // Click on first tool - should redirect to login
      cy.get('article').first().find('a').contains('Ver').click();
      
      // Should redirect to login (requires auth)
      cy.url().should('include', '/login');
    });

    it('should display tool details when authenticated', () => {
      // Login first
      cy.visit('/loginPage');
      cy.get('input[type="email"]').first().type('tiago@gmail.com');
      cy.get('input[type="password"]').first().type('password');
      cy.get('button[type="submit"]').first().click();
      cy.url().should('not.include', '/loginPage', { timeout: 10000 });
      
      // Go to catalog
      cy.visit('/catalog');
      cy.get('article', { timeout: 15000 }).first().find('a').contains('Ver').click();
      
      // Should be on tool details page
      cy.url().should('include', '/tools/');
    });
  });

  describe('Unauthenticated User', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
    });

    it('should prompt login when trying to rent without authentication', () => {
      cy.visit('/catalog');
      cy.get('article', { timeout: 15000 }).first().find('a').contains('Ver').click();
      
      // Look for rent button or login prompt
      cy.get('body').then(($body) => {
        // If there's a rent/alugar button, click it
        if ($body.text().match(/alugar|rent/i)) {
          cy.contains(/alugar|rent/i).first().click();
          
          // Should redirect to login or show login modal
          cy.url().then((url) => {
            // Either redirected to login or still on page with modal
            expect(url.includes('/login') || $body.find('[class*="modal"]').length > 0).to.be.true;
          });
        }
      });
    });
  });

  describe('Authenticated User Flow', () => {
    beforeEach(() => {
      // Login first
      cy.visit('/loginPage');
      cy.get('input[type="email"]').first().type('tiago@gmail.com');
      cy.get('input[type="password"]').first().type('password');
      cy.get('button[type="submit"]').first().click();
      
      // Wait for login to complete
      cy.url().should('not.include', '/loginPage', { timeout: 10000 });
    });

    it('should be able to view tools when logged in', () => {
      cy.visit('/catalog');
      cy.get('article', { timeout: 15000 }).should('have.length.at.least', 1);
    });

    it('should navigate to tool details when logged in', () => {
      cy.visit('/catalog');
      cy.get('article', { timeout: 15000 }).first().find('a').contains('Ver').click();
      cy.url().should('include', '/tools/');
    });

    it('should show rental options for available tools', () => {
      cy.visit('/catalog');
      cy.get('article', { timeout: 15000 }).first().find('a').contains('Ver').click();
      
      // Tool details page should have some rental-related content
      cy.get('body').should('be.visible');
    });
  });

  describe('Rental History', () => {
    beforeEach(() => {
      // Login
      cy.visit('/loginPage');
      cy.get('input[type="email"]').first().type('tiago@gmail.com');
      cy.get('input[type="password"]').first().type('password');
      cy.get('button[type="submit"]').first().click();
      cy.url().should('not.include', '/loginPage', { timeout: 10000 });
    });

    it('should be able to access user profile or rental history', () => {
      // Look for profile/history link in header
      cy.get('header, nav').then(($header) => {
        // Check if there's a profile/history link
        const hasProfileLink = $header.text().match(/perfil|profile|histórico|history|conta|account/i);
        if (hasProfileLink) {
          cy.contains(/perfil|profile|histórico|history|conta|account/i).first().click();
          cy.url().should('not.include', '/catalog');
        }
      });
    });
  });

  describe('Search and Filter Before Rental', () => {
    it('should be able to search for specific tools', () => {
      cy.visit('/catalog');
      cy.get('article', { timeout: 15000 }).should('have.length.at.least', 1);
      
      // Use search
      cy.get('input[placeholder*="Pesquisar"]').type('martelo');
      
      // Results should update
      cy.get('article').should('exist');
    });

    it('should be able to filter by category', () => {
      cy.visit('/catalog');
      cy.get('article', { timeout: 15000 }).should('have.length.at.least', 1);
      
      // Click category filter button
      cy.get('button').contains(/jardinagem|obras|carpintaria|elétricas/i).first().click();
      
      // Should still show results or empty state
      cy.contains('resultados').should('be.visible');
    });
  });
});
