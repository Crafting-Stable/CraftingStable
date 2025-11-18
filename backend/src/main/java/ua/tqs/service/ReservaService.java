// src/main/java/ua/tqs/service/ReservaService.java
package ua.tqs.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.model.Reserva;
import ua.tqs.repository.ReservaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReservaService {

    private final ReservaRepository reservaRepository;

    @Transactional
    public Reserva criar(Reserva reserva) {
        return reservaRepository.save(reserva);
    }

    public List<Reserva> listarTodas() {
        return reservaRepository.findAll();
    }

    public Optional<Reserva> buscarPorId(Long id) {
        return reservaRepository.findById(id);
    }

    @Transactional
    public void apagar(Long id) {
        reservaRepository.deleteById(id);
    }

    public List<Reserva> buscarPorIntervalo(LocalDateTime from, LocalDateTime to) {
        return reservaRepository.findByDataBetween(from, to);
    }
}
