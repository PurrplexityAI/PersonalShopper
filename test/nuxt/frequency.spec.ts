import { describe, it, expect } from "vitest";
import { calculateBurnRatio } from "~~/app/utils/frequency";

describe("calculateBurnRatio - Core Mathematical Baseline (Section 2)", () => {

  it("calculates normal EWMA when usage is on schedule with no exposure delay", () => {
    // Purchased 7 days ago, frequency is 7 days, never suggested
    const now = new Date("2026-09-08T12:00:00.000Z");
    const lastPurchasedAt = new Date("2026-09-01T12:00:00.000Z").toISOString();

    const result = calculateBurnRatio(
      {
        frequencyDays: 7,
        lastPurchasedAt,
        lastSuggestedAt: null,
      },
      now
    );

    // elapsed_days = 7, observed_delay_days = 0, effective_elapsed_days = 7
    // burn_ratio = 7 / 7 = 1.0 (Normal variance)
    expect(result.elapsedDays).toBeCloseTo(7);
    expect(result.observedDelayDays).toBe(0);
    expect(result.effectiveElapsedDays).toBeCloseTo(7);
    expect(result.burnRatio).toBeCloseTo(1.0);
    expect(result.classification).toBe("normal");
    // Standard EWMA: 0.8 * 7 + 0.2 * 7 = 7
    expect(result.adjustedFrequencyDays).toBe(7);
  });

  it("protects user when app was not opened (observedDelayDays == 0 even if elapsed > frequencyDays)", () => {
    // Purchased 14 days ago, frequency is 7 days, but item was NEVER suggested in drawer
    const now = new Date("2026-09-15T12:00:00.000Z");
    const lastPurchasedAt = new Date("2026-09-01T12:00:00.000Z").toISOString();

    const result = calculateBurnRatio(
      {
        frequencyDays: 7,
        lastPurchasedAt,
        lastSuggestedAt: null,
      },
      now
    );

    // elapsed_days = 14, but observed_delay_days = 0
    // Because observed_delay_days == 0 and elapsed_days >= frequencyDays,
    // effective_elapsed_days clamps to frequencyDays (7) so user isn't penalized for not opening the app!
    expect(result.elapsedDays).toBeCloseTo(14);
    expect(result.observedDelayDays).toBe(0);
    expect(result.effectiveElapsedDays).toBe(7);
    expect(result.burnRatio).toBe(1);
    expect(result.classification).toBe("normal");
  });

  it("ignores lastSuggestedAt if it is older than lastPurchasedAt", () => {
    // Purchased on Sept 5, lastSuggested on Sept 1 (from previous cycle)
    const now = new Date("2026-09-12T12:00:00.000Z");
    const lastPurchasedAt = new Date("2026-09-05T12:00:00.000Z").toISOString();
    const lastSuggestedAt = new Date("2026-09-01T12:00:00.000Z").toISOString();

    const result = calculateBurnRatio(
      {
        frequencyDays: 7,
        lastPurchasedAt,
        lastSuggestedAt,
      },
      now
    );

    expect(result.observedDelayDays).toBe(0);
    expect(result.effectiveElapsedDays).toBe(7);
    expect(result.burnRatio).toBe(1);
  });

  it("detects high anomaly when item was suggested and delayed (burn_ratio >= 1.8)", () => {
    // frequencyDays = 10
    // lastPurchased = 20 days ago (2026-09-01)
    // lastSuggested = 10 days ago (2026-09-11)
    // now = 2026-09-21
    // observedDelayDays = 10
    // effectiveElapsedDays = 10 + 10 = 20
    // burnRatio = 20 / 10 = 2.0 (>= 1.8 -> high_anomaly)
    const now = new Date("2026-09-21T12:00:00.000Z");
    const lastPurchasedAt = new Date("2026-09-01T12:00:00.000Z").toISOString();
    const lastSuggestedAt = new Date("2026-09-11T12:00:00.000Z").toISOString();

    const result = calculateBurnRatio(
      {
        frequencyDays: 10,
        lastPurchasedAt,
        lastSuggestedAt,
      },
      now
    );

    expect(result.observedDelayDays).toBeCloseTo(10);
    expect(result.effectiveElapsedDays).toBeCloseTo(20);
    expect(result.burnRatio).toBeCloseTo(2.0);
    expect(result.classification).toBe("high_anomaly");

    // High anomaly formula: frequencyDays + 0.4 * (effective_elapsed_days - frequencyDays)
    // 10 + 0.4 * (20 - 10) = 10 + 4 = 14
    expect(result.highAnomalyDays).toBe(14);
    expect(result.adjustedFrequencyDays).toBe(14);
  });

  it("detects low anomaly when needed sooner than expected (burn_ratio <= 0.5)", () => {
    // frequencyDays = 10
    // lastPurchased = 4 days ago (2026-09-01)
    // now = 2026-09-05
    // lastSuggested = null -> observedDelayDays = 0
    // effectiveElapsedDays = elapsed_days = 4 (since elapsed < frequencyDays)
    // burnRatio = 4 / 10 = 0.4 (<= 0.5 -> low_anomaly)
    const now = new Date("2026-09-05T12:00:00.000Z");
    const lastPurchasedAt = new Date("2026-09-01T12:00:00.000Z").toISOString();

    const result = calculateBurnRatio(
      {
        frequencyDays: 10,
        lastPurchasedAt,
        lastSuggestedAt: null,
      },
      now
    );

    expect(result.observedDelayDays).toBe(0);
    expect(result.effectiveElapsedDays).toBeCloseTo(4);
    expect(result.burnRatio).toBeCloseTo(0.4);
    expect(result.classification).toBe("low_anomaly");

    // Low anomaly formula: frequencyDays + 0.4 * (effective_elapsed_days - frequencyDays)
    // 10 + 0.4 * (4 - 10) = 10 + 0.4 * (-6) = 10 - 2.4 = 7.6
    expect(result.lowAnomalyDays).toBe(7.6);
    expect(result.adjustedFrequencyDays).toBe(7.6);
  });

  it("applies safety clamp to between 1 and 90 days", () => {
    // Extreme low: frequencyDays = 2, elapsed = 0 -> clamped to at least 1
    const now = new Date("2026-09-01T12:00:00.000Z");
    const lastPurchasedAt = new Date("2026-09-01T12:00:00.000Z").toISOString();

    const lowResult = calculateBurnRatio(
      {
        frequencyDays: 1,
        lastPurchasedAt,
        lastSuggestedAt: null,
      },
      now
    );
    expect(lowResult.adjustedFrequencyDays).toBeGreaterThanOrEqual(1);

    // Extreme high: frequencyDays = 85, observedDelay = 100 days
    const highNow = new Date("2026-12-01T12:00:00.000Z");
    const highPurchased = new Date("2026-08-01T12:00:00.000Z").toISOString();
    const highSuggested = new Date("2026-08-10T12:00:00.000Z").toISOString();

    const highResult = calculateBurnRatio(
      {
        frequencyDays: 85,
        lastPurchasedAt: highPurchased,
        lastSuggestedAt: highSuggested,
      },
      highNow
    );
    expect(highResult.adjustedFrequencyDays).toBeLessThanOrEqual(90);
  });

  it("does not trigger smart frequency tracking when item has never been bought before (lastPurchasedAt is null)", () => {
    const result = calculateBurnRatio({
      frequencyDays: 7,
      lastPurchasedAt: null,
      lastSuggestedAt: "2026-09-01T12:00:00.000Z",
    });

    expect(result.burnRatio).toBe(1.0);
    expect(result.classification).toBe("normal");
    expect(result.adjustedFrequencyDays).toBe(7);
  });

  it("detects low anomaly for item bought today and suggested in drawer seconds ago", () => {
    // Due in 30 days, bought 10 minutes ago, drawer rendered 5 seconds ago
    const now = new Date("2026-10-01T12:00:05.000Z");
    const lastPurchasedAt = new Date("2026-10-01T11:50:00.000Z").toISOString();
    const lastSuggestedAt = new Date("2026-10-01T12:00:00.000Z").toISOString();

    const result = calculateBurnRatio(
      {
        frequencyDays: 30,
        lastPurchasedAt,
        lastSuggestedAt,
      },
      now
    );

    // elapsedDays is ~0.0069 days (< 30)
    // Even though lastSuggestedAt is set, elapsedDays < frequencyDays sets effectiveElapsedDays = elapsedDays
    expect(result.elapsedDays).toBeLessThan(1);
    expect(result.effectiveElapsedDays).toBeLessThan(1);
    expect(result.burnRatio).toBeLessThanOrEqual(0.5);
    expect(result.classification).toBe("low_anomaly");
  });

  it("evaluates imperative add correctly by substituting lastSuggestedAt with now", () => {
    const now = new Date("2026-10-01T12:00:00.000Z");
    const lastPurchasedAt = new Date("2026-10-01T10:00:00.000Z").toISOString();
    // In imperative add, lastSuggestedAt is substituted for now()
    const substitutedItem = {
      frequencyDays: 30,
      lastPurchasedAt,
      lastSuggestedAt: now.toISOString(),
    };

    const result = calculateBurnRatio(substitutedItem, now);

    expect(result.observedDelayDays).toBe(0);
    expect(result.effectiveElapsedDays).toBeLessThan(1);
    expect(result.burnRatio).toBeLessThanOrEqual(0.5);
    expect(result.classification).toBe("low_anomaly");
  });

  it("does not penalize user who opens app late when drawer was just rendered (sub-minute exposure delay)", () => {
    // frequencyDays = 30, bought 45 days ago, drawer just rendered 10 seconds ago
    const now = new Date("2026-10-15T12:00:10.000Z");
    const lastPurchasedAt = new Date("2026-09-01T12:00:00.000Z").toISOString();
    const lastSuggestedAt = new Date("2026-10-15T12:00:00.000Z").toISOString();

    const result = calculateBurnRatio(
      {
        frequencyDays: 30,
        lastPurchasedAt,
        lastSuggestedAt,
      },
      now
    );

    // 10 seconds delay is < 0.001 days, so effectiveElapsedDays clamps to frequencyDays (30)
    expect(result.elapsedDays).toBeCloseTo(44, 0);
    expect(result.effectiveElapsedDays).toBe(30);
    expect(result.burnRatio).toBe(1.0);
    expect(result.classification).toBe("normal");
  });
});
