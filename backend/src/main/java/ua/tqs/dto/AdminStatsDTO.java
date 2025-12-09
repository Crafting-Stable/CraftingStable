package ua.tqs.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.AllArgsConstructor;

import lombok.NoArgsConstructor;
import lombok.Builder;

@Setter
@Getter

@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDTO {
    private long totalRents;
    private long totalUsers;
    private String mostRentedTool;
    private double averageRentDurationDays;
    private long totalTools;
    private long pendingRents;
    private long approvedRents;
    private long rejectedRents;
    private double approvalRate;
    private long activeUsers;
    private long availableTools;
    private long rentedTools;

}