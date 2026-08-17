

const FOODLOG_STORAGE_KEY = "nutriplan_foodlog";

export const DAILY_GOALS = {
  calories: 2000,
  protein: 50,
  carbs: 250,
  fat: 65,
};

export const state = {
  currentPage: "meals", 

  meals: {
    categories: [],
    allRecipes: [], 
    visibleRecipes: [],
    activeCategory: null,
    searchQuery: "",
    viewMode: "grid", 
    selectedMeal: null,
  },

  products: {
    results: [],
    activeGrade: "",
    activeCategory: null,
  },

  foodlog: {
    entries: loadFoodLogFromStorage(),
  },
};


function loadFoodLogFromStorage() {
  try {
    const raw = localStorage.getItem(FOODLOG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read food log from storage:", err);
    return [];
  }
}

function saveFoodLogToStorage() {
  try {
    localStorage.setItem(FOODLOG_STORAGE_KEY, JSON.stringify(state.foodlog.entries));
  } catch (err) {
    console.error("Failed to save food log to storage:", err);
  }
}

export function addFoodLogEntry(entry) {
  const record = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    servings: 1,
    image: "",
    ...entry,
    loggedAt: new Date().toISOString(),
  };
  state.foodlog.entries.push(record);
  saveFoodLogToStorage();
  return record;
}

export function removeFoodLogEntry(id) {
  state.foodlog.entries = state.foodlog.entries.filter((e) => e.id !== id);
  saveFoodLogToStorage();
}

export function clearFoodLog() {
  state.foodlog.entries = [];
  saveFoodLogToStorage();
}

function isSameDay(isoString, reference = new Date()) {
  const d = new Date(isoString);
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
  );
}

export function getTodayEntries() {
  return state.foodlog.entries.filter((e) => isSameDay(e.loggedAt));
}

export function getTodayTotals() {
  const entries = getTodayEntries();
  return entries.reduce(
    (totals, e) => {
      totals.calories += (e.calories || 0) * (e.servings || 1);
      totals.protein += (e.protein || 0) * (e.servings || 1);
      totals.carbs += (e.carbs || 0) * (e.servings || 1);
      totals.fat += (e.fat || 0) * (e.servings || 1);
      return totals;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function getWeeklyTotals(days = 7) {
  const results = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const dayEntries = state.foodlog.entries.filter((e) => isSameDay(e.loggedAt, day));
    const calories = dayEntries.reduce(
      (sum, e) => sum + (e.calories || 0) * (e.servings || 1),
      0
    );
    results.push({
      date: day,
      label: day.toLocaleDateString(undefined, { weekday: "short" }),
      calories: Math.round(calories),
    });
  }
  return results;
}
