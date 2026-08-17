
const BASE_URL = "https://www.themealdb.com/api/json/v1/1";


async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`MealDB request failed (${res.status}) for ${url}`);
  }
  return res.json();
}

export async function getCategories() {
  const data = await fetchJSON(`${BASE_URL}/categories.php`);
  return data.categories || [];
}


export async function searchMealsByName(query = "") {
  const data = await fetchJSON(
    `${BASE_URL}/search.php?s=${encodeURIComponent(query)}`
  );
  return data.meals || [];
}

export async function getMealById(id) {
  const data = await fetchJSON(`${BASE_URL}/lookup.php?i=${encodeURIComponent(id)}`);
  return (data.meals && data.meals[0]) || null;
}

export async function filterByCategory(category) {
  const data = await fetchJSON(
    `${BASE_URL}/filter.php?c=${encodeURIComponent(category)}`
  );
  return data.meals || [];
}

export async function filterByArea(area) {
  const data = await fetchJSON(`${BASE_URL}/filter.php?a=${encodeURIComponent(area)}`);
  return data.meals || [];
}

export async function getRandomMeal() {
  const data = await fetchJSON(`${BASE_URL}/random.php`);
  return (data.meals && data.meals[0]) || null;
}

export function parseIngredients(meal) {
  if (!meal) return [];
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (name && name.trim()) {
      ingredients.push({
        name: name.trim(),
        measure: measure ? measure.trim() : "",
      });
    }
  }
  return ingredients;
}

export function parseInstructions(meal) {
  if (!meal || !meal.strInstructions) return [];
  return meal.strInstructions
    .split(/\r?\n+/)
    .map((step) => step.replace(/^\s*(step\s*)?\d+[\.\):-]?\s*/i, "").trim())
    .filter((step) => step.length > 0);
}
