package ua.tqs.functional;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;

import io.cucumber.spring.ScenarioScope;
import ua.tqs.model.User;

/**
 * Shared state object that holds data across Cucumber step definitions within a scenario.
 * This bean is scenario-scoped, meaning each scenario gets its own instance.
 */
@Component
@ScenarioScope
public class SharedState {
    public ResponseEntity<?> latestResponse;
    public HttpHeaders headers = new HttpHeaders();
    public User lastCreatedUser;

    public SharedState() {
        headers.add("Content-Type", "application/json");
    }
}
