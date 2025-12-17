package ua.tqs.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ua.tqs.model.Analytics;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnalyticsRepository extends JpaRepository<Analytics, Long> {

    List<Analytics> findByEventType(String eventType);

    List<Analytics> findByUserId(Long userId);

    List<Analytics> findByToolId(Long toolId);

    List<Analytics> findByTimestampBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT a FROM Analytics a WHERE a.eventType = :eventType AND a.timestamp BETWEEN :start AND :end")
    List<Analytics> findByEventTypeAndTimestampBetween(
            @Param("eventType") String eventType,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("SELECT a.eventType, COUNT(a) FROM Analytics a WHERE a.timestamp >= :since GROUP BY a.eventType")
    List<Object[]> countEventTypesSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(DISTINCT a.userId) FROM Analytics a WHERE a.timestamp >= :since")
    Long countUniqueUsersSince(@Param("since") LocalDateTime since);

    @Query(
            "SELECT a.toolId, COUNT(a) FROM Analytics a " +
                    "WHERE a.eventType = 'TOOL_VIEW' AND a.timestamp >= :since " +
                    "GROUP BY a.toolId ORDER BY COUNT(a) DESC"
    )
    List<Object[]> findMostViewedToolsSince(@Param("since") LocalDateTime since);
}
