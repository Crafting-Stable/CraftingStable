package ua.tqs.repository;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import ua.tqs.model.User;

@DataJpaTest(properties = {
        "spring.sql.init.mode=never",
        "spring.datasource.initialization-mode=never"
})
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Test
    void whenFindByEmail_thenReturnUser() {
        // given
        String email = "test" + System.currentTimeMillis() + "@user.com";
        User user = new User("Test User", email, "password");
        entityManager.persistAndFlush(user);

        // when
        Optional<User> found = userRepository.findByEmail(user.getEmail());

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo(user.getEmail());
    }

    @Test
    void whenInvalidEmail_thenReturnEmpty() {
        // when
        Optional<User> fromDb = userRepository.findByEmail("doesNotExist@mail.com");
        // then
        assertThat(fromDb).isNotPresent();
    }
}
