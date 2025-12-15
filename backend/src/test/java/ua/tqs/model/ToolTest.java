package ua.tqs.model;

import org.junit.jupiter.api.Test;
import ua.tqs.enums.ToolStatus;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class ToolTest {

    @Test
    void testToolModelWithBuilder() {
        Tool tool = Tool.builder()
                .id(1L)
                .name("Hammer")
                .type("Hand Tool")
                .dailyPrice(new BigDecimal("10.0"))
                .depositAmount(new BigDecimal("20.0"))
                .description("A very good hammer")
                .location("Shed")
                .available(true)
                .imageUrl("http://example.com/hammer.jpg")
                .ownerId(1L)
                .status(ToolStatus.AVAILABLE)
                .build();

        assertEquals(1L, tool.getId());
        assertEquals("Hammer", tool.getName());
        assertEquals("Hand Tool", tool.getType());
        assertEquals(new BigDecimal("10.0"), tool.getDailyPrice());
        assertEquals(new BigDecimal("20.0"), tool.getDepositAmount());
        assertEquals("A very good hammer", tool.getDescription());
        assertEquals("Shed", tool.getLocation());
        assertTrue(tool.getAvailable());
        assertEquals("http://example.com/hammer.jpg", tool.getImageUrl());
        assertEquals(1L, tool.getOwnerId());
        assertEquals(ToolStatus.AVAILABLE, tool.getStatus());
    }

    @Test
    void testToolDefaultConstructor() {
        Tool tool = new Tool();
        assertNull(tool.getId());
        assertTrue(tool.getAvailable());
        assertEquals(ToolStatus.AVAILABLE, tool.getStatus());
    }
}
