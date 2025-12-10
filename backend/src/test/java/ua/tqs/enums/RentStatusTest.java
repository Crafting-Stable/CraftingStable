package ua.tqs.enums;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class RentStatusTest {

    @Test
    void testRentStatusValues() {
        assertNotNull(RentStatus.valueOf("PENDING"));
        assertNotNull(RentStatus.valueOf("APPROVED"));
        assertNotNull(RentStatus.valueOf("REJECTED"));
        assertNotNull(RentStatus.valueOf("ACTIVE"));
        assertNotNull(RentStatus.valueOf("CANCELED"));
        assertNotNull(RentStatus.valueOf("FINISHED"));
    }
}
