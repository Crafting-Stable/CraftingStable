package ua.tqs.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.enums.NotificationType;
import ua.tqs.enums.RentStatus;
import ua.tqs.exception.ResourceNotFoundException;
import ua.tqs.model.Rent;
import ua.tqs.model.Tool;
import ua.tqs.model.User;
import ua.tqs.repository.RentRepository;
import ua.tqs.repository.ToolRepository;
import ua.tqs.repository.UserRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RentService {

    private final RentRepository rentRepository;
    private final ToolRepository toolRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public Rent create(Rent rent) {
        // Validate booking dates
        validateBookingDates(rent);
        
        // Check for overlapping bookings
        if (hasOverlap(rent)) {
            throw new IllegalArgumentException("This tool is already booked for the selected dates");
        }
        
        // Set initial status if not set
        if (rent.getStatus() == null) {
            rent.setStatus(RentStatus.PENDING);
        }
        
        return rentRepository.save(rent);
    }

    @Transactional
    public Rent approveRent(Long rentId, Long ownerId) {
        Rent rent = rentRepository.findById(rentId)
                .orElseThrow(() -> new ResourceNotFoundException("Rent not found"));
        
        Tool tool = toolRepository.findById(rent.getToolId())
                .orElseThrow(() -> new ResourceNotFoundException("Tool not found"));
        
        // Verify that the requester is the tool owner
        if (!tool.getOwnerId().equals(ownerId)) {
            throw new IllegalArgumentException("Only the tool owner can approve this rent");
        }
        
        // Verify current status allows approval
        if (rent.getStatus() != RentStatus.PENDING) {
            throw new IllegalArgumentException("Only pending rents can be approved");
        }
        
        rent.setStatus(RentStatus.APPROVED);
        Rent savedRent = rentRepository.save(rent);

        try {
            Map<String, Object> variables = buildRentVariables(savedRent, tool);
            notificationService.sendNotification(savedRent.getUserId(), NotificationType.RENT_APPROVED, variables, savedRent.getId());
        } catch (Exception e) {
            // Log the error but don't fail the approval
        }

        return savedRent;
    }

    @Transactional
    public Rent rejectRent(Long rentId, Long ownerId, String message) {
        Rent rent = rentRepository.findById(rentId)
                .orElseThrow(() -> new ResourceNotFoundException("Rent not found"));
        
        Tool tool = toolRepository.findById(rent.getToolId())
                .orElseThrow(() -> new ResourceNotFoundException("Tool not found"));
        
        // Verify that the requester is the tool owner
        if (!tool.getOwnerId().equals(ownerId)) {
            throw new IllegalArgumentException("Only the tool owner can reject this rent");
        }
        
        // Verify current status allows rejection
        if (rent.getStatus() != RentStatus.PENDING) {
            throw new IllegalArgumentException("Only pending rents can be rejected");
        }
        
        rent.setStatus(RentStatus.REJECTED);
        rent.setMessage(message);
        Rent savedRent = rentRepository.save(rent);

        try {
            Map<String, Object> variables = buildRentVariables(savedRent, tool);
            variables.put("rejectionMessage", message != null ? message : "No reason provided");
            notificationService.sendNotification(savedRent.getUserId(), NotificationType.RENT_REJECTED, variables, savedRent.getId());
        } catch (Exception e) {
            // Log the error but don't fail the rejection
        }

        return savedRent;
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

    /**
     * Check if a rent request overlaps with existing approved/pending rents
     */
    public boolean hasOverlap(Rent rent) {
        // Only check against PENDING and APPROVED rents (CANCELED and REJECTED don't block)
        List<RentStatus> blockingStatuses = Arrays.asList(RentStatus.PENDING, RentStatus.APPROVED);
        
        List<Rent> overlapping = rentRepository.findOverlappingRents(
            rent.getToolId(),
            rent.getStartDate(),
            rent.getEndDate(),
            blockingStatuses
        );
        
        // If updating an existing rent, exclude itself from overlap check
        if (rent.getId() != null) {
            overlapping.removeIf(r -> r.getId().equals(rent.getId()));
        }
        
        return !overlapping.isEmpty();
    }

    /**
     * Validate booking dates
     */
    private void validateBookingDates(Rent rent) {
        LocalDateTime now = LocalDateTime.now();

        if (rent.getStartDate() == null || rent.getEndDate() == null) {
            throw new IllegalArgumentException("Start date and end date are required");
        }

        if (rent.getStartDate().isBefore(now)) {
            throw new IllegalArgumentException("Start date cannot be in the past");
        }

        if (rent.getEndDate().isBefore(rent.getStartDate())) {
            throw new IllegalArgumentException("End date must be after start date");
        }

        if (rent.getStartDate().isEqual(rent.getEndDate())) {
            throw new IllegalArgumentException("End date must be after start date");
        }
    }

    /**
     * Build template variables for rent notifications
     */
    private Map<String, Object> buildRentVariables(Rent rent, Tool tool) {
        Map<String, Object> variables = new HashMap<>();

        User user = userRepository.findById(rent.getUserId()).orElse(null);

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        variables.put("userName", user != null ? user.getName() : "User");
        variables.put("toolName", tool.getName());
        variables.put("toolType", tool.getType());
        variables.put("startDate", rent.getStartDate().format(dateFormatter));
        variables.put("endDate", rent.getEndDate().format(dateFormatter));
        variables.put("rentId", rent.getId());
        variables.put("dailyPrice", tool.getDailyPrice());
        variables.put("depositAmount", tool.getDepositAmount());

        return variables;
    }
}
