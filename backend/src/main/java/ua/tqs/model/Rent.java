package ua.tqs.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

import ua.tqs.enums.RentStatus;
@Entity
@Table(name = "rents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Rent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private Long toolId;

    @NotNull
    private Long userId;

    @NotNull
    private LocalDateTime startDate;

    @NotNull
    private LocalDateTime endDate;

    @Enumerated(EnumType.STRING)
    private RentStatus status = RentStatus.ACTIVE;

    private String message;
}
