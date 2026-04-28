package com.bus.system.modules.operation.dto.response;

public class TripGenerationResponse {
    private boolean success;
    private int totalTripsCreated; // Số chuyến mới được tạo
    private int totalSkipped; // Số chuyến bị bỏ qua (do đã tồn tại)
    private String message;

    public TripGenerationResponse() {
    }

    public TripGenerationResponse(boolean success, int totalTripsCreated, int totalSkipped, String message) {
        this.success = success;
        this.totalTripsCreated = totalTripsCreated;
        this.totalSkipped = totalSkipped;
        this.message = message;
    }

    public static TripGenerationResponseBuilder builder() {
        return new TripGenerationResponseBuilder();
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public int getTotalTripsCreated() {
        return totalTripsCreated;
    }

    public void setTotalTripsCreated(int totalTripsCreated) {
        this.totalTripsCreated = totalTripsCreated;
    }

    public int getTotalSkipped() {
        return totalSkipped;
    }

    public void setTotalSkipped(int totalSkipped) {
        this.totalSkipped = totalSkipped;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public static class TripGenerationResponseBuilder {
        private boolean success;
        private int totalTripsCreated;
        private int totalSkipped;
        private String message;

        TripGenerationResponseBuilder() {
        }

        public TripGenerationResponseBuilder success(boolean success) {
            this.success = success;
            return this;
        }

        public TripGenerationResponseBuilder totalTripsCreated(int totalTripsCreated) {
            this.totalTripsCreated = totalTripsCreated;
            return this;
        }

        public TripGenerationResponseBuilder totalSkipped(int totalSkipped) {
            this.totalSkipped = totalSkipped;
            return this;
        }

        public TripGenerationResponseBuilder message(String message) {
            this.message = message;
            return this;
        }

        public TripGenerationResponse build() {
            return new TripGenerationResponse(success, totalTripsCreated, totalSkipped, message);
        }
    }
}