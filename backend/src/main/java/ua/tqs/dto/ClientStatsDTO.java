package ua.tqs.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClientStatsDTO {
    private Long clientId;
    private long totalRents;
    private long activeRents;
    private long pastRents;
    private double totalSpent;

    public ClientStatsDTO() { }

    public ClientStatsDTO(Long clientId, long totalRents, long activeRents, long pastRents, double totalSpent) {
        this.clientId = clientId;
        this.totalRents = totalRents;
        this.activeRents = activeRents;
        this.pastRents = pastRents;
        this.totalSpent = totalSpent;
    }

}