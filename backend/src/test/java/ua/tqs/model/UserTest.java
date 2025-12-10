package ua.tqs.model;

import org.junit.jupiter.api.Test;
import ua.tqs.enums.UserRole;

import static org.junit.jupiter.api.Assertions.*;

class UserTest {

    @Test
    void testUserModel() {
        User user = new User();
        user.setName("Test User");
        user.setEmail("test@user.com");
        user.setPassword("password");
        user.setType(UserRole.CUSTOMER);
        user.setActive(true);

        assertEquals("Test User", user.getName());
        assertEquals("test@user.com", user.getEmail());
        assertEquals("password", user.getPassword());
        assertEquals(UserRole.CUSTOMER, user.getType());
        assertTrue(user.getActive());
    }

    @Test
    void testUserConstructors() {
        User user1 = new User("Test User", "test@user.com", "password");
        assertEquals("Test User", user1.getName());
        assertEquals("test@user.com", user1.getEmail());
        assertEquals("password", user1.getPassword());

        User user2 = new User(1L, "Test User 2", "test2@user.com", "password2");
        assertEquals(1L, user2.getId());
        assertEquals("Test User 2", user2.getName());
        assertEquals("test2@user.com", user2.getEmail());
        assertEquals("password2", user2.getPassword());
    }

    @Test
    void testEquals() {
        User user1 = new User(1L, "Test User", "test@user.com", "password");
        User user2 = new User(1L, "Test User", "test@user.com", "password");
        User user3 = new User(2L, "Test User 2", "test2@user.com", "password2");

        assertEquals(user1, user2);
        assertNotEquals(user1, user3);
        assertNotEquals(user1, null);
        assertNotEquals(user1, new Object());
    }

    @Test
    void testHashCode() {
        User user1 = new User(1L, "Test User", "test@user.com", "password");
        User user2 = new User(1L, "Test User", "test@user.com", "password");

        assertEquals(user1.hashCode(), user2.hashCode());
    }

    @Test
    void testToString() {
        User user1 = new User(1L, "Test User", "test@user.com", "password");
        String expected = "User{id=1, name='Test User', email='test@user.com', type=CUSTOMER}";
        assertEquals(expected, user1.toString());
    }
}
