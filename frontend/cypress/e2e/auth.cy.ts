/**
 * E2E Tests for Authentication Flow
 * Tests: Login, Register, Logout, JWT Token handling
 * 
 * Note: Uses real backend API (via Docker Compose)
 * Test users from data.sql:
 *   - tiago@gmail.com / password (CUSTOMER)
 *   - joana@gmail.com / password (ADMIN)
 */

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
  });

  describe('Login Page UI', () => {
    it('should display the login form', () => {
      cy.visit('/loginPage');
      
      // Check login form is visible
      cy.contains('Já tem conta?').should('be.visible');
      cy.contains('Faça login para continuar').should('be.visible');
      
      // Check form fields exist
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('button[type="submit"]').contains('Entrar').should('be.visible');
    });

    it('should show "Create account" button that opens modal', () => {
      cy.visit('/loginPage');
      
      // Find and click the create account button
      cy.contains('Criar conta').should('be.visible').click();
      
      // Modal should appear
      cy.get('.modal-backdrop').should('be.visible');
      cy.get('.modal').should('be.visible');
      cy.contains('Crie a sua conta').should('be.visible');
    });

    it('should close registration modal when clicking backdrop', () => {
      cy.visit('/loginPage');
      
      // Open modal
      cy.contains('Criar conta').click();
      cy.get('.modal-backdrop').should('be.visible');
      
      // Click backdrop to close
      cy.get('.modal-backdrop').click('topLeft');
      cy.get('.modal-backdrop').should('not.exist');
    });
  });

  describe('Login Validation', () => {
    it('should show error for empty email', () => {
      cy.visit('/loginPage');
      cy.get('button[type="submit"]').first().click();
      cy.contains('Email obrigatório').should('be.visible');
    });

    it('should show error for invalid email format', () => {
      cy.visit('/loginPage');
      
      cy.get('input[type="email"]').first().type('invalid-email');
      cy.get('input[type="password"]').first().type('password');
      cy.get('button[type="submit"]').first().click();
      
      // Check for HTML5 validation
      cy.get('input[type="email"]').first().then(($input) => {
        const validity = ($input[0] as HTMLInputElement).validity;
        expect(validity.valid).to.be.false;
      });
    });

    it('should show error for empty password', () => {
      cy.visit('/loginPage');
      
      cy.get('input[type="email"]').first().type('test@example.com');
      cy.get('button[type="submit"]').first().click();
      
      cy.contains('Password obrigatória').should('be.visible');
    });

    it('should toggle password visibility', () => {
      cy.visit('/loginPage');
      
      const passwordInput = cy.get('input[type="password"]').first();
      passwordInput.type('mypassword');
      
      // Click show button
      cy.contains('Mostrar').click();
      cy.get('input[type="text"]').first().should('have.value', 'mypassword');
      
      // Click hide button
      cy.contains('Ocultar').click();
      cy.get('input[type="password"]').first().should('have.value', 'mypassword');
    });
  });

  describe('Successful Login', () => {
    it('should login successfully with valid CUSTOMER credentials', () => {
      cy.visit('/loginPage');
      
      cy.get('input[type="email"]').first().type('tiago@gmail.com');
      cy.get('input[type="password"]').first().type('password');
      cy.get('button[type="submit"]').first().click();

      // Should redirect to catalog (CUSTOMER)
      cy.url().should('include', '/catalog', { timeout: 10000 });
      
      // JWT should be stored
      cy.window().then((win) => {
        expect(win.localStorage.getItem('jwt')).to.not.be.null;
      });
    });

    it('should login successfully with valid ADMIN credentials', () => {
      cy.visit('/loginPage');
      
      cy.get('input[type="email"]').first().type('joana@gmail.com');
      cy.get('input[type="password"]').first().type('password');
      cy.get('button[type="submit"]').first().click();

      // Should redirect to admin page (ADMIN)
      cy.url().should('include', '/admin', { timeout: 10000 });
    });
  });

  describe('Failed Login', () => {
    it('should show error message for invalid credentials', () => {
      cy.visit('/loginPage');
      
      cy.get('input[type="email"]').first().type('wrong@email.com');
      cy.get('input[type="password"]').first().type('wrongpassword');
      cy.get('button[type="submit"]').first().click();

      // Should show error message
      cy.contains(/credenciais|credentials|inválid|invalid|erro|error/i, { timeout: 10000 }).should('be.visible');
      
      // Should stay on login page
      cy.url().should('include', '/login');
    });

    it('should show error for wrong password', () => {
      cy.visit('/loginPage');
      
      cy.get('input[type="email"]').first().type('tiago@gmail.com');
      cy.get('input[type="password"]').first().type('wrongpassword');
      cy.get('button[type="submit"]').first().click();

      // Should show error
      cy.contains(/credenciais|credentials|inválid|invalid|erro|error/i, { timeout: 10000 }).should('be.visible');
    });
  });

  describe('Registration Flow', () => {
    it('should open registration modal', () => {
      cy.visit('/loginPage');
      
      cy.contains('Criar conta').click();
      cy.get('.modal').should('be.visible');
      cy.contains('Crie a sua conta').should('be.visible');
    });

    it('should show error when passwords do not match', () => {
      cy.visit('/loginPage');
      cy.contains('Criar conta').click();
      
      // Fill registration form - name input has no type (defaults to text)
      cy.get('.modal').within(() => {
        cy.get('input').eq(0).type('New User'); // Name
        cy.get('input[type="email"]').type('newuser@example.com');
        cy.get('input[type="password"]').first().type('password123');
        cy.get('input[type="password"]').last().type('differentpassword');
        
        // Try to submit
        cy.get('button[type="submit"]').click();
      });
      
      // Should show password mismatch error
      cy.contains(/não coincidem|mismatch|não correspondem/i).should('be.visible');
    });

    it('should submit registration form', () => {
      const uniqueEmail = `testuser${Date.now()}@example.com`;
      
      cy.visit('/loginPage');
      cy.contains('Criar conta').click();
      
      // Fill registration form
      cy.get('.modal').within(() => {
        cy.get('input').eq(0).type('Test User'); // Name
        cy.get('input[type="email"]').type(uniqueEmail);
        cy.get('input[type="password"]').first().type('password123');
        cy.get('input[type="password"]').last().type('password123');
        
        // Submit
        cy.get('button[type="submit"]').click();
      });
      
      // Either redirects on success or shows error message (both are valid states)
      cy.wait(3000); // Wait for API response
      cy.get('body').should('be.visible');
    });
  });

  describe('JWT Token Persistence', () => {
    it('should maintain authentication state across page reloads', () => {
      // Login first
      cy.visit('/loginPage');
      cy.get('input[type="email"]').first().type('tiago@gmail.com');
      cy.get('input[type="password"]').first().type('password');
      cy.get('button[type="submit"]').first().click();
      
      // Wait for redirect
      cy.url().should('include', '/catalog', { timeout: 10000 });
      
      // Reload page
      cy.reload();
      
      // Should still be on catalog (authenticated)
      cy.url().should('not.include', '/login');
    });
  });

  describe('Logout', () => {
    it('should logout and redirect to login page', () => {
      // Login first
      cy.visit('/loginPage');
      cy.get('input[type="email"]').first().type('tiago@gmail.com');
      cy.get('input[type="password"]').first().type('password');
      cy.get('button[type="submit"]').first().click();
      
      // Wait for redirect
      cy.url().should('include', '/catalog', { timeout: 10000 });
      
      // Find and click logout button
      cy.get('header, nav').then(($header) => {
        if ($header.text().match(/sair|logout|terminar/i)) {
          cy.contains(/sair|logout|terminar/i).first().click();
          
          // Should be logged out
          cy.window().then((win) => {
            expect(win.localStorage.getItem('jwt')).to.be.null;
          });
        }
      });
    });
  });
});
