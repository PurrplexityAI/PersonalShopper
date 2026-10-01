import type { PantryItem } from "~~/shared/types";

export type AnomalyClassification = "low_anomaly" | "normal" | "high_anomaly";

export interface BurnRatioResult {
  elapsedDays: number;
  observedDelayDays: number;
  effectiveElapsedDays: number;
  burnRatio: number;
  classification: AnomalyClassification;
  standardEwmaDays: number;
  highAnomalyDays: number;
  lowAnomalyDays: number;
  adjustedFrequencyDays: number;
}

/**
 * Calculates the true burn ratio and adjustment formulas according to Section 2 specification.
 *
 * Step A: Calculate Elapsed Time & Exposure Delay
 * seconds_per_day = 86400
 * now_seconds = current time in seconds
 * anchor_timestamp = lastPurchasedAt in seconds
 * elapsed_days = (now_seconds - anchor_timestamp) / seconds_per_day
 * If lastSuggestedAt is empty OR lastSuggestedAt is less than lastPurchasedAt:
 *   observed_delay_days = 0
 * Else:
 *   observed_delay_days = (now_seconds - lastSuggestedAt_in_seconds) / seconds_per_day
 *
 * Step B: Calculate Effective Burn Ratio
 * If observed_delay_days == 0:
 *   If elapsed_days < frequencyDays then effective_elapsed_days = elapsed_days
 *   Else effective_elapsed_days = frequencyDays
 * Else:
 *   effective_elapsed_days = frequencyDays + observed_delay_days
 * burn_ratio = effective_elapsed_days / frequencyDays
 *
 * Step C: The Three Adjustment Formulas
 * Standard EWMA (Normal variance, burn_ratio > 0.5 and < 1.8):
 *   frequencyDays = (0.8 * frequencyDays) + (0.2 * effective_elapsed_days)
 * High Anomaly (Usage slowed down, burn_ratio >= 1.8):
 *   frequencyDays = frequencyDays + (0.4 * (effective_elapsed_days - frequencyDays))
 * Low Anomaly (Usage increased, burn_ratio <= 0.5):
 *   frequencyDays = frequencyDays + (0.4 * (effective_elapsed_days - frequencyDays))
 * Safety Clamp (Applied after any adjustment):
 *   frequencyDays = maximum(1, minimum(90, round(frequencyDays)))
 */
export function calculateBurnRatio(
  item: Pick<PantryItem, "frequencyDays" | "lastPurchasedAt" | "lastSuggestedAt"> & { createdAt?: string },
  now: Date = new Date()
): BurnRatioResult {
  const seconds_per_day = 86400;
  const now_seconds = now.getTime() / 1000;

  const frequencyDays = Number(item.frequencyDays) > 0 ? Number(item.frequencyDays) : 7;

  // If item has never been bought before (lastPurchasedAt is null), don't trigger smart frequency tracking
  if (!item.lastPurchasedAt) {
    return {
      elapsedDays: 0,
      observedDelayDays: 0,
      effectiveElapsedDays: frequencyDays,
      burnRatio: 1.0,
      classification: "normal",
      standardEwmaDays: frequencyDays,
      highAnomalyDays: frequencyDays,
      lowAnomalyDays: frequencyDays,
      adjustedFrequencyDays: frequencyDays,
    };
  }

  // Anchor timestamp: lastPurchasedAt in seconds (fallback to createdAt or now)
  let anchor_timestamp: number;
  if (item.lastPurchasedAt) {
    anchor_timestamp = new Date(item.lastPurchasedAt).getTime() / 1000;
  } else if (item.createdAt) {
    anchor_timestamp = new Date(item.createdAt).getTime() / 1000;
  } else {
    anchor_timestamp = now_seconds;
  }

  const elapsed_days = Math.max(0, (now_seconds - anchor_timestamp) / seconds_per_day);

  let observed_delay_days = 0;
  if (item.lastSuggestedAt) {
    const lastSuggestedSeconds = new Date(item.lastSuggestedAt).getTime() / 1000;
    if (!item.lastPurchasedAt || lastSuggestedSeconds >= anchor_timestamp) {
      observed_delay_days = Math.max(0, (now_seconds - lastSuggestedSeconds) / seconds_per_day);
    }
  }

  // Step B: Calculate Effective Burn Ratio
  let effective_elapsed_days: number;
  if (elapsed_days < frequencyDays) {
    effective_elapsed_days = elapsed_days;
  } else if (observed_delay_days === 0 || observed_delay_days < 0.001) {
    effective_elapsed_days = frequencyDays;
  } else {
    effective_elapsed_days = frequencyDays + observed_delay_days;
  }

  const burn_ratio = effective_elapsed_days / frequencyDays;

  // Step C: Three Adjustment Formulas & Safety Clamp
  function clampAndSmooth(val: number): number {
    const clamped = Math.max(1, Math.min(90, val));
    return Math.round(clamped * 100) / 100;
  }

  const standardEwmaDays = clampAndSmooth((0.8 * frequencyDays) + (0.2 * effective_elapsed_days));
  const highAnomalyDays = clampAndSmooth(frequencyDays + (0.4 * (effective_elapsed_days - frequencyDays)));
  const lowAnomalyDays = clampAndSmooth(frequencyDays + (0.4 * (effective_elapsed_days - frequencyDays)));

  let classification: AnomalyClassification;
  let adjustedFrequencyDays: number;

  if (burn_ratio <= 0.5) {
    classification = "low_anomaly";
    adjustedFrequencyDays = lowAnomalyDays;
  } else if (burn_ratio >= 1.8) {
    classification = "high_anomaly";
    adjustedFrequencyDays = highAnomalyDays;
  } else {
    classification = "normal";
    adjustedFrequencyDays = standardEwmaDays;
  }

  return {
    elapsedDays: elapsed_days,
    observedDelayDays: observed_delay_days,
    effectiveElapsedDays: effective_elapsed_days,
    burnRatio: burn_ratio,
    classification,
    standardEwmaDays,
    highAnomalyDays,
    lowAnomalyDays,
    adjustedFrequencyDays,
  };
}
