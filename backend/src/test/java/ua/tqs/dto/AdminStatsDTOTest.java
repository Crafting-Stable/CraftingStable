package ua.tqs.dto;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AdminStatsDTOTest {

    @Test
    void testAdminStatsDTO() {
        AdminStatsDTO stats = new AdminStatsDTO();
        stats.setTotalRents(100);
        stats.setTotalUsers(50);
        stats.setMostRentedTool("Hammer");
        stats.setAverageRentDurationDays(5.5);
        stats.setTotalTools(200);
        stats.setPendingRents(10);
        stats.setApprovedRents(80);
        stats.setRejectedRents(10);
        stats.setApprovalRate(0.8);
        stats.setActiveUsers(40);
        stats.setAvailableTools(150);
        stats.setRentedTools(50);

        assertEquals(100, stats.getTotalRents());
        assertEquals(50, stats.getTotalUsers());
        assertEquals("Hammer", stats.getMostRentedTool());
        assertEquals(5.5, stats.getAverageRentDurationDays());
        assertEquals(200, stats.getTotalTools());
        assertEquals(10, stats.getPendingRents());
        assertEquals(80, stats.getApprovedRents());
        assertEquals(10, stats.getRejectedRents());
        assertEquals(0.8, stats.getApprovalRate());
        assertEquals(40, stats.getActiveUsers());
        assertEquals(150, stats.getAvailableTools());
        assertEquals(50, stats.getRentedTools());
    }

    @Test
    void testAdminStatsDTOBuilder() {
        AdminStatsDTO stats = AdminStatsDTO.builder()
                .totalRents(100)
                .totalUsers(50)
                .mostRentedTool("Hammer")
                .averageRentDurationDays(5.5)
                .totalTools(200)
                .pendingRents(10)
                .approvedRents(80)
                .rejectedRents(10)
                .approvalRate(0.8)
                .activeUsers(40)
                .availableTools(150)
                .rentedTools(50)
                .build();

        assertEquals(100, stats.getTotalRents());
        assertEquals(50, stats.getTotalUsers());
        assertEquals("Hammer", stats.getMostRentedTool());
        assertEquals(5.5, stats.getAverageRentDurationDays());
        assertEquals(200, stats.getTotalTools());
        assertEquals(10, stats.getPendingRents());
        assertEquals(80, stats.getApprovedRents());
        assertEquals(10, stats.getRejectedRents());
        assertEquals(0.8, stats.getApprovalRate());
        assertEquals(40, stats.getActiveUsers());
        assertEquals(150, stats.getAvailableTools());
        assertEquals(50, stats.getRentedTools());
    }
}
