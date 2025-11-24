package ua.tqs.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.model.Rent;
import ua.tqs.repository.RentRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RentService {

    private final RentRepository rentRepository;

    @Transactional
    public Rent create(Rent rent) {
        return rentRepository.save(rent);
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
        return rentRepository.findByDateTimeBetween(from, to);
    }
}