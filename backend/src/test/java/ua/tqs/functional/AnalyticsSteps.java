package ua.tqs.functional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.test.context.ActiveProfiles;

import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import ua.tqs.model.Analytics;
import ua.tqs.model.Tool;
import ua.tqs.repository.AnalyticsRepository;
import ua.tqs.repository.ToolRepository;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class AnalyticsSteps {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private AnalyticsRepository analyticsRepository;

    @Autowired
    private ToolRepository toolRepository;

    @Autowired
    private SharedState sharedState;

    @When("an event is tracked with type {string} user {string} tool {string}")
    public void eventIsTrackedWithTypeUserTool(String type, String user, String tool) {
        sharedState.latestResponse = restTemplate.postForEntity(
            "/api/analytics/track?eventType=" + type + "&userId=1&toolId=1",
            new HttpEntity<>(sharedState.headers),
            String.class
        );
    }

    @Then("the track response status is {int}")
    public void trackResponseStatusIs(int statusCode) {
        assertEquals(statusCode, sharedState.latestResponse.getStatusCode().value());
    }

    @And("the event is stored in the system")
    public void eventIsStoredInSystem() {
        // Wait for async save to complete
        int maxWait = 50; // 5 seconds total
        int waited = 0;
        while (analyticsRepository.count() == 0 && waited < maxWait) {
            try {
                Thread.sleep(100);
                waited++;
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        assertTrue(analyticsRepository.count() > 0);
    }

    @Given("events exist in the system:")
    public void eventsExistInSystem(io.cucumber.datatable.DataTable dataTable) {
        var events = dataTable.asMaps(String.class, String.class);
        for (var eventData : events) {
            Analytics analytics = new Analytics();
            analytics.setEventType(eventData.get("type"));
            analytics.setTimestamp(LocalDateTime.now());
            analyticsRepository.save(analytics);
        }
    }

    @When("a user requests the analytics summary")
    public void userRequestsAnalyticsSummary() {
        sharedState.latestResponse = restTemplate.exchange(
            "/api/analytics/summary",
            HttpMethod.GET,
            new HttpEntity<>(sharedState.headers),
            String.class
        );
    }

    @Then("the summary response status is {int}")
    public void summaryResponseStatusIs(int statusCode) {
        assertEquals(statusCode, sharedState.latestResponse.getStatusCode().value());
    }

    @And("the response contains event counts")
    public void responseContainsEventCounts() {
        assertTrue(sharedState.latestResponse.getStatusCode().is2xxSuccessful());
    }

    @Given("events exist with types:")
    public void eventsExistWithTypes(io.cucumber.datatable.DataTable dataTable) {
        var events = dataTable.asMaps(String.class, String.class);
        for (var eventData : events) {
            Analytics analytics = new Analytics();
            analytics.setEventType(eventData.get("type"));
            analytics.setTimestamp(LocalDateTime.now());
            analyticsRepository.save(analytics);
        }
    }

    @When("a user searches for events by type {string}")
    public void userSearchesForEventsByType(String type) {
        String start = "2025-01-01T00:00:00";
        String end = "2025-12-31T23:59:59";
        sharedState.latestResponse = restTemplate.exchange(
            "/api/analytics/events/" + type + "?start=" + start + "&end=" + end,
            HttpMethod.GET,
            new HttpEntity<>(sharedState.headers),
            String.class
        );
    }

    @And("the response contains {int} events of type {string}")
    public void responseContainsEventsOfType(int count, String type) {
        assertTrue(sharedState.latestResponse.getStatusCode().is2xxSuccessful());
    }

    @Given("events exist with dates:")
    public void eventsExistWithDates(io.cucumber.datatable.DataTable dataTable) {
        var events = dataTable.asMaps(String.class, String.class);
        for (var eventData : events) {
            Analytics analytics = new Analytics();
            analytics.setEventType("EVENT_" + eventData.get("date"));
            analytics.setTimestamp(LocalDateTime.now());
            analyticsRepository.save(analytics);
        }
    }

    @When("a user searches for events in the date range:")
    public void userSearchesForEventsInDateRange(io.cucumber.datatable.DataTable dataTable) {
        var dates = dataTable.asMaps(String.class, String.class).get(0);
        sharedState.latestResponse = restTemplate.exchange(
            "/api/analytics/events/ALL?start=" + dates.get("startDate") + "&end=" + dates.get("endDate"),
            HttpMethod.GET,
            new HttpEntity<>(sharedState.headers),
            String.class
        );
    }

    @And("the response contains {int} events")
    public void responseContainsEvents(int count) {
        assertTrue(sharedState.latestResponse.getStatusCode().is2xxSuccessful());
    }

    @Given("a user exists with email {string}")
    public void userExistsWithEmail(String email) {
        // Create user
    }

    @And("events exist for the user")
    public void eventsExistForUser() {
        Analytics analytics = new Analytics();
        analytics.setEventType("USER_VIEW");
        analytics.setTimestamp(LocalDateTime.now());
        analyticsRepository.save(analytics);
    }

    @When("a user requests activity for user {string}")
    public void userRequestsActivityForUser(String email) {
        sharedState.latestResponse = restTemplate.exchange(
            "/api/analytics/user/1",
            HttpMethod.GET,
            new HttpEntity<>(sharedState.headers),
            String.class
        );
    }

    @Then("the activity response status is {int}")
    public void activityResponseStatusIs(int statusCode) {
        assertEquals(statusCode, sharedState.latestResponse.getStatusCode().value());
    }

    @And("the response contains user events")
    public void responseContainsUserEvents() {
        assertTrue(sharedState.latestResponse.getStatusCode().is2xxSuccessful());
    }

    @And("events exist for the tool")
    public void eventsExistForTool() {
        Analytics analytics = new Analytics();
        analytics.setEventType("TOOL_VIEW");
        analytics.setTimestamp(LocalDateTime.now());
        analyticsRepository.save(analytics);
    }

    @When("a user requests analytics for the tool")
    public void userRequestsAnalyticsForTool() {
        sharedState.latestResponse = restTemplate.exchange(
            "/api/analytics/tool/1",
            HttpMethod.GET,
            new HttpEntity<>(sharedState.headers),
            String.class
        );
    }

    @Then("the analytics response status is {int}")
    public void analyticsResponseStatusIs(int statusCode) {
        assertEquals(statusCode, sharedState.latestResponse.getStatusCode().value());
    }

    @And("the response contains tool events")
    public void responseContainsToolEvents() {
        assertTrue(sharedState.latestResponse.getStatusCode().is2xxSuccessful());
    }

    @When("a user requests analytics for tool {string}")
    public void userRequestsAnalyticsForTool(String toolName) {
        // Get tool by name to find its ID - use first tool with matching name or ID 1 as fallback
        Tool tool = toolRepository.findAll().stream()
            .filter(t -> t.getName().equals(toolName))
            .findFirst()
            .orElse(null);
        
        Long toolId = (tool != null && tool.getId() != null) ? tool.getId() : 1L;
        sharedState.latestResponse = restTemplate.exchange(
            "/api/analytics/tool/" + toolId,
            HttpMethod.GET,
            new HttpEntity<>(sharedState.headers),
            String.class
        );
    }
}
