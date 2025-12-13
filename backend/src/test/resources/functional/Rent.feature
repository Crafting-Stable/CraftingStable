Feature: Rent Management
  As a client or tool owner
  I want to manage tool rentals
  So that I can rent tools or approve rental requests

  Background:
    Given the application is running
    And the database is clean

  Scenario: Create a rental request
    Given a tool exists with name "Drill" and status "AVAILABLE"
    And a user is logged in as "CUSTOMER" with email "client@example.com"
    When the user creates a rental request for the tool with dates:
      | startDate | endDate    |
      | 2025-12-15T10:00:00 | 2025-12-20T18:00:00 |
    Then the rental response status is 201
    And the rental status is "PENDING"

  Scenario: Create overlapping rental request (accepted)
    Given a tool exists with name "Drill" and status "AVAILABLE"
    And a rental exists for the tool with dates:
      | startDate | endDate    |
      | 2025-12-15T10:00:00 | 2025-12-20T18:00:00 |
    And a user is logged in as "CUSTOMER" with email "client2@example.com"
    When the user creates a rental request for the tool with dates:
      | startDate | endDate    |
      | 2025-12-18T10:00:00 | 2025-12-22T18:00:00 |
    Then the rental response status is 201
    And the rental status is "PENDING"

  Scenario: List all rentals
    Given a user is logged in as "ADMIN"
    And rentals exist in the system:
      | clientEmail | toolName | status  |
      | client1@example.com | Drill | PENDING |
      | client2@example.com | Saw   | APPROVED |
    When an admin user requests to list all rentals
    Then the list response status is 200
    And the response contains 2 rentals

  Scenario: Get rental by ID
    Given a user is logged in as "CUSTOMER"
    And a rental exists with status "PENDING"
    When a user requests to get the rental by ID
    Then the get response status is 200
    And the response contains rental status "PENDING"

  Scenario: Approve rental request
    Given a rental exists with status "PENDING"
    And a user is logged in as "ADMIN"
    When the user approves the rental
    Then the approval response status is 200
    And the rental status is "APPROVED"

  Scenario: Reject rental request
    Given a rental exists with status "PENDING"
    And a user is logged in as "ADMIN"
    When the user rejects the rental with reason "Tool not available"
    Then the rejection response status is 200
    And the rental status is "REJECTED"
    And the rejection reason is "Tool not available"

  Scenario: Delete rental
    Given a user is logged in as "ADMIN"
    And a rental exists with status "PENDING"
    When an admin deletes the rental
    Then the delete response status is 200
    And the rental is no longer in the system

  Scenario: Find rentals by date interval
    Given a user is logged in as "CUSTOMER"
    And rentals exist with dates:
      | startDate | endDate    |
      | 2025-01-15T10:00:00 | 2025-01-20T18:00:00 |
      | 2025-02-01T10:00:00 | 2025-02-10T18:00:00 |
    When a user searches for rentals in the interval:
      | startDate | endDate    |
      | 2025-01-01T00:00:00 | 2025-01-31T23:59:59 |
    Then the search response status is 200
    And the response contains 1 rental
