package ua.tqs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDTO {
    // Existing fields
    private long totalRents;
    private long totalUsers;
    private String mostRentedTool;
    private double averageRentDurationDays;

    // New KPIs
    private long totalTools;
    private long pendingRents;
    private long approvedRents;
    private long rejectedRents;
    private double approvalRate;  // percentage
    private long activeUsers;  // users active in last 30 days
    private long availableTools;
    private long rentedTools;
}