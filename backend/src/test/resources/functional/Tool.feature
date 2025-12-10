Feature: Tool Management
  As a tool owner or admin
  I want to manage tools
  So that I can list them for rent and track their status

  Background:
    Given the application is running
    And the database is clean

  Scenario: Create a new tool
    Given a user is logged in as "ADMIN" with email "admin@example.com"
    When the user creates a tool with name "Drill" type "Power Tools" description "Electric Drill" location "Warehouse A"
    Then the create response status is 201
    And the tool "Drill" exists in the system

  Scenario: List all tools
    Given tools exist in the system:
      | name  | type        | description | location    |
      | Drill | Power Tools | Electric    | Warehouse A |
      | Saw   | Power Tools | Circular    | Warehouse B |
    When a user requests to list all tools
    Then the list response status is 200
    And the response contains 2 tools

  Scenario: List available tools
    Given tools exist with statuses:
      | name  | status    |
      | Drill | AVAILABLE |
      | Saw   | RENTED    |
      | Hammer | AVAILABLE |
    When a user requests to list available tools
    Then the list response status is 200
    And the response contains 2 available tools

  Scenario: Find tools by type
    Given tools exist with types:
      | name   | type        |
      | Drill  | Power Tools |
      | Saw    | Power Tools |
      | Hammer | Hand Tools  |
    When a user searches for tools by type "Power Tools"
    Then the search response status is 200
    And the response contains 2 tools of type "Power Tools"

  Scenario: Get tool by ID
    Given a tool exists with name "Drill"
    When a user requests to get the tool by ID
    Then the get response status is 200
    And the response contains tool name "Drill"

  Scenario: Update tool status
    Given a user is logged in as "ADMIN"
    And a tool exists with name "Drill" owned by the logged-in user
    When the user updates the tool status to "UNDER_MAINTENANCE"
    Then the update response status is 200
    And the tool status is "UNDER_MAINTENANCE"

  Scenario: Delete tool by owner
    Given a user is logged in as "ADMIN"
    And a tool exists with name "Drill" owned by the logged-in user
    When the user deletes the tool
    Then the delete response status is 200
    And the tool is no longer in the system
