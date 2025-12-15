package ua.tqs.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import ua.tqs.model.Analytics;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.sql.init.mode=never",
        "spring.datasource.initialization-mode=never"
})
class AnalyticsRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private AnalyticsRepository analyticsRepository;

    @Test
    void whenFindByEventType_thenReturnAnalytics() {
        // given
        Analytics analytics1 = new Analytics();
        analytics1.setEventType("TOOL_VIEW");
        analytics1.setTimestamp(LocalDateTime.now());
        entityManager.persistAndFlush(analytics1);

        Analytics analytics2 = new Analytics();
        analytics2.setEventType("TOOL_VIEW");
        analytics2.setTimestamp(LocalDateTime.now());
        entityManager.persistAndFlush(analytics2);

        // when
        List<Analytics> found = analyticsRepository.findByEventType("TOOL_VIEW");

        // then
        assertThat(found).hasSize(2).contains(analytics1, analytics2);
    }
}
