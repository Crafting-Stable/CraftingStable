package ua.tqs.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ua.tqs.dto.AdminStatsDTO;
import ua.tqs.dto.ClientStatsDTO;
import ua.tqs.model.Rent;
import ua.tqs.model.Tool;
import ua.tqs.model.User;
import ua.tqs.repository.RentRepository;
import ua.tqs.repository.ToolRepository;
import ua.tqs.repository.UserRepository;
import ua.tqs.enums.RentStatus;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RentRepository rentRepository;
    private final ToolRepository toolRepository;

    @Autowired
    public UserService(UserRepository userRepository, RentRepository rentRepository, ToolRepository toolRepository) {
        this.userRepository = userRepository;
        this.rentRepository = rentRepository;
        this.toolRepository = toolRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public long getTotalUsers() {
        return userRepository.count();
    }

    public AdminStatsDTO getAdminStats() {
        List<Rent> rents = rentRepository.findAll();

        long totalRents = rents.size();
        long totalUsers = userRepository.count();

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

        return new AdminStatsDTO(totalRents, totalUsers, mostRentedTool, averageRentDurationDays);
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
                    BigDecimal price = toolOpt.get().getDailyPrice().multiply(BigDecimal.valueOf(days));
                    return price;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new ClientStatsDTO(id, totalRents, activeRents, pastRents, totalSpent.doubleValue());
    }
}
    public User create(User user) {
        if (user.getRole() == null) {
            user.setRole(ua.tqs.enums.UserRole.CUSTOMER);
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

    public User update(Long id, User updates) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ua.tqs.exception.ResourceNotFoundException("User not found"));
        
        if (updates.getName() != null) {
            user.setName(updates.getName());
        }
        if (updates.getEmail() != null) {
            user.setEmail(updates.getEmail());
        }
        if (updates.getPassword() != null) {
            user.setPassword(updates.getPassword());
        }
        if (updates.getRole() != null) {
            user.setRole(updates.getRole());
        }
        
        return userRepository.save(user);
    }

    public void delete(Long id) {
        userRepository.deleteById(id);
    }
