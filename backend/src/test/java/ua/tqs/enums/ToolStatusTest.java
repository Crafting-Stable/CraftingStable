package ua.tqs.enums;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ToolStatusTest {

    @Test
    void testToolStatusValues() {
        assertNotNull(ToolStatus.valueOf("AVAILABLE"));
        assertNotNull(ToolStatus.valueOf("RENTED"));
        assertNotNull(ToolStatus.valueOf("UNDER_MAINTENANCE"));
        assertNotNull(ToolStatus.valueOf("INACTIVE"));
    }
}
