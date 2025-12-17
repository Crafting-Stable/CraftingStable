package ua.tqs.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

import ua.tqs.enums.ToolStatus;

@Entity
@Table(name = "tools")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tool {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    @Column(name = "name", nullable = false)
    private String name;

    @NotBlank(message = "Type is required")
    @Column(name = "type")
    private String type;

    @NotNull(message = "Daily price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Daily price must be greater than 0")
    @Column(name = "daily_price")
    private BigDecimal dailyPrice;

    @NotNull(message = "Deposit amount is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Deposit amount must be >= 0")
    @Column(name = "deposit_amount")
    private BigDecimal depositAmount;

    @Column(name = "description")
    private String description;

    @Column(name = "location")
    private String location;

    @Column(name = "available", nullable = false)
    private Boolean available = true;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "owner_id")
    private Long ownerId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ToolStatus status = ToolStatus.AVAILABLE;

}
