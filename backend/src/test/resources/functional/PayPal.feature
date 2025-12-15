@wip
Feature: PayPal Payment Integration
  As a customer with an approved rental
  I want to pay for my rental using PayPal
  So that I can complete my tool rental transaction securely

  # Note: These tests require valid PayPal sandbox credentials
  # They are tagged @wip to skip in CI and run manually with real credentials

  Background:
    Given the application is running
    And the database is clean

  Scenario: Create PayPal order for approved rental
    Given a tool exists with name "Power Drill" and status "AVAILABLE"
    And a user is logged in as "CUSTOMER" with email "customer@example.com"
    And an approved rental exists for the tool with amount "50.00" EUR
    When the user creates a PayPal order for the rental
    Then the PayPal order response status is 200
    And the PayPal order status is "CREATED"
    And the PayPal response contains an approval URL

  Scenario: Cannot create PayPal order for pending rental
    Given a tool exists with name "Circular Saw" and status "AVAILABLE"
    And a user is logged in as "CUSTOMER" with email "customer@example.com"
    And a pending rental exists for the tool
    When the user attempts to create a PayPal order for the rental
    Then the PayPal order response status is 400
    And the error message contains "Only approved rentals can be paid"

  Scenario: Cannot create PayPal order for rejected rental
    Given a tool exists with name "Hammer Drill" and status "AVAILABLE"
    And a user is logged in as "CUSTOMER" with email "customer@example.com"
    And a rejected rental exists for the tool
    When the user attempts to create a PayPal order for the rental
    Then the PayPal order response status is 400
    And the error message contains "Only approved rentals can be paid"

  Scenario: Cannot create PayPal order for non-existent rental
    Given a user is logged in as "CUSTOMER" with email "customer@example.com"
    When the user attempts to create a PayPal order for rental ID 99999
    Then the PayPal order response status is 404
    And the error message contains "Rent not found"

  Scenario: Capture PayPal order after approval
    Given a tool exists with name "Angle Grinder" and status "AVAILABLE"
    And a user is logged in as "CUSTOMER" with email "customer@example.com"
    And an approved rental exists for the tool with amount "75.00" EUR
    And a PayPal order has been created for the rental
    When the user captures the PayPal order
    Then the PayPal capture response status is 200
    And the rental status is updated to "ACTIVE"

  Scenario: Get PayPal order details
    Given a tool exists with name "Jigsaw" and status "AVAILABLE"
    And a user is logged in as "CUSTOMER" with email "customer@example.com"
    And an approved rental exists for the tool with amount "45.00" EUR
    And a PayPal order has been created for the rental
    When the user requests the PayPal order details
    Then the PayPal order details response status is 200
    And the order details contain the correct amount "45.00"

  Scenario: Create PayPal order with custom description
    Given a tool exists with name "Belt Sander" and status "AVAILABLE"
    And a user is logged in as "CUSTOMER" with email "customer@example.com"
    And an approved rental exists for the tool with amount "60.00" EUR
    When the user creates a PayPal order with description "Weekend rental - Belt Sander"
    Then the PayPal order response status is 200
    And the PayPal order description contains "Weekend rental"

  Scenario: Create PayPal order with different currency
    Given a tool exists with name "Reciprocating Saw" and status "AVAILABLE"
    And a user is logged in as "CUSTOMER" with email "customer@example.com"
    And an approved rental exists for the tool with amount "100.00" USD
    When the user creates a PayPal order in USD currency
    Then the PayPal order response status is 200
    And the PayPal order currency is "USD"

  Scenario: Unauthenticated user cannot create PayPal order
    When an unauthenticated user attempts to create a PayPal order
    Then the PayPal order response status is 401

  Scenario: Unauthenticated user cannot capture PayPal order
    When an unauthenticated user attempts to capture a PayPal order
    Then the PayPal capture response status is 401

  Scenario: Create PayPal order for new rental (pay-first flow)
    Given a user is logged in as "CUSTOMER" with email "customer@example.com"
    When the user creates a PayPal order with rentId 0 and amount "50.00" EUR
    Then the PayPal order response status is 200
    And the PayPal order status is "CREATED"
    And the PayPal response contains an approval URL
