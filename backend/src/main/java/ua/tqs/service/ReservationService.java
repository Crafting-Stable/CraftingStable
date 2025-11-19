// src/main/java/ua/tqs/service/ReservaService.java
package ua.tqs.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.model.Reservation;
import ua.tqs.repository.ReservationRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;

    @Transactional
    public Reservation create(Reservation reservation) {
        return reservationRepository.save(reservation);
    }

    public List<Reservation> listAll() {
        return reservationRepository.findAll();
    }

    public Optional<Reservation> findById(Long id) {
        return reservationRepository.findById(id);
    }

    @Transactional
    public void delete(Long id) {
        reservationRepository.deleteById(id);
    }

    public List<Reservation> findByInterval(LocalDateTime from, LocalDateTime to) {
        return reservationRepository.findByDataBetween(from, to);
    }
}
