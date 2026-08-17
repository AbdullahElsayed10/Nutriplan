
const SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl";
const PRODUCT_URL = "https://world.openfoodfacts.org/api/v2/product";

const FIELDS = [
  "code",
  "product_name",
  "brands",
  "image_url",
  "image_front_small_url",
  "quantity",
  "nutriscore_grade",
  "nova_group",
  "categories_tags",
  "nutriments",
].join(",");

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OpenFoodFacts request failed (${res.status}) for ${url}`);
  }
  return res.json();
}

function normalizeProduct(p) {
  if (!p) return null;
  const n = p.nutriments || {};
  return {
    barcode: p.code,
    name: p.product_name || "Unnamed product",
    brand: p.brands ? p.brands.split(",")[0].trim() : "",
    image: p.image_url || p.image_front_small_url || "",
    quantity: p.quantity || "",
    grade: (p.nutriscore_grade || "").toLowerCase(),
    nova: p.nova_group || null,
    categories: p.categories_tags || [],
    calories: Math.round(n["energy-kcal_100g"] ?? n["energy-kcal"] ?? 0),
    protein: round1(n["proteins_100g"]),
    carbs: round1(n["carbohydrates_100g"]),
    fat: round1(n["fat_100g"]),
    sugar: round1(n["sugars_100g"]),
  };
}

function round1(value) {
  return typeof value === "number" ? Math.round(value * 10) / 10 : 0;
}

export async function searchProductsByName(query, page = 1, pageSize = 24) {
  const url =
    `${SEARCH_URL}?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1` +
    `&page=${page}&page_size=${pageSize}&fields=${FIELDS}`;
  const data = await fetchJSON(url);
  return (data.products || []).map(normalizeProduct).filter(Boolean);
}

export async function searchProductsByCategory(categoryTag, page = 1, pageSize = 24) {
  const url =
    `${SEARCH_URL}?tagtype_0=categories&tag_contains_0=contains&tag_0=${encodeURIComponent(
      categoryTag
    )}&action=process&json=1&page=${page}&page_size=${pageSize}&fields=${FIELDS}`;
  const data = await fetchJSON(url);
  return (data.products || []).map(normalizeProduct).filter(Boolean);
}

export async function getProductByBarcode(barcode) {
  const url = `${PRODUCT_URL}/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`;
  const data = await fetchJSON(url);
  if (data.status !== 1 || !data.product) return null;
  return normalizeProduct(data.product);
}
