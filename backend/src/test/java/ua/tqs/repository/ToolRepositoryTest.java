package ua.tqs.repository;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import ua.tqs.model.Tool;

@DataJpaTest
class ToolRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ToolRepository toolRepository;

    @BeforeEach
    void setUp() {
        // Clear existing data from data.sql to avoid conflicts
        toolRepository.deleteAll();
        entityManager.flush();
        entityManager.clear();
    }

    @Test
    void whenFindByType_thenReturnTools() {
        // given
        Tool tool1 = new Tool();
        tool1.setName("Hammer");
        tool1.setType("Hand Tool");
        tool1.setDailyPrice(new java.math.BigDecimal("10.0"));
        tool1.setDepositAmount(new java.math.BigDecimal("20.0"));
        tool1.setOwnerId(1L);
        entityManager.persistAndFlush(tool1);

        Tool tool2 = new Tool();
        tool2.setName("Screwdriver");
        tool2.setType("Hand Tool");
        tool2.setDailyPrice(new java.math.BigDecimal("5.0"));
        tool2.setDepositAmount(new java.math.BigDecimal("10.0"));
        tool2.setOwnerId(1L);
        entityManager.persistAndFlush(tool2);

        // when
        List<Tool> found = toolRepository.findByType("Hand Tool");

        // then
        assertThat(found).hasSize(2).contains(tool1, tool2);
    }
}
