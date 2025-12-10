Feature: User Management
  As an admin
  I want to manage users
  So that I can control user access and roles

  Background:
    Given the application is running
    And the database is clean

  Scenario: Get all users
    Given users exist in the system:
      | email | role |
      | user1@example.com | CUSTOMER |
      | user2@example.com | ADMIN |
    And a user is logged in as "ADMIN"
    When the admin requests to list all users
    Then the list response status is 200
    And the response contains 2 users

  Scenario: Get total user count
    Given users exist in the system:
      | email | role |
      | user1@example.com | CUSTOMER |
      | user2@example.com | ADMIN |
    And a user is logged in as "ADMIN"
    When the admin requests the total user count
    Then the count response status is 200
    And the total users count is 2

  Scenario: Create a new user
    Given a user is logged in as "ADMIN"
    When an admin creates a user with email "newuser@example.com"
    Then the create response status is 201
    And the user exists in the system with email "newuser@example.com"

  Scenario: Get user by ID
    Given a user exists with email "user@example.com"
    And a user is logged in as "ADMIN"
    When an admin requests to get the user by ID
    Then the get response status is 200
    And the response contains the user email "user@example.com"

  Scenario: Activate user
    Given a user exists with email "user@example.com" with active status false
    And a user is logged in as "ADMIN"
    When the admin activates the user
    Then the activate response status is 200
    And the user active status is true

  Scenario: Deactivate user
    Given a user exists with email "user@example.com" with active status true
    And a user is logged in as "ADMIN"
    When the admin deactivates the user
    Then the deactivate response status is 200
    And the user active status is false

  Scenario: Change user role
    Given a user exists with email "user@example.com" with role "CUSTOMER"
    And a user is logged in as "ADMIN"
    When the admin changes the user role to "ADMIN"
    Then the change response status is 200
    And the user role is "ADMIN"

  Scenario: Delete user
    Given a user exists with email "user@example.com"
    And a user is logged in as "ADMIN"
    When the admin deletes the user
    Then the delete response status is 200
    And the user is no longer in the system

  Scenario: Get admin statistics
    Given users and rentals exist in the system
    And a user is logged in as "ADMIN"
    When the admin requests statistics
    Then the stats response status is 200
    And the response contains tool counts

  Scenario: Get client statistics
    Given a user is logged in as "CLIENT" with email "client@example.com"
    And the user has rental history
    When the user requests their statistics
    Then the stats response status is 200
    And the response contains rental counts and expenses
