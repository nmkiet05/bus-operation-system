export const QUERY_TIME = {
    ONE_MINUTE: 60 * 1000,
    TEN_MINUTES: 10 * 60 * 1000,
    ONE_HOUR: 60 * 60 * 1000,
    TWENTY_FOUR_HOURS: 24 * 60 * 60 * 1000,
    INFINITY: Infinity,
} as const;

export const QUERY_KEYS = {
    PROVINCES: ["provinces"],
    BUS_TYPES: ["busTypes"],
} as const;
