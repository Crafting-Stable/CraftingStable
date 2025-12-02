package ua.tqs.dto;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class AdminStatsDTO {
    private long totalRents;
    private long totalUsers;
    private String mostRentedTool;
    private double averageRentDurationDays;

    public AdminStatsDTO() {}

    public AdminStatsDTO(long totalRents, long totalUsers, String mostRentedTool, double averageRentDurationDays) {
        this.totalRents = totalRents;
        this.totalUsers = totalUsers;
        this.mostRentedTool = mostRentedTool;
        this.averageRentDurationDays = averageRentDurationDays;
    }

}