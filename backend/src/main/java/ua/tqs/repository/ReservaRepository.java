package ua.tqs.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ua.tqs.model.Reserva;

import java.time.LocalDateTime;
import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {
    List<Reserva> findByDataBetween(LocalDateTime from, LocalDateTime to);
}
