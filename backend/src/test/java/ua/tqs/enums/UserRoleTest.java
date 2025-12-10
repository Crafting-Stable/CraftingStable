package ua.tqs.enums;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class UserRoleTest {

    @Test
    void testUserRoleValues() {
        assertNotNull(UserRole.valueOf("CUSTOMER"));
        assertNotNull(UserRole.valueOf("ADMIN"));
    }
}
