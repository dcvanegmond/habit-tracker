// Pure habit logic. No DOM access here, so everything is easy to unit test.

const STORAGE_KEY = 'habit-tracker:v1';

/** Returns a local date key like "2026-11-16". */
export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns the date key for the day before the given key. */
export function previousDayKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return todayKey(new Date(y, m - 1, d - 1));
}

export function createHabit(name, now = new Date()) {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) {
    throw new Error('Habit name cannot be empty');
  }
  return {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    name: trimmed,
    createdAt: todayKey(now),
    completions: [],
  };
}

export function isDoneOn(habit, key) {
  return habit.completions.includes(key);
}

/** Returns a new habit with the given day toggled done/not done. */
export function toggleCompletion(habit, key) {
  const completions = isDoneOn(habit, key)
    ? habit.completions.filter((k) => k !== key)
    : [...habit.completions, key].sort();
  return { ...habit, completions };
}

/** Returns a new array without the habit with the given id. */
export function deleteHabit(habits, id) {
  return habits.filter((h) => h.id !== id);
}

/**
 * Number of consecutive days the habit was done, ending today.
 * If today isn't done yet, the streak up to yesterday still counts.
 */
export function currentStreak(habit, today = todayKey()) {
  let key = isDoneOn(habit, today) ? today : previousDayKey(today);
  let streak = 0;
  while (isDoneOn(habit, key)) {
    streak += 1;
    key = previousDayKey(key);
  }
  return streak;
}

export function loadHabits(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHabits(storage, habits) {
  storage.setItem(STORAGE_KEY, JSON.stringify(habits));
}
