package ua.tqs.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ua.tqs.model.UserNotificationPreferences;

import java.util.Optional;

@Repository
public interface UserNotificationPreferencesRepository extends JpaRepository<UserNotificationPreferences, Long> {

    Optional<UserNotificationPreferences> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}
