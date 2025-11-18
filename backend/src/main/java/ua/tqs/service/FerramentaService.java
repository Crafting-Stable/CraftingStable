package ua.tqs.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ua.tqs.model.Ferramenta;
import ua.tqs.repository.FerramentaRepository;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FerramentaService {

    private final FerramentaRepository ferramentaRepository;

    public Ferramenta criar(Ferramenta ferramenta) {
        return ferramentaRepository.save(ferramenta);
    }

    public List<Ferramenta> listarTodas() {
        return ferramentaRepository.findAll();
    }

    public List<Ferramenta> listarDisponiveis() {
        return ferramentaRepository.findByDisponivelTrue();
    }

    public List<Ferramenta> buscarPorTipo(String tipo) {
        return ferramentaRepository.findByTipo(tipo);
    }

    public Optional<Ferramenta> buscarPorId(Long id) {
        return ferramentaRepository.findById(id);
    }

    public void apagar(Long id) {
        ferramentaRepository.deleteById(id);
    }
}
