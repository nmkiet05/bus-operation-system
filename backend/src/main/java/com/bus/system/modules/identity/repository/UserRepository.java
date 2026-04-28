package com.bus.system.modules.identity.repository;

import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.identity.contract.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    Boolean existsByUsername(String username);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r = :role AND u.status = 'ACTIVE' AND u.deletedAt IS NULL")
    List<User> findActiveUsersByRole(@Param("role") UserRole role);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r = :role AND u.status = 'ACTIVE' AND u.deletedAt IS NULL AND u.id NOT IN :excludeIds")
    List<User> findActiveUsersByRoleAndIdNotIn(@Param("role") UserRole role,
            @Param("excludeIds") Collection<Long> excludeIds);
}