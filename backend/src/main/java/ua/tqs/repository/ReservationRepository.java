package ua.tqs.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ua.tqs.model.Reservation;

import java.time.LocalDateTime;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByDataBetween(LocalDateTime from, LocalDateTime to);
}
