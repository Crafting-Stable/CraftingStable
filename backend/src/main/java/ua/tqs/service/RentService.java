package ua.tqs.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.enums.RentStatus;
import ua.tqs.enums.ToolStatus;
import ua.tqs.exception.ResourceNotFoundException;
import ua.tqs.model.Rent;
import ua.tqs.model.Tool;
import ua.tqs.repository.RentRepository;
import ua.tqs.repository.ToolRepository;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RentService {

    private final RentRepository rentRepository;
    private final ToolRepository toolRepository;

    private static final List<RentStatus> BLOCKING_STATUSES = Arrays.asList(RentStatus.APPROVED, RentStatus.ACTIVE);

    @Transactional
    public Rent create(Rent rent) {
        validateBookingDates(rent);

        Tool tool = toolRepository.findById(rent.getToolId())
                .orElseThrow(() -> new ResourceNotFoundException("Tool not found with ID: " + rent.getToolId()));

        if (tool.getOwnerId().equals(rent.getUserId())) {
            throw new IllegalArgumentException("You cannot rent your own tool");
        }

        if (tool.getStatus() == ToolStatus.RENTED ||
                tool.getStatus() == ToolStatus.UNDER_MAINTENANCE ||
                tool.getStatus() == ToolStatus.INACTIVE) {
            throw new IllegalArgumentException("Tool is not available for booking");
        }

        if (hasOverlap(rent)) {
            throw new IllegalArgumentException("This tool is already booked for the selected dates");
        }

        // Forçar estado inicial PENDING e ignorar qualquer estado/mensagem vindo do cliente
        rent.setStatus(RentStatus.PENDING);
        rent.setMessage(null);

        return rentRepository.save(rent);
    }

    /**
     * Verifica disponibilidade para o período (true = disponível).
     */
    @Transactional(readOnly = true)
    public boolean checkAvailability(Long toolId, LocalDateTime start, LocalDateTime end) {
        List<Rent> overlapping = rentRepository.findOverlappingRents(toolId, start, end, BLOCKING_STATUSES);
        return overlapping.isEmpty();
    }

    @Transactional
    public Rent approveRent(Long rentId, Long ownerId) {
        Rent rent = findRentOrThrow(rentId);
        Tool tool = findToolOrThrow(rent.getToolId());

        if (!tool.getOwnerId().equals(ownerId)) {
            throw new IllegalArgumentException("Only the tool owner can approve this rent");
        }

        if (rent.getStatus() != RentStatus.PENDING) {
            throw new IllegalArgumentException("Only pending rents can be approved");
        }

        if (tool.getStatus() != ToolStatus.AVAILABLE) {
            throw new IllegalStateException("Tool is not available for approval");
        }

        List<Rent> conflicts = rentRepository.findOverlappingRents(
                rent.getToolId(), rent.getStartDate(), rent.getEndDate(), BLOCKING_STATUSES
        );
        if (!conflicts.isEmpty()) {
            throw new IllegalStateException("Conflicting approved/active rent exists for this period");
        }

        rent.setStatus(RentStatus.APPROVED);
        rent.setMessage("Reserva aprovada pelo proprietário");

        tool.setStatus(ToolStatus.RENTED);
        toolRepository.save(tool);

        List<Rent> pendingConflicts = rentRepository.findOverlappingRents(
                rent.getToolId(), rent.getStartDate(), rent.getEndDate(), Arrays.asList(RentStatus.PENDING)
        );
        for (Rent r : pendingConflicts) {
            if (!r.getId().equals(rentId)) {
                r.setStatus(RentStatus.REJECTED);
                r.setMessage("Reserva rejeitada automaticamente - período já reservado");
                rentRepository.save(r);
            }
        }

        return rentRepository.save(rent);
    }

    @Transactional
    public Rent rejectRent(Long rentId, Long ownerId, String message) {
        Rent rent = findRentOrThrow(rentId);
        Tool tool = findToolOrThrow(rent.getToolId());

        if (!tool.getOwnerId().equals(ownerId)) {
            throw new IllegalArgumentException("Only the tool owner can reject this rent");
        }

        if (rent.getStatus() != RentStatus.PENDING) {
            throw new IllegalArgumentException("Only pending rents can be rejected");
        }

        rent.setStatus(RentStatus.REJECTED);
        rent.setMessage((message != null && !message.isEmpty()) ? "Rejeitado: " + message : "Reserva rejeitada pelo proprietário");

        return rentRepository.save(rent);
    }

    public List<Rent> listAll() {
        return rentRepository.findAll();
    }

    public Optional<Rent> findById(Long id) {
        return rentRepository.findById(id);
    }

    @Transactional
    public void delete(Long id) {
        rentRepository.deleteById(id);
    }

    public List<Rent> findByInterval(LocalDateTime from, LocalDateTime to) {
        return rentRepository.findByStartDateBetween(from, to);
    }

    public boolean hasOverlap(Rent rent) {
        List<Rent> overlapping = rentRepository.findOverlappingRents(
                rent.getToolId(), rent.getStartDate(), rent.getEndDate(), BLOCKING_STATUSES
        );
        if (rent.getId() != null) {
            overlapping.removeIf(r -> r.getId().equals(rent.getId()));
        }
        return !overlapping.isEmpty();
    }

    private void validateBookingDates(Rent rent) {
        LocalDateTime now = LocalDateTime.now();

        if (rent.getStartDate() == null || rent.getEndDate() == null) {
            throw new IllegalArgumentException("Start date and end date are required");
        }

        if (rent.getStartDate().isBefore(now)) {
            throw new IllegalArgumentException("Start date cannot be in the past");
        }

        if (!rent.getEndDate().isAfter(rent.getStartDate())) {
            throw new IllegalArgumentException("End date must be after start date");
        }
    }

    @Transactional
    public Rent cancelRent(Long rentId, Long userId) {
        Rent rent = findRentOrThrow(rentId);

        if (!rent.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Only the renting user can cancel their rent");
        }

        if (rent.getStatus() != RentStatus.PENDING && rent.getStatus() != RentStatus.APPROVED) {
            throw new IllegalStateException("This rent cannot be cancelled");
        }

        if (rent.getStatus() == RentStatus.APPROVED) {
            Tool tool = findToolOrThrow(rent.getToolId());
            tool.setStatus(ToolStatus.AVAILABLE);
            toolRepository.save(tool);
        }

        rent.setStatus(RentStatus.CANCELED);
        rent.setMessage("Reserva cancelada pelo utilizador");
        return rentRepository.save(rent);
    }

    @Transactional
    public Rent activateRent(Long rentId) {
        Rent rent = findRentOrThrow(rentId);

        if (rent.getStatus() != RentStatus.APPROVED) {
            throw new IllegalStateException("Only approved rents can be activated");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(rent.getStartDate())) {
            throw new IllegalStateException("Rent has not started yet");
        }

        Tool tool = findToolOrThrow(rent.getToolId());
        tool.setStatus(ToolStatus.RENTED);
        toolRepository.save(tool);

        rent.setStatus(RentStatus.ACTIVE);
        return rentRepository.save(rent);
    }

    @Transactional
    public Rent finishRent(Long rentId) {
        Rent rent = findRentOrThrow(rentId);

        if (rent.getStatus() != RentStatus.ACTIVE) {
            throw new IllegalStateException("Only active rents can be finished");
        }

        rent.setStatus(RentStatus.FINISHED);

        Tool tool = findToolOrThrow(rent.getToolId());
        tool.setStatus(ToolStatus.AVAILABLE);
        toolRepository.save(tool);

        return rentRepository.save(rent);
    }

    @Transactional
    public void processScheduledRents() {
        LocalDateTime now = LocalDateTime.now();

        List<Rent> toActivate = rentRepository.findByStatusAndStartDateBefore(RentStatus.APPROVED, now);
        for (Rent rent : toActivate) {
            rent.setStatus(RentStatus.ACTIVE);
            Tool tool = findToolOrThrow(rent.getToolId());
            tool.setStatus(ToolStatus.RENTED);
            toolRepository.save(tool);
            rentRepository.save(rent);
        }

        List<Rent> toFinish = rentRepository.findByStatusAndEndDateBefore(RentStatus.ACTIVE, now);
        for (Rent rent : toFinish) {
            finishRent(rent.getId());
        }
    }

    private Rent findRentOrThrow(Long id) {
        return rentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Rent not found"));
    }

    private Tool findToolOrThrow(Long id) {
        return toolRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Tool not found"));
    }
}
