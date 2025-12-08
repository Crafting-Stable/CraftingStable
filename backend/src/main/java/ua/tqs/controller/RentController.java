package ua.tqs.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ua.tqs.dto.ApiResponse;
import ua.tqs.dto.RentRequestDTO;
import ua.tqs.dto.RentResponseDTO;
import ua.tqs.model.Rent;
import ua.tqs.service.RentService;

import java.time.LocalDateTime;
import java.util.List;
@RestController
@RequestMapping("/api/rents")
@RequiredArgsConstructor
public class RentController {

    private final RentService rentService;

    private Rent toEntity(RentRequestDTO dto) {
        Rent rent = new Rent();
        rent.setToolId(dto.getToolId());
        rent.setUserId(dto.getUserId());
        rent.setStartDate(dto.getStartDate());
        rent.setEndDate(dto.getEndDate());
        return rent;
    }

    private RentResponseDTO toDto(Rent rent) {
        return new RentResponseDTO(
                rent.getId(),
                rent.getToolId(),
                rent.getUserId(),
                rent.getStatus() != null ? rent.getStatus().name() : null,
                rent.getStartDate(),
                rent.getEndDate(),
                rent.getMessage()
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RentResponseDTO>> create(
            @Valid @RequestBody RentRequestDTO rentRequestDTO) {

        Rent rentEntity = toEntity(rentRequestDTO);
        Rent created = rentService.create(rentEntity);

        ApiResponse<RentResponseDTO> response = ApiResponse.success(
            toDto(created),
            "Sucesso",
            "Reserva criada com sucesso!"
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<RentResponseDTO>> listAll() {
        List<RentResponseDTO> dtos = rentService.listAll()
                .stream()
                .map(this::toDto)
                .toList();

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RentResponseDTO> findById(@PathVariable Long id) {
        return rentService.findById(id)
                .map(r -> ResponseEntity.ok(toDto(r)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        if (rentService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        rentService.delete(id);

        ApiResponse<Void> response = ApiResponse.success(null, "Reserva cancelada com sucesso!");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<RentResponseDTO>> approveRent(
            @PathVariable Long id,
            @RequestParam Long ownerId) {

        Rent approved = rentService.approveRent(id, ownerId);

        ApiResponse<RentResponseDTO> response = ApiResponse.success(
            toDto(approved),
            "Sucesso",
            "Reserva aprovada! O utilizador foi notificado por email."
        );

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<RentResponseDTO>> rejectRent(
            @PathVariable Long id,
            @RequestParam Long ownerId,
            @RequestParam(required = false) String message) {

        Rent rejected = rentService.rejectRent(id, ownerId, message);

        ApiResponse<RentResponseDTO> response = ApiResponse.success(
            toDto(rejected),
            "Reserva rejeitada",
            "Reserva rejeitada. O utilizador foi notificado por email."
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/interval")
    public ResponseEntity<List<RentResponseDTO>> findByInterval(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {

        List<RentResponseDTO> dtos = rentService.findByInterval(from, to)
                .stream()
                .map(this::toDto)
                .toList();

        return ResponseEntity.ok(dtos);
    }
}
