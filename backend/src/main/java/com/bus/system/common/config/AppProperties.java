package com.bus.system.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Application-wide configuration properties
 * Chứa các config chung cho toàn app: pagination, validation, formats...
 */
@Configuration
@ConfigurationProperties(prefix = "app")
@Data
public class AppProperties {

    /**
     * Cấu hình Pagination
     */
    private PaginationConfig pagination = new PaginationConfig();

    /**
     * Cấu hình Date/Time Formats
     */
    private FormatConfig format = new FormatConfig();

    /**
     * Cấu hình Validation Regex
     */
    private ValidationConfig validation = new ValidationConfig();

    @Data
    public static class PaginationConfig {
        /**
         * Page mặc định (0-indexed)
         */
        private int defaultPage = 0;

        /**
         * Số items mỗi page mặc định
         */
        private int defaultPageSize = 20;

        /**
         * Giới hạn tối đa items/page (chống abuse)
         */
        private int maxPageSize = 100;
    }

    @Data
    public static class FormatConfig {
        /**
         * Format ngày: dd/MM/yyyy
         */
        private String dateFormat = "dd/MM/yyyy";

        /**
         * Format giờ: HH:mm
         */
        private String timeFormat = "HH:mm";

        /**
         * Format ngày giờ: dd/MM/yyyy HH:mm
         */
        private String datetimeFormat = "dd/MM/yyyy HH:mm";

        /**
         * Format ISO: yyyy-MM-dd'T'HH:mm:ss
         */
        private String isoDatetimeFormat = "yyyy-MM-dd'T'HH:mm:ss";
    }

    @Data
    public static class ValidationConfig {
        /**
         * Regex cho số điện thoại Việt Nam
         */
        private String phoneRegex = "^(0|\\\\+84)[0-9]{9}$";

        /**
         * Regex cho biển số xe
         */
        private String licensePlateRegex = "^[0-9]{2}[A-Z]-[0-9]{4,5}$";

        /**
         * Regex cho CCCD (12 số)
         */
        private String cccdRegex = "^[0-9]{12}$";
    }
}
