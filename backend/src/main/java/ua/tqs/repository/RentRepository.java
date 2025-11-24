package ua.tqs.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ua.tqs.model.Rent;

import java.time.LocalDateTime;
import java.util.List;

public interface RentRepository extends JpaRepository<Rent, Long> {
    List<Rent> findByDateTimeBetween(LocalDateTime from, LocalDateTime to);
}