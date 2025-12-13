// Import code coverage support
import '@cypress/code-coverage/support';
import './commands';

// Hide fetch/XHR requests from command log (cleaner test output)
const app = window.top;
if (app && !app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.setAttribute('data-hide-command-log-request', '');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  app.document.head.appendChild(style);
}

// Global error handling
Cypress.on('uncaught:exception', (err) => {
  // Returning false here prevents Cypress from failing the test on uncaught exceptions
  // This is useful for third-party scripts (like PayPal SDK) that may throw errors
  if (err.message.includes('paypal') || err.message.includes('ResizeObserver')) {
    return false;
  }
  return true;
});
