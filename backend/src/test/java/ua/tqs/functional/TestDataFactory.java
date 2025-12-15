package ua.tqs.functional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import ua.tqs.enums.ToolStatus;
import ua.tqs.enums.UserRole;
import ua.tqs.model.Rent;
import ua.tqs.model.Tool;
import ua.tqs.model.User;

/**
 * Factory class to create valid test data with all required fields populated.
 * Ensures that validation constraints are satisfied during entity creation.
 */
public class TestDataFactory {

    private static int userCounter = 1;
    private static int toolCounter = 1;
    private static final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * Create a User with all required fields
     */
    public static User createUser(String email, String password, UserRole role) {
        User user = new User();
        user.setName("Test User " + userCounter++);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setType(role);
        user.setActive(true);
        return user;
    }

    /**
     * Create a User with defaults
     */
    public static User createUser() {
        return createUser("user" + userCounter + "@example.com", "password123", UserRole.CUSTOMER);
    }

    /**
     * Create an admin user
     */
    public static User createAdminUser(String email, String password) {
        return createUser(email, password, UserRole.ADMIN);
    }

    /**
     * Create a customer user
     */
    public static User createCustomerUser(String email, String password) {
        return createUser(email, password, UserRole.CUSTOMER);
    }

    /**
     * Create a Tool with all required fields
     */
    public static Tool createTool(String name, String description, String type, 
                                  BigDecimal dailyPrice, BigDecimal depositAmount) {
        Tool tool = new Tool();
        tool.setName(name);
        tool.setDescription(description);
        tool.setType(type);
        tool.setDailyPrice(dailyPrice);
        tool.setDepositAmount(depositAmount);
        tool.setStatus(ToolStatus.AVAILABLE);
        return tool;
    }

    /**
     * Create a Tool with defaults
     */
    public static Tool createTool() {
        return createTool("Tool " + toolCounter, 
                         "Test tool " + toolCounter++,
                         "Construction", 
                         new BigDecimal("25.00"), 
                         new BigDecimal("50.00"));
    }

    /**
     * Create a Tool with specific name
     */
    public static Tool createTool(String name) {
        return createTool(name,
                         "Test tool for " + name,
                         "Construction",
                         new BigDecimal("25.00"),
                         new BigDecimal("50.00"));
    }

    /**
     * Create a Rent with all required fields
     */
    public static Rent createRent(User renter, Tool tool) {
        Rent rent = new Rent();
        rent.setUserId(renter.getId());
        rent.setToolId(tool.getId());
        rent.setStartDate(LocalDateTime.now());
        rent.setEndDate(LocalDateTime.now().plusDays(5));
        rent.setStatus(ua.tqs.enums.RentStatus.ACTIVE);
        return rent;
    }

    /**
     * Reset counters (call in @Before hooks)
     */
    public static void resetCounters() {
        userCounter = 1;
        toolCounter = 1;
    }
}
