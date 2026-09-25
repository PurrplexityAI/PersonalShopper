export function formatRelativeDate(isoDate: string | null): string {
  if (!isoDate) return 'Never';
  const target = new Date(isoDate);
  const now = new Date();

  // Strip hours for day comparison
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.round((targetDay - today) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays > 7) return target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  return target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function getCategoryColor(category: string): { bg: string; text: string; border: string } {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    'Dairy & Eggs': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    'Produce': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    'Bakery': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'Meat & Seafood': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    'Pantry Staples': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    'Beverages': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    'Snacks': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    'Condiments & Spices': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    'Household': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    'Personal Care': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  };

  return colors[category] || { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
}
