declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Command to login via API and store JWT token
       * @example cy.login('user@example.com', 'password')
       */
      login(email: string, password: string): Chainable<void>;

      /**
       * Command to login via UI form
       * @example cy.loginViaUI('user@example.com', 'password')
       */
      loginViaUI(email: string, password: string): Chainable<void>;

      /**
       * Command to logout and clear session
       * @example cy.logout()
       */
      logout(): Chainable<void>;

      /**
       * Command to get element by data-testid attribute
       * @example cy.getByTestId('submit-button')
       */
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Command to check if user is authenticated
       * @example cy.isAuthenticated()
       */
      isAuthenticated(): Chainable<boolean>;
    }
  }
}

// Login via API
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: { email, password },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200 && response.body.token) {
      // Store token and user info in localStorage
      window.localStorage.setItem('jwt', response.body.token);
      window.localStorage.setItem('user', JSON.stringify({
        username: response.body.name || response.body.username,
        email: response.body.email || email,
        role: response.body.role,
        id: response.body.id || response.body.userId,
      }));
      // Trigger auth change event
      cy.window().then((win) => {
        win.dispatchEvent(new Event('authChanged'));
      });
    } else {
      throw new Error(`Login failed: ${response.status} - ${JSON.stringify(response.body)}`);
    }
  });
});

// Login via UI (useful for testing the login form itself)
Cypress.Commands.add('loginViaUI', (email: string, password: string) => {
  cy.visit('/loginPage');
  cy.get('input[type="email"]').first().clear().type(email);
  cy.get('input[type="password"]').first().clear().type(password);
  cy.get('button[type="submit"]').first().click();
  // Wait for navigation after successful login
  cy.url().should('not.include', '/loginPage');
});

// Logout command
Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('jwt');
  window.localStorage.removeItem('user');
  cy.window().then((win) => {
    win.dispatchEvent(new Event('authChanged'));
  });
});

// Get element by data-testid
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

// Check if user is authenticated
Cypress.Commands.add('isAuthenticated', () => {
  return cy.window().then((win) => {
    const token = win.localStorage.getItem('jwt');
    return !!token;
  });
});

export {};
