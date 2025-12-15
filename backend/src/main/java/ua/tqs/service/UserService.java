package ua.tqs.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.dto.AdminStatsDTO;
import ua.tqs.dto.ClientStatsDTO;
import ua.tqs.enums.RentStatus;
import ua.tqs.enums.ToolStatus;
import ua.tqs.enums.UserRole;
import ua.tqs.exception.ResourceNotFoundException;
import ua.tqs.model.Rent;
import ua.tqs.model.Tool;
import ua.tqs.model.User;
import ua.tqs.repository.AnalyticsRepository;
import ua.tqs.repository.RentRepository;
import ua.tqs.repository.ToolRepository;
import ua.tqs.repository.UserRepository;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserService {

    private static final String USER_NOT_FOUND_MSG_PREFIX = "User not found with id: ";

    private final UserRepository userRepository;
    private final RentRepository rentRepository;
    private final ToolRepository toolRepository;
    private final AnalyticsRepository analyticsRepository;

    @Autowired
    public UserService(UserRepository userRepository,
                       RentRepository rentRepository,
                       ToolRepository toolRepository,
                       AnalyticsRepository analyticsRepository) {
        this.userRepository = userRepository;
        this.rentRepository = rentRepository;
        this.toolRepository = toolRepository;
        this.analyticsRepository = analyticsRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public long getTotalUsers() {
        return userRepository.count();
    }

    public AdminStatsDTO getAdminStats() {
        List<Rent> rents = rentRepository.findAll();
        List<Tool> tools = toolRepository.findAll();

        long totalRents = rents.size();
        long totalUsers = userRepository.count();
        long totalTools = tools.size();

        long pendingRents = rents.stream()
                .filter(r -> r.getStatus() == RentStatus.PENDING)
                .count();

        long approvedRents = rents.stream()
                .filter(r -> r.getStatus() == RentStatus.APPROVED || r.getStatus() == RentStatus.ACTIVE)
                .count();

        long rejectedRents = rents.stream()
                .filter(r -> r.getStatus() == RentStatus.REJECTED)
                .count();

        long totalProcessed = approvedRents + rejectedRents;
        double approvalRate = totalProcessed > 0 ? (approvedRents * 100.0 / totalProcessed) : 0.0;

        long availableTools = tools.stream()
                .filter(t -> t.getStatus() == ToolStatus.AVAILABLE)
                .count();

        long rentedTools = tools.stream()
                .filter(t -> t.getStatus() == ToolStatus.RENTED)
                .count();

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        Long activeUsers = analyticsRepository.countUniqueUsersSince(thirtyDaysAgo);
        if (activeUsers == null) {
            activeUsers = 0L;
        }

        double averageRentDurationDays = rents.stream()
                .filter(r -> r.getStartDate() != null && r.getEndDate() != null && !r.getEndDate().isBefore(r.getStartDate()))
                .mapToDouble(r -> {
                    Duration d = Duration.between(r.getStartDate(), r.getEndDate());
                    return d.toSeconds() / 86400.0;
                })
                .average()
                .orElse(0.0);

        Map<Long, Long> counts = rents.stream()
                .collect(Collectors.groupingBy(Rent::getToolId, Collectors.counting()));

        String mostRentedTool = "";
        if (!counts.isEmpty()) {
            Long mostRentedToolId = Collections.max(counts.entrySet(), Map.Entry.comparingByValue()).getKey();
            Optional<Tool> toolOpt = toolRepository.findById(mostRentedToolId);
            mostRentedTool = toolOpt.map(Tool::getName).orElse("tool-" + mostRentedToolId);
        }

        return AdminStatsDTO.builder()
                .totalRents(totalRents)
                .totalUsers(totalUsers)
                .mostRentedTool(mostRentedTool)
                .averageRentDurationDays(averageRentDurationDays)
                .totalTools(totalTools)
                .pendingRents(pendingRents)
                .approvedRents(approvedRents)
                .rejectedRents(rejectedRents)
                .approvalRate(approvalRate)
                .activeUsers(activeUsers)
                .availableTools(availableTools)
                .rentedTools(rentedTools)
                .build();
    }

    public ClientStatsDTO getClientStats(Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return new ClientStatsDTO();
        }

        LocalDateTime now = LocalDateTime.now();

        List<Rent> rentsOfUser = rentRepository.findAll().stream()
                .filter(r -> Objects.equals(r.getUserId(), id))
                .collect(Collectors.toList());

        long totalRents = rentsOfUser.size();

        long activeRents = rentsOfUser.stream()
                .filter(r -> r.getStatus() == RentStatus.ACTIVE && (r.getEndDate() == null || r.getEndDate().isAfter(now)))
                .count();

        long pastRents = rentsOfUser.stream()
                .filter(r -> r.getEndDate() != null && r.getEndDate().isBefore(now))
                .count();

        BigDecimal totalSpent = rentsOfUser.stream()
                .map(r -> {
                    if (r.getStartDate() == null || r.getEndDate() == null || r.getEndDate().isBefore(r.getStartDate())) {
                        return BigDecimal.ZERO;
                    }
                    Optional<Tool> toolOpt = toolRepository.findById(r.getToolId());
                    if (toolOpt.isEmpty() || toolOpt.get().getDailyPrice() == null) {
                        return BigDecimal.ZERO;
                    }
                    double days = Duration.between(r.getStartDate(), r.getEndDate()).toSeconds() / 86400.0;
                    if (days < 0) days = 0;
                    return toolOpt.get().getDailyPrice().multiply(BigDecimal.valueOf(days));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new ClientStatsDTO(id, totalRents, activeRents, pastRents, totalSpent.doubleValue());
    }

    @Transactional
    public User create(User user) {
        if (user.getType() == null) {
            user.setType(UserRole.CUSTOMER);
        }
        return userRepository.save(user);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public List<User> listAll() {
        return userRepository.findAll();
    }

    @Transactional
    public User update(Long id, User updates) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (updates.getName() != null) user.setName(updates.getName());
        if (updates.getEmail() != null) user.setEmail(updates.getEmail());
        if (updates.getPassword() != null) user.setPassword(updates.getPassword());
        if (updates.getType() != null) user.setType(updates.getType());

        return userRepository.save(user);
    }

    @Transactional
    public void delete(Long id) {
        userRepository.deleteById(id);
    }

    @Transactional
    public User activateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND_MSG_PREFIX + id));
        user.setActive(true);
        return userRepository.save(user);
    }

    @Transactional
    public User deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND_MSG_PREFIX + id));
        user.setActive(false);
        return userRepository.save(user);
    }

    @Transactional
    public User changeUserRole(Long id, UserRole newRole) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND_MSG_PREFIX + id));
        user.setType(newRole);
        return userRepository.save(user);
    }

    @Transactional
    public User updatePayPalEmail(Long id, String paypalEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND_MSG_PREFIX + id));
        user.setPaypalEmail(paypalEmail);
        return userRepository.save(user);
    }
}
