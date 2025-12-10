package ua.tqs.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import ua.tqs.model.Rent;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class RentRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private RentRepository rentRepository;

    @Test
    void whenFindByStartDateBetween_thenReturnRents() {
        // given
        LocalDateTime start1 = LocalDateTime.of(2025, 1, 1, 10, 0);
        LocalDateTime end1 = LocalDateTime.of(2025, 1, 5, 10, 0);
        Rent rent1 = new Rent();
        rent1.setStartDate(start1);
        rent1.setEndDate(end1);
        rent1.setToolId(1L);
        rent1.setUserId(1L);
        entityManager.persistAndFlush(rent1);

        LocalDateTime start2 = LocalDateTime.of(2025, 1, 10, 10, 0);
        LocalDateTime end2 = LocalDateTime.of(2025, 1, 15, 10, 0);
        Rent rent2 = new Rent();
        rent2.setStartDate(start2);
        rent2.setEndDate(end2);
        rent2.setToolId(2L);
        rent2.setUserId(2L);
        entityManager.persistAndFlush(rent2);

        // when
        List<Rent> found = rentRepository.findByStartDateBetween(
                LocalDateTime.of(2025, 1, 1, 0, 0),
                LocalDateTime.of(2025, 1, 20, 0, 0)
        );

        // then
        assertThat(found).hasSize(2).contains(rent1, rent2);
    }
}
