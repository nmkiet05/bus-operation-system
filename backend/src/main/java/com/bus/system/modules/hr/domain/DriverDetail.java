package com.bus.system.modules.hr.domain;

import com.bus.system.modules.identity.domain.User;
import com.bus.system.modules.fleet.domain.Bus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "driver_detail")
@Getter
@Setter
public class DriverDetail {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "license_number", nullable = false, unique = true, length = 50)
    private String licenseNumber;

    @Column(name = "license_class", nullable = false, length = 10)
    private String licenseClass;

    @Column(name = "license_expiry_date", nullable = false)
    private LocalDate licenseExpiryDate;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    // ===================== CONSTANTS =====================
    private static final int SEATS_THRESHOLD_LARGE = 30;
    private static final int SEATS_THRESHOLD_MEDIUM = 10;

    private static final int LICENSE_RANK_NONE = 0;
    private static final int LICENSE_RANK_B1 = 1;
    private static final int LICENSE_RANK_B2 = 2;
    private static final int LICENSE_RANK_C = 3;
    private static final int LICENSE_RANK_D = 4;
    private static final int LICENSE_RANK_E_FC = 5;

    public static final String CLASS_E = "E";
    public static final String CLASS_FC = "FC";
    public static final String CLASS_D = "D";
    public static final String CLASS_C = "C";
    public static final String CLASS_B2 = "B2";
    public static final String CLASS_B1 = "B1";

    // ===================== DOMAIN LOGIC =====================

    /**
     * Kiểm tra tài xế có thể lái xe này không (dựa trên hạng bằng lái).
     * Quy tắc:
     * - Xe >= 30 chỗ: Cần bằng E hoặc FC
     * - Xe 10-29 chỗ: Cần bằng D trở lên (D, E, FC)
     * - Xe < 10 chỗ: Cần bằng B2 trở lên
     */
    public boolean canDrive(Bus bus) {
        if (bus == null || bus.getBusType() == null) {
            return false;
        }

        int totalSeats = bus.getBusType().getTotalSeats();
        String requiredClass = getRequiredLicenseClass(totalSeats);

        return isLicenseClassSufficient(this.licenseClass, requiredClass);
    }

    /**
     * Kiểm tra tài xế có đủ hạng bằng lái cho xe có số chỗ cụ thể.
     * Dùng khi chưa gán xe cụ thể, chỉ biết loại xe yêu cầu (từ ScheduleBusType).
     */
    public boolean canDriveSeats(int totalSeats) {
        String requiredClass = getRequiredLicenseClass(totalSeats);
        return isLicenseClassSufficient(this.licenseClass, requiredClass);
    }

    /**
     * Xác định hạng bằng lái tối thiểu cần thiết dựa trên số chỗ.
     */
    public static String getRequiredLicenseClass(int totalSeats) {
        if (totalSeats >= SEATS_THRESHOLD_LARGE) {
            return CLASS_E; // Xe lớn cần bằng E hoặc FC
        } else if (totalSeats >= SEATS_THRESHOLD_MEDIUM) {
            return CLASS_D; // Xe vừa cần bằng D trở lên
        } else {
            return CLASS_B2; // Xe nhỏ cần bằng B2
        }
    }

    /**
     * Kiểm tra xem bằng lái hiện có đủ điều kiện không.
     * Thứ tự từ thấp đến cao: B1 < B2 < C < D < E = FC
     */
    private boolean isLicenseClassSufficient(String driverClass, String requiredClass) {
        if (driverClass == null || requiredClass == null) {
            return false;
        }

        int driverLevel = getLicenseLevel(driverClass.toUpperCase());
        int requiredLevel = getLicenseLevel(requiredClass.toUpperCase());

        return driverLevel >= requiredLevel;
    }

    private int getLicenseLevel(String licenseClass) {
        return switch (licenseClass) {
            case CLASS_B1 -> LICENSE_RANK_B1;
            case CLASS_B2 -> LICENSE_RANK_B2;
            case CLASS_C -> LICENSE_RANK_C;
            case CLASS_D -> LICENSE_RANK_D;
            case CLASS_E, CLASS_FC -> LICENSE_RANK_E_FC;
            default -> LICENSE_RANK_NONE;
        };
    }

    /**
     * Kiểm tra bằng lái còn hiệu lực không.
     */
    public boolean isLicenseValid() {
        return this.licenseExpiryDate != null &&
                this.licenseExpiryDate.isAfter(LocalDate.now());
    }

    /**
     * Validate toàn bộ điều kiện bằng lái cho xe cụ thể.
     * Throws BusinessException nếu không đạt.
     */
    public void validateQualification(Bus bus) {
        // Kiểm tra hiệu lực
        if (!isLicenseValid()) {
            throw new com.bus.system.common.exception.BusinessException("LICENSE_EXPIRED",
                    "Bằng lái của tài xế " + (user != null ? user.getFullName() : "Unknown") + " đã hết hạn.");
        }

        // Kiểm tra hạng bằng
        if (!canDrive(bus)) {
            int seats = bus.getBusType() != null ? bus.getBusType().getTotalSeats() : 0;
            String requiredClass = getRequiredLicenseClass(seats);

            throw new com.bus.system.common.exception.BusinessException("LICENSE_CLASS_MISMATCH",
                    "Tài xế " + (user != null ? user.getFullName() : "Unknown") +
                            " (bằng " + this.licenseClass + ") không đủ điều kiện lái xe " + seats +
                            " chỗ (cần bằng " + requiredClass + ").");
        }
    }
}
