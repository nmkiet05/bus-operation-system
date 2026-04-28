package com.bus.system.modules.identity.repository;

import com.bus.system.modules.identity.domain.UserDevice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserDeviceRepository extends JpaRepository<UserDevice, Long> {
    Optional<UserDevice> findByFcmToken(String fcmToken);

    void deleteByFcmToken(String fcmToken);
}
