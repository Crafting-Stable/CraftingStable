package ua.tqs.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ua.tqs.model.Ferramenta;

import java.util.List;

@Repository
public interface FerramentaRepository extends JpaRepository<Ferramenta, Long> {

    List<Ferramenta> findByTipo(String tipo);

    List<Ferramenta> findByDisponivelTrue();

    List<Ferramenta> findByLocalizacao(String localizacao);
}
