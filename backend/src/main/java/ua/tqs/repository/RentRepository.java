package ua.tqs.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ua.tqs.enums.RentStatus;
import ua.tqs.model.Rent;

import java.time.LocalDateTime;
import java.util.List;

public interface RentRepository extends JpaRepository<Rent, Long> {
    List<Rent> findByStartDateBetween(LocalDateTime from, LocalDateTime to);
    
    List<Rent> findByToolIdAndStatusIn(Long toolId, List<RentStatus> statuses);
    
    @Query("SELECT r FROM Rent r WHERE r.toolId = :toolId AND r.status IN :statuses " +
           "AND ((r.startDate <= :endDate AND r.endDate >= :startDate))")
    List<Rent> findOverlappingRents(
        @Param("toolId") Long toolId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("statuses") List<RentStatus> statuses
    );
}
