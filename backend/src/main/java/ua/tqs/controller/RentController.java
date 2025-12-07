package ua.tqs.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import ua.tqs.dto.RentRequestDTO;
import ua.tqs.dto.RentResponseDTO;
import ua.tqs.model.Rent;
import ua.tqs.service.RentService;
import ua.tqs.service.UserDetailsServiceImpl;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/rents")
@RequiredArgsConstructor
public class RentController {

    private static final Logger logger = LoggerFactory.getLogger(RentController.class);

    private final RentService rentService;
    private final UserDetailsServiceImpl userDetailsService;

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
    public ResponseEntity<?> create(
            @Valid @RequestBody RentRequestDTO rentRequestDTO,
            @AuthenticationPrincipal UserDetails userDetails) {

        logger.info("🔍 create rent: toolId={} providedUserId={}", rentRequestDTO.getToolId(), rentRequestDTO.getUserId());

        if (rentRequestDTO.getUserId() == null) {
            if (userDetails != null) {
                try {
                    Long resolvedUserId = userDetailsService.getUserId(userDetails);
                    rentRequestDTO.setUserId(resolvedUserId);
                    logger.info("🆔 userId resolvido a partir do token: {}", resolvedUserId);
                } catch (Exception e) {
                    logger.error("❌ erro ao resolver userId: {}", e.getMessage(), e);
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro interno ao resolver utilizador");
                }
            } else {
                logger.warn("⚠️ userId não fornecido e sem autenticação");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Autenticação necessária");
            }
        }

        Rent rentEntity = toEntity(rentRequestDTO);
        try {
            Rent created = rentService.create(rentEntity);
            return ResponseEntity.status(HttpStatus.CREATED).body(toDto(created));
        } catch (Exception e) {
            logger.error("❌ erro ao criar rent: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erro ao criar reserva: " + e.getMessage());
        }
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
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (rentService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        rentService.delete(id);
        return ResponseEntity.noContent().build();
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
