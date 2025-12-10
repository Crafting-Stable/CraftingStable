Feature: Analytics and Event Tracking
  As an admin or analytics system
  I want to track and analyze user activity
  So that I can understand platform usage patterns

  Background:
    Given the application is running
    And the database is clean

  Scenario: Track event
    When an event is tracked with type "TOOL_VIEW" user "user1" tool "drill"
    Then the track response status is 200
    And the event is stored in the system

  Scenario: Get analytics summary
    Given a user is logged in as "ADMIN"
    And events exist in the system:
      | type | timestamp |
      | TOOL_VIEW | 2025-01-15T10:00:00 |
      | TOOL_VIEW | 2025-01-15T11:00:00 |
      | RENT_CREATED | 2025-01-15T12:00:00 |
    When a user requests the analytics summary
    Then the summary response status is 200
    And the response contains event counts

  Scenario: Get events by type
    Given a user is logged in as "ADMIN"
    And events exist with types:
      | type |
      | TOOL_VIEW |
      | TOOL_VIEW |
      | RENT_CREATED |
    When a user searches for events by type "TOOL_VIEW"
    Then the search response status is 200
    And the response contains 2 events of type "TOOL_VIEW"

  Scenario: Get events in date range
    Given a user is logged in as "ADMIN"
    And events exist with dates:
      | type | timestamp |
      | TOOL_VIEW | 2025-01-15T10:00:00 |
      | TOOL_VIEW | 2025-01-20T10:00:00 |
      | TOOL_VIEW | 2025-02-05T10:00:00 |
    When a user searches for events in the date range:
      | startDate | endDate |
      | 2025-01-01T00:00:00 | 2025-01-31T23:59:59 |
    Then the search response status is 200
    And the response contains 2 events

  Scenario: Get user activity
    Given a user is logged in as "ADMIN"
    And a user exists with email "user@example.com"
    And events exist for the user
    When a user requests activity for user "user@example.com"
    Then the activity response status is 200
    And the response contains user events

  Scenario: Get tool analytics
    Given a user is logged in as "ADMIN"
    And a tool exists with name "Drill"
    And events exist for the tool
    When a user requests analytics for tool "Drill"
    Then the analytics response status is 200
    And the response contains tool events
