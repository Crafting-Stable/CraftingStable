Feature: Authentication and User Management
  As a user
  I want to authenticate and manage my account
  So that I can access the application securely

  Background:
    Given the application is running
    And the database is clean

  Scenario: User login with valid credentials
    Given a user exists with email "user@example.com" and password "password123"
    When the user logs in with email "user@example.com" and password "password123"
    Then the login response status is 200
    And the response contains a valid JWT token

  Scenario: User login with invalid credentials
    Given a user exists with email "user@example.com" and password "password123"
    When the user logs in with email "user@example.com" and password "wrongpassword"
    Then the login response status is 401

  Scenario: User login with non-existent email
    When the user logs in with email "nonexistent@example.com" and password "password123"
    Then the login response status is 401

  Scenario: User registration with valid credentials
    When the user registers with email "newuser@example.com" password "password123" and role "CUSTOMER"
    Then the registration response status is 201
    And the user is created in the system with email "newuser@example.com"

  Scenario: User registration with existing email
    Given a user exists with email "user@example.com" and password "password123"
    When the user registers with email "user@example.com" password "password123" and role "CUSTOMER"
    Then the registration response status is 400

  Scenario: Get authenticated user details
    Given a user exists with email "user@example.com" and password "password123"
    And the user is logged in with email "user@example.com"
    When the user requests their own details
    Then the response status is 200
    And the response contains the user email "user@example.com"

  Scenario: Access protected endpoint without authentication
    When an unauthenticated request is made to GET "/api/users"
    Then the response status is 403
