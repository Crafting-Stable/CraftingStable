package ua.tqs.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class RentRequestDTO {

    @NotNull
    private Long toolId;

    @NotNull
    private Long userId;

    @NotNull
    private LocalDateTime startDate;

    @NotNull
    private LocalDateTime endDate;

    public RentRequestDTO() {}

    public RentRequestDTO(Long toolId, Long userId,
                          LocalDateTime startDate, LocalDateTime endDate) {
        this.toolId = toolId;
        this.userId = userId;
        this.startDate = startDate;
        this.endDate = endDate;
    }
}
