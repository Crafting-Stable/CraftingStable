package ua.tqs.functional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.test.context.ActiveProfiles;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import ua.tqs.enums.RentStatus;
import ua.tqs.enums.ToolStatus;
import ua.tqs.enums.UserRole;
import ua.tqs.model.Rent;
import ua.tqs.model.Tool;
import ua.tqs.model.User;
import ua.tqs.repository.RentRepository;
import ua.tqs.repository.ToolRepository;
import ua.tqs.repository.UserRepository;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class PayPalSteps {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private RentRepository rentRepository;

    @Autowired
    private ToolRepository toolRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SharedState sharedState;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private Tool lastCreatedTool;
    private Rent lastCreatedRent;
    private String lastPayPalOrderId;
    private String lastAmount;
    private String lastCurrency;

    @Given("an approved rental exists for the tool with amount {string} EUR")
    public void approvedRentalExistsForToolWithAmountEUR(String amount) {
        createRentalWithStatus(RentStatus.APPROVED, amount, "EUR");
    }

    @Given("an approved rental exists for the tool with amount {string} USD")
    public void approvedRentalExistsForToolWithAmountUSD(String amount) {
        createRentalWithStatus(RentStatus.APPROVED, amount, "USD");
    }

    @Given("a pending rental exists for the tool")
    public void pendingRentalExistsForTool() {
        createRentalWithStatus(RentStatus.PENDING, "50.00", "EUR");
    }

    @Given("a rejected rental exists for the tool")
    public void rejectedRentalExistsForTool() {
        createRentalWithStatus(RentStatus.REJECTED, "50.00", "EUR");
    }

    private void createRentalWithStatus(RentStatus status, String amount, String currency) {
        // Ensure tool exists
        if (lastCreatedTool == null) {
            lastCreatedTool = TestDataFactory.createTool("Test Tool");
            lastCreatedTool.setStatus(ToolStatus.AVAILABLE);
            toolRepository.save(lastCreatedTool);
        }

        // Create owner for the tool
        User owner = userRepository.findByEmail("owner@example.com").orElseGet(() -> {
            User o = TestDataFactory.createUser("owner@example.com", "password", UserRole.ADMIN);
            return userRepository.save(o);
        });
        lastCreatedTool.setOwnerId(owner.getId());
        toolRepository.save(lastCreatedTool);

        // Get the logged in user
        User customer = sharedState.lastCreatedUser;
        if (customer == null) {
            customer = userRepository.findByEmail("customer@example.com").orElseGet(() -> {
                User c = TestDataFactory.createUser("customer@example.com", "password", UserRole.CUSTOMER);
                return userRepository.save(c);
            });
        }

        Rent rent = Rent.builder()
                .toolId(lastCreatedTool.getId())
                .userId(customer.getId())
                .status(status)
                .startDate(LocalDateTime.now().plusDays(1))
                .endDate(LocalDateTime.now().plusDays(3))
                .build();

        lastCreatedRent = rentRepository.save(rent);
        lastAmount = amount;
        lastCurrency = currency;
    }

    @Given("a PayPal order has been created for the rental")
    public void payPalOrderHasBeenCreated() {
        // This step simulates that an order was created - in integration tests with mock
        // we would store the order ID. For now, we'll create a mock order ID.
        lastPayPalOrderId = "MOCK-ORDER-" + System.currentTimeMillis();
    }

    @When("the user creates a PayPal order for the rental")
    public void userCreatesPayPalOrderForRental() {
        String url = "/api/paypal/orders?rentId=" + lastCreatedRent.getId()
                + "&amount=" + lastAmount
                + "&currency=" + lastCurrency;

        sharedState.latestResponse = restTemplate.exchange(
                url,
                HttpMethod.POST,
                new HttpEntity<>(sharedState.headers),
                String.class
        );
    }

    @When("the user attempts to create a PayPal order for the rental")
    public void userAttemptsToCreatePayPalOrderForRental() {
        userCreatesPayPalOrderForRental();
    }

    @When("the user attempts to create a PayPal order for rental ID {long}")
    public void userAttemptsToCreatePayPalOrderForRentalId(Long rentId) {
        String url = "/api/paypal/orders?rentId=" + rentId
                + "&amount=50.00&currency=EUR";

        sharedState.latestResponse = restTemplate.exchange(
                url,
                HttpMethod.POST,
                new HttpEntity<>(sharedState.headers),
                String.class
        );
    }

    @When("the user creates a PayPal order with rentId {int} and amount {string} EUR")
    public void userCreatesPayPalOrderWithRentIdAndAmount(int rentId, String amount) {
        String url = "/api/paypal/orders?rentId=" + rentId
                + "&amount=" + amount
                + "&currency=EUR";

        sharedState.latestResponse = restTemplate.exchange(
                url,
                HttpMethod.POST,
                new HttpEntity<>(sharedState.headers),
                String.class
        );
    }

    @When("the user creates a PayPal order with description {string}")
    public void userCreatesPayPalOrderWithDescription(String description) {
        String url = "/api/paypal/orders?rentId=" + lastCreatedRent.getId()
                + "&amount=" + lastAmount
                + "&currency=" + lastCurrency
                + "&description=" + description;

        sharedState.latestResponse = restTemplate.exchange(
                url,
                HttpMethod.POST,
                new HttpEntity<>(sharedState.headers),
                String.class
        );
    }

    @When("the user creates a PayPal order in USD currency")
    public void userCreatesPayPalOrderInUSDCurrency() {
        lastCurrency = "USD";
        userCreatesPayPalOrderForRental();
    }

    @When("the user captures the PayPal order")
    public void userCapturesPayPalOrder() {
        String url = "/api/paypal/orders/" + lastPayPalOrderId + "/capture?rentId=" + lastCreatedRent.getId();

        sharedState.latestResponse = restTemplate.exchange(
                url,
                HttpMethod.POST,
                new HttpEntity<>(sharedState.headers),
                String.class
        );
    }

    @When("the user requests the PayPal order details")
    public void userRequestsPayPalOrderDetails() {
        String url = "/api/paypal/orders/" + lastPayPalOrderId;

        sharedState.latestResponse = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(sharedState.headers),
                String.class
        );
    }

    @When("an unauthenticated user attempts to create a PayPal order")
    public void unauthenticatedUserAttemptsToCreatePayPalOrder() {
        // Remove auth headers
        sharedState.headers.remove("Authorization");

        String url = "/api/paypal/orders?rentId=1&amount=50.00&currency=EUR";

        sharedState.latestResponse = restTemplate.exchange(
                url,
                HttpMethod.POST,
                new HttpEntity<>(sharedState.headers),
                String.class
        );
    }

    @When("an unauthenticated user attempts to capture a PayPal order")
    public void unauthenticatedUserAttemptsToCapturePayPalOrder() {
        // Remove auth headers
        sharedState.headers.remove("Authorization");

        String url = "/api/paypal/orders/ORDER-123/capture?rentId=1";

        sharedState.latestResponse = restTemplate.exchange(
                url,
                HttpMethod.POST,
                new HttpEntity<>(sharedState.headers),
                String.class
        );
    }

    @Then("the PayPal order response status is {int}")
    public void payPalOrderResponseStatusIs(int statusCode) {
        assertEquals(statusCode, sharedState.latestResponse.getStatusCode().value());
    }

    @Then("the PayPal capture response status is {int}")
    public void payPalCaptureResponseStatusIs(int statusCode) {
        assertEquals(statusCode, sharedState.latestResponse.getStatusCode().value());
    }

    @Then("the PayPal order details response status is {int}")
    public void payPalOrderDetailsResponseStatusIs(int statusCode) {
        assertEquals(statusCode, sharedState.latestResponse.getStatusCode().value());
    }

    @And("the PayPal order status is {string}")
    public void payPalOrderStatusIs(String status) throws Exception {
        String body = (String) sharedState.latestResponse.getBody();
        JsonNode json = objectMapper.readTree(body);
        assertEquals(status, json.get("status").asText());
    }

    @And("the PayPal response contains an approval URL")
    public void payPalResponseContainsApprovalUrl() throws Exception {
        String body = (String) sharedState.latestResponse.getBody();
        JsonNode json = objectMapper.readTree(body);
        assertTrue(json.has("approvalUrl"));
        assertNotNull(json.get("approvalUrl").asText());
    }

    @And("the error message contains {string}")
    public void errorMessageContains(String expectedMessage) {
        String body = (String) sharedState.latestResponse.getBody();
        assertTrue(body.contains(expectedMessage),
                "Expected error message to contain: " + expectedMessage + ", but got: " + body);
    }

    @And("the rental status is updated to {string}")
    public void rentalStatusIsUpdatedTo(String status) {
        Rent updatedRent = rentRepository.findById(lastCreatedRent.getId()).orElseThrow();
        assertEquals(RentStatus.valueOf(status), updatedRent.getStatus());
    }

    @And("the order details contain the correct amount {string}")
    public void orderDetailsContainCorrectAmount(String amount) throws Exception {
        String body = (String) sharedState.latestResponse.getBody();
        JsonNode json = objectMapper.readTree(body);
        assertEquals(amount, json.get("amount").asText());
    }

    @And("the PayPal order description contains {string}")
    public void payPalOrderDescriptionContains(String expectedDescription) throws Exception {
        String body = (String) sharedState.latestResponse.getBody();
        JsonNode json = objectMapper.readTree(body);
        assertTrue(json.get("description").asText().contains(expectedDescription));
    }

    @And("the PayPal order currency is {string}")
    public void payPalOrderCurrencyIs(String currency) throws Exception {
        String body = (String) sharedState.latestResponse.getBody();
        JsonNode json = objectMapper.readTree(body);
        assertEquals(currency, json.get("currency").asText());
    }

    // Store tool from other step definitions via shared state
    public void setLastCreatedTool(Tool tool) {
        this.lastCreatedTool = tool;
    }
}
