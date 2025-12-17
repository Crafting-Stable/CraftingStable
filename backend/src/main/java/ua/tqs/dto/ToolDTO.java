package ua.tqs.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ua.tqs.model.Tool;
import ua.tqs.enums.ToolStatus;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ToolDTO {

    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Type is required")
    private String type;

    @NotNull(message = "Daily price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Daily price must be greater than 0")
    private BigDecimal dailyPrice;

    @NotNull(message = "Deposit amount is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Deposit amount must be >= 0")
    private BigDecimal depositAmount;

    private String description;

    private String location;

    @NotNull
    private Boolean available;

    private String imageUrl;

    private Long ownerId;

    private ToolStatus status;

    public static ToolDTO fromModel(Tool f) {
        if (f == null) {
            return null;
        }
        return ToolDTO.builder()
                .id(f.getId())
                .name(f.getName())
                .type(f.getType())
                .dailyPrice(f.getDailyPrice())
                .depositAmount(f.getDepositAmount())
                .description(f.getDescription())
                .location(f.getLocation())
                .available(f.getAvailable())
                .imageUrl(f.getImageUrl())
                .ownerId(f.getOwnerId())
                .status(f.getStatus())
                .build();
    }

    public Tool toModel() {
        return Tool.builder()
                .id(this.id)
                .name(this.name)
                .type(this.type)
                .dailyPrice(this.dailyPrice)
                .depositAmount(this.depositAmount)
                .description(this.description)
                .location(this.location)
                .available(this.available != null ? this.available : Boolean.TRUE)
                .imageUrl(this.imageUrl)
                .ownerId(this.ownerId)
                .status(this.status != null ? this.status : ToolStatus.AVAILABLE)
                .build();
    }
}
