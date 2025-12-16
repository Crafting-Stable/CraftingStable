package ua.tqs.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class RentResponseDTO {

    private Long id;
    private Long toolId;
    private Long userId;
    private String status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String message;

    public RentResponseDTO() { }

    public RentResponseDTO(Long id, Long toolId, Long userId, String status,
                           LocalDateTime startDate, LocalDateTime endDate, String message) {
        this.id = id;
        this.toolId = toolId;
        this.userId = userId;
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
        this.message = message;
    }
}
