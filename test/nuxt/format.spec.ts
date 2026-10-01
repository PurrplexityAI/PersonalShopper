import { describe, it, expect } from "vitest";
import {
  getOrdinalSuffix,
  formatDateWithOrdinal,
  formatNextDueLabel,
  formatLastBoughtLabel,
  formatFrequencyLabel,
} from "~~/app/utils/format";

describe("Format Utilities", () => {
  describe("getOrdinalSuffix", () => {
    it("returns correct suffix for ordinal numbers", () => {
      expect(getOrdinalSuffix(1)).toBe("st");
      expect(getOrdinalSuffix(2)).toBe("nd");
      expect(getOrdinalSuffix(3)).toBe("rd");
      expect(getOrdinalSuffix(4)).toBe("th");
      expect(getOrdinalSuffix(11)).toBe("th");
      expect(getOrdinalSuffix(12)).toBe("th");
      expect(getOrdinalSuffix(13)).toBe("th");
      expect(getOrdinalSuffix(21)).toBe("st");
      expect(getOrdinalSuffix(22)).toBe("nd");
      expect(getOrdinalSuffix(23)).toBe("rd");
      expect(getOrdinalSuffix(24)).toBe("th");
      expect(getOrdinalSuffix(31)).toBe("st");
    });
  });

  describe("formatDateWithOrdinal", () => {
    it("formats date with weekday, day with ordinal, and full month", () => {
      // 2026-09-08 is Tuesday
      const date = new Date(2026, 8, 8, 12, 0, 0); // month is 0-indexed (8 = September)
      const formatted = formatDateWithOrdinal(date);
      expect(formatted).toBe("Tuesday 8th September");
    });

    it("formats first of the month correctly", () => {
      // 2026-10-01 is Thursday
      const date = new Date(2026, 9, 1, 12, 0, 0);
      const formatted = formatDateWithOrdinal(date);
      expect(formatted).toBe("Thursday 1st October");
    });
  });

  describe("formatNextDueLabel", () => {
    const fixedNow = new Date(2026, 8, 20, 12, 0, 0); // Sunday 20th September 2026

    it("returns 'No due date scheduled' when isoDate is null or invalid", () => {
      expect(formatNextDueLabel(null, fixedNow)).toBe("No due date scheduled");
      expect(formatNextDueLabel("invalid-date", fixedNow)).toBe("No due date scheduled");
    });

    it("formats due today correctly", () => {
      const todayIso = new Date(2026, 8, 20, 18, 0, 0).toISOString();
      expect(formatNextDueLabel(todayIso, fixedNow)).toBe("Due today, Sunday 20th September");
    });

    it("formats due tomorrow correctly", () => {
      const tomorrowIso = new Date(2026, 8, 21, 12, 0, 0).toISOString();
      expect(formatNextDueLabel(tomorrowIso, fixedNow)).toBe("Due tomorrow, Monday 21st September");
    });

    it("formats due in N days correctly with date shown", () => {
      const due7Days = new Date(2026, 8, 27, 12, 0, 0).toISOString();
      expect(formatNextDueLabel(due7Days, fixedNow)).toBe("Due in 7 days, Sunday 27th September");
    });

    it("formats overdue by 1 day correctly", () => {
      const overdue1 = new Date(2026, 8, 19, 12, 0, 0).toISOString();
      expect(formatNextDueLabel(overdue1, fixedNow)).toBe("Overdue by 1 day, Saturday 19th September");
    });

    it("formats overdue by multiple days correctly", () => {
      const overdue4 = new Date(2026, 8, 16, 12, 0, 0).toISOString();
      expect(formatNextDueLabel(overdue4, fixedNow)).toBe("Overdue by 4 days, Wednesday 16th September");
    });
  });

  describe("formatLastBoughtLabel", () => {
    const fixedNow = new Date(2026, 8, 20, 12, 0, 0); // Sunday 20th September 2026

    it("returns 'Never bought' when isoDate is null or invalid", () => {
      expect(formatLastBoughtLabel(null, fixedNow)).toBe("Never bought");
      expect(formatLastBoughtLabel("invalid-date", fixedNow)).toBe("Never bought");
    });

    it("formats bought today correctly", () => {
      const todayIso = new Date(2026, 8, 20, 9, 0, 0).toISOString();
      expect(formatLastBoughtLabel(todayIso, fixedNow)).toBe("Bought today, Sunday 20th September");
    });

    it("formats bought yesterday correctly", () => {
      const yesterdayIso = new Date(2026, 8, 19, 12, 0, 0).toISOString();
      expect(formatLastBoughtLabel(yesterdayIso, fixedNow)).toBe("Bought yesterday, Saturday 19th September");
    });

    it("formats bought N days ago correctly with date shown", () => {
      const bought3DaysAgo = new Date(2026, 8, 17, 12, 0, 0).toISOString();
      expect(formatLastBoughtLabel(bought3DaysAgo, fixedNow)).toBe("Bought 3 days ago, Thursday 17th September");
    });
  });

  describe("formatFrequencyLabel", () => {
    it("returns 'No recurring frequency' when frequencyDays <= 0 or missing", () => {
      expect(formatFrequencyLabel({ frequencyDays: 0 })).toBe("No recurring frequency");
    });

    it("formats frequency labels with implicit phrasing", () => {
      expect(formatFrequencyLabel({ frequencyDays: 7, frequencyLabel: "Weekly (7d)" })).toBe("Repeats weekly (7d)");
      expect(formatFrequencyLabel({ frequencyDays: 14, frequencyLabel: "Every 2 weeks (14d)" })).toBe("Repeats every 2 weeks (14d)");
      expect(formatFrequencyLabel({ frequencyDays: 1, frequencyLabel: "Daily" })).toBe("Repeats daily");
      expect(formatFrequencyLabel({ frequencyDays: 5 })).toBe("Repeats every 5 days");
    });

    it("uses 'Needed' rather than 'Repeats' when autoFrequency is true", () => {
      expect(formatFrequencyLabel({ frequencyDays: 7, frequencyLabel: "Weekly (7d)", autoFrequency: true })).toBe("Needed weekly (7d)");
      expect(formatFrequencyLabel({ frequencyDays: 14, frequencyLabel: "Every 2 weeks (14d)", autoFrequency: true })).toBe("Needed every 2 weeks (14d)");
      expect(formatFrequencyLabel({ frequencyDays: 5, autoFrequency: true })).toBe("Needed every 5 days");
      expect(formatFrequencyLabel({ frequencyDays: 7, frequencyLabel: "Weekly (7d)", autoFrequency: false })).toBe("Repeats weekly (7d)");
    });
  });
});
