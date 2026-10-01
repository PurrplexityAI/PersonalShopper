export function formatRelativeDate(isoDate: string | null): string {
  if (!isoDate) return "Never";
  const target = new Date(isoDate);
  const now = new Date();

  // Strip hours for day comparison
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.round((targetDay - today) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays > 7) return target.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  return target.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return "th";
  }
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function formatDateWithOrdinal(date: Date): string {
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "long" });
  return `${weekday} ${day}${getOrdinalSuffix(day)} ${month}`;
}

export function formatNextDueLabel(isoDate: string | null, now: Date = new Date()): string {
  if (!isoDate) return "No due date scheduled";
  const target = new Date(isoDate);
  if (isNaN(target.getTime())) return "No due date scheduled";

  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.round((targetDay - today) / (24 * 60 * 60 * 1000));

  const formattedDate = formatDateWithOrdinal(target);

  if (diffDays === 0) return `Due today, ${formattedDate}`;
  if (diffDays === 1) return `Due tomorrow, ${formattedDate}`;
  if (diffDays > 1) return `Due in ${diffDays} days, ${formattedDate}`;
  if (diffDays === -1) return `Overdue by 1 day, ${formattedDate}`;
  return `Overdue by ${Math.abs(diffDays)} days, ${formattedDate}`;
}

export function formatLastBoughtLabel(isoDate: string | null, now: Date = new Date()): string {
  if (!isoDate) return "Never bought";
  const target = new Date(isoDate);
  if (isNaN(target.getTime())) return "Never bought";

  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.round((today - targetDay) / (24 * 60 * 60 * 1000));

  const formattedDate = formatDateWithOrdinal(target);

  if (diffDays === 0) return `Bought today, ${formattedDate}`;
  if (diffDays === 1) return `Bought yesterday, ${formattedDate}`;
  if (diffDays > 1) return `Bought ${diffDays} days ago, ${formattedDate}`;
  return `Bought ${formattedDate}`;
}

export function formatFrequencyLabel(item: {
  frequencyDays?: number;
  frequencyLabel?: string;
  autoFrequency?: boolean;
}): string {
  if (!item.frequencyDays || item.frequencyDays <= 0) {
    return "No recurring frequency";
  }
  const label = item.frequencyLabel || `Every ${item.frequencyDays} days`;
  const prefix = item.autoFrequency ? "Needed" : "Repeats";
  if (label.toLowerCase().startsWith("repeats")) {
    return label.replace(/^repeats/i, prefix);
  }
  if (label.toLowerCase().startsWith("needed")) {
    return label.replace(/^needed/i, prefix);
  }
  return `${prefix} ${label.toLowerCase()}`;
}

export function getCategoryColor(category: string): { bg: string; text: string; border: string } {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    "Dairy & Eggs": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    "Produce": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    "Bakery": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
    "Meat & Seafood": { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
    "Pantry Staples": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
    "Beverages": { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
    "Snacks": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    "Condiments & Spices": { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
    "Household": { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
    "Personal Care": { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  };

  return colors[category] || { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };
}
