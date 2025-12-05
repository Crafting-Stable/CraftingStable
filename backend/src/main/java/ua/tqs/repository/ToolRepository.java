package ua.tqs.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ua.tqs.enums.ToolStatus;
import ua.tqs.model.Tool;

import java.util.List;

@Repository
public interface ToolRepository extends JpaRepository<Tool, Long> {

    List<Tool> findByType(String type);

    List<Tool> findByAvailableTrue();

    List<Tool> findByLocation(String location);

    List<Tool> findByOwnerId(Long ownerId);

    List<Tool> findByStatus(ToolStatus status);
}
