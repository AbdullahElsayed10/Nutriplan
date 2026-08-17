
const BASE_URL = "https://api.nal.usda.gov/fdc/v1";
const API_KEY = "XKEFdjXqvnpocfZm4ztFVYBrPYLWNOofdtSV86bb";

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`USDA request failed (${res.status}) for ${url}`);
  }
  return res.json();
}

export async function searchFoods(query, pageSize = 10) {
  const url =
    `${BASE_URL}/foods/search?api_key=${API_KEY}` +
    `&query=${encodeURIComponent(query)}&pageSize=${pageSize}`;
  const data = await fetchJSON(url);
  return (data.foods || []).map(normalizeFood);
}

function normalizeFood(food) {
  const nutrients = food.foodNutrients || [];
  const get = (name) => {
    const match = nutrients.find((n) =>
      (n.nutrientName || "").toLowerCase().includes(name)
    );
    return match ? Math.round((match.value ?? 0) * 10) / 10 : 0;
  };
  return {
    fdcId: food.fdcId,
    name: food.description,
    brand: food.brandOwner || food.brandName || "",
    calories: get("energy"),
    protein: get("protein"),
    carbs: get("carbohydrate"),
    fat: get("total lipid"),
  };
}
