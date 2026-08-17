import * as mealdb from "./api/mealdb.js";
import * as off from "./api/openfoodfacts.js";
import * as usda from "./api/usda.js";
import {
  state,
  DAILY_GOALS,
  addFoodLogEntry,
  removeFoodLogEntry,
  clearFoodLog,
  getTodayEntries,
  getTodayTotals,
  getWeeklyTotals,
} from "./state/appState.js";
import * as ui from "./ui/components.js";
import { initNavigation, showPage } from "./ui/navigation.js";

const el = {
  loadingOverlay: document.getElementById("app-loading-overlay"),

  categoriesGrid: document.getElementById("categories-grid"),
  recipesGrid: document.getElementById("recipes-grid"),
  recipesCount: document.getElementById("recipes-count"),
  searchInput: document.getElementById("search-input"),
  quickFilterPills: document.getElementById("quick-filter-pills"),
  gridViewBtn: document.getElementById("grid-view-btn"),
  listViewBtn: document.getElementById("list-view-btn"),

  mealBadges: document.getElementById("meal-badges"),
  mealTitle: document.getElementById("meal-title"),
  mealHeroImage: document.getElementById("meal-hero-image"),
  heroServings: document.getElementById("hero-servings"),
  heroCalories: document.getElementById("hero-calories"),
  ingredientsCount: document.getElementById("ingredients-count"),
  ingredientsList: document.getElementById("ingredients-list"),
  instructionsList: document.getElementById("instructions-list"),
  videoSection: document.getElementById("meal-video-section"),
  videoIframe: document.getElementById("meal-video-iframe"),
  nutritionContainer: document.getElementById("nutrition-facts-container"),
  backToMealsBtn: document.getElementById("back-to-meals-btn"),
  logMealBtn: document.getElementById("log-meal-btn"),

  productSearchInput: document.getElementById("product-search-input"),
  searchProductBtn: document.getElementById("search-product-btn"),
  barcodeInput: document.getElementById("barcode-input"),
  lookupBarcodeBtn: document.getElementById("lookup-barcode-btn"),
  productsGrid: document.getElementById("products-grid"),
  productsCount: document.getElementById("products-count"),
  productCategories: document.getElementById("product-categories"),

  foodlogDate: document.getElementById("foodlog-date"),
  loggedItemsList: document.getElementById("logged-items-list"),
  clearFoodlogBtn: document.getElementById("clear-foodlog"),
  weeklyChart: document.getElementById("weekly-chart"),
};

function toast(icon, title) {
  Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title,
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  });
}

async function loadInitialMealsData() {
  el.categoriesGrid.innerHTML = ui.skeletonCardsHTML(6);
  el.recipesGrid.innerHTML = ui.skeletonCardsHTML(8);

  const [categories, recipes] = await Promise.all([
    mealdb.getCategories(),
    mealdb.searchMealsByName(""),
  ]);

  state.meals.categories = categories;
  state.meals.allRecipes = recipes;
  state.meals.visibleRecipes = recipes;

  renderCategories();
  renderRecipes();
}

function renderCategories() {
  const categories = state.meals.categories;
  el.categoriesGrid.innerHTML = categories.length
    ? categories.map(ui.categoryCardHTML).join("")
    : ui.emptyStateHTML("No categories available");
}

function renderRecipes() {
  const recipes = state.meals.visibleRecipes;
  el.recipesGrid.className =
    state.meals.viewMode === "list"
      ? "grid grid-cols-1 gap-3"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5";

  el.recipesGrid.innerHTML = recipes.length
    ? recipes.map((m) => ui.recipeCardHTML(m, state.meals.viewMode)).join("")
    : ui.emptyStateHTML("No recipes found", "Try a different search or category");

  el.recipesCount.textContent = `Showing ${recipes.length} recipe${
    recipes.length === 1 ? "" : "s"
  }`;
}

function applyMealFilters() {
  const query = state.meals.searchQuery.trim().toLowerCase();
  let list = state.meals.allRecipes;

  if (query) {
    list = list.filter((m) => {
      return (
        (m.strMeal || "").toLowerCase().includes(query) ||
        (m.strCategory || "").toLowerCase().includes(query) ||
        (m.strArea || "").toLowerCase().includes(query) ||
        (m.strTags || "").toLowerCase().includes(query)
      );
    });
  }

  state.meals.visibleRecipes = list;
  renderRecipes();
}

let searchDebounceTimer = null;
function onSearchInput(event) {
  state.meals.searchQuery = event.target.value;
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(applyMealFilters, 250);
}

async function onCategoryCardClick(event) {
  const card = event.target.closest(".category-card");
  if (!card) return;
  const category = card.dataset.category;

  document
    .querySelectorAll(".category-card")
    .forEach((c) => c.classList.remove("border-emerald-500", "ring-2", "ring-emerald-300"));
  card.classList.add("border-emerald-500", "ring-2", "ring-emerald-300");

  el.recipesGrid.innerHTML = ui.skeletonCardsHTML(8);
  try {
    const meals = await mealdb.filterByCategory(category);
    state.meals.visibleRecipes = meals;
    renderRecipes();
  } catch (err) {
    console.error(err);
    el.recipesGrid.innerHTML = ui.errorStateHTML("Couldn't load that category");
  }
}

async function onQuickFilterPillClick(event) {
  const btn = event.target.closest(".quick-filter-pill");
  if (!btn) return;

  document.querySelectorAll(".quick-filter-pill").forEach((p) => {
    p.classList.remove("bg-emerald-600", "text-white");
    p.classList.add("bg-gray-100", "text-gray-700");
  });
  btn.classList.add("bg-emerald-600", "text-white");
  btn.classList.remove("bg-gray-100", "text-gray-700");

  const area = btn.dataset.area;
  if (!area) {
    state.meals.visibleRecipes = state.meals.allRecipes;
    renderRecipes();
    return;
  }

  el.recipesGrid.innerHTML = ui.skeletonCardsHTML(8);
  try {
    const meals = await mealdb.filterByArea(area);
    state.meals.visibleRecipes = meals;
    renderRecipes();
  } catch (err) {
    console.error(err);
    el.recipesGrid.innerHTML = ui.errorStateHTML("Couldn't load that cuisine");
  }
}

function setViewMode(mode) {
  state.meals.viewMode = mode;
  el.gridViewBtn.classList.toggle("bg-white", mode === "grid");
  el.gridViewBtn.classList.toggle("shadow-sm", mode === "grid");
  el.listViewBtn.classList.toggle("bg-white", mode === "list");
  el.listViewBtn.classList.toggle("shadow-sm", mode === "list");
  renderRecipes();
}

async function onRecipeCardClick(event) {
  const card = event.target.closest(".recipe-card");
  if (!card) return;
  const mealId = card.dataset.mealId;

  showPage("meal-details");
  el.instructionsList.innerHTML = ui.skeletonCardsHTML(3);

  try {
    const meal = await mealdb.getMealById(mealId);
    if (!meal) throw new Error("Meal not found");
    state.meals.selectedMeal = meal;
    renderMealDetails(meal);
  } catch (err) {
    console.error(err);
    toast("error", "Couldn't load that recipe");
    showPage("meals");
  }
}

function renderMealDetails(meal) {
  el.mealHeroImage.src = meal.strMealThumb;
  el.mealHeroImage.alt = meal.strMeal;
  el.mealTitle.textContent = meal.strMeal;
  document.title = `${meal.strMeal} — NutriPlan`;

  const tags = (meal.strTags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const badges = [meal.strCategory, meal.strArea, ...tags].filter(Boolean);
  const badgeColors = ["bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-amber-500"];
  el.mealBadges.innerHTML = badges
    .map(
      (b, i) =>
        `<span class="px-3 py-1 ${badgeColors[i % badgeColors.length]} text-white text-sm font-semibold rounded-full">${ui.escapeHTML(
          b
        )}</span>`
    )
    .join("");

  el.heroServings?.closest("span")?.classList.add("hidden");
  el.heroCalories?.closest("span")?.classList.add("hidden");
  el.nutritionContainer.innerHTML = `
    <div class="text-center py-8 text-gray-500">
      <i class="fa-solid fa-circle-info text-3xl mb-3 text-gray-300"></i>
      <p class="font-medium text-sm">Nutrition facts aren't provided for this recipe.</p>
      <p class="text-xs text-gray-400 mt-1">Try the Product Scanner or Custom Entry in Food Log for exact values.</p>
    </div>`;

  const ingredients = mealdb.parseIngredients(meal);
  el.ingredientsCount.textContent = `${ingredients.length} item${
    ingredients.length === 1 ? "" : "s"
  }`;
  el.ingredientsList.innerHTML = ingredients.map(ui.ingredientRowHTML).join("");

  const instructions = mealdb.parseInstructions(meal);
  el.instructionsList.innerHTML = instructions.length
    ? instructions.map((step, i) => ui.instructionStepHTML(step, i)).join("")
    : `<p class="text-gray-500 text-sm">No instructions provided.</p>`;

  if (meal.strYoutube) {
    el.videoSection.style.display = "";
    const videoId = extractYoutubeId(meal.strYoutube);
    el.videoIframe.src = videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  } else {
    el.videoSection.style.display = "none";
  }
}

function extractYoutubeId(url) {
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
}

function onIngredientToggle(event) {
  if (!event.target.classList.contains("ingredient-checkbox")) return;
  const label = event.target.parentElement.querySelector(".ingredient-label");
  if (!label) return;
  label.classList.toggle("line-through", event.target.checked);
  label.classList.toggle("text-gray-400", event.target.checked);
}

async function onLogMealClick() {
  const meal = state.meals.selectedMeal;
  if (!meal) return;

  const { value: formValues } = await Swal.fire({
    title: "Log this meal",
    html: `
      <div style="text-align:left;display:grid;gap:8px;">
        <label style="font-size:13px;color:#374151;">Calories per serving
          <input id="swal-calories" type="number" min="0" value="450" class="swal2-input" style="margin:4px 0;">
        </label>
        <label style="font-size:13px;color:#374151;">Protein (g)
          <input id="swal-protein" type="number" min="0" value="25" class="swal2-input" style="margin:4px 0;">
        </label>
        <label style="font-size:13px;color:#374151;">Carbs (g)
          <input id="swal-carbs" type="number" min="0" value="40" class="swal2-input" style="margin:4px 0;">
        </label>
        <label style="font-size:13px;color:#374151;">Fat (g)
          <input id="swal-fat" type="number" min="0" value="15" class="swal2-input" style="margin:4px 0;">
        </label>
      </div>
      <p style="font-size:12px;color:#9ca3af;margin-top:6px;">MealDB doesn't provide nutrition data — adjust these to match the recipe.</p>
    `,
    confirmButtonText: "Add to Food Log",
    confirmButtonColor: "#059669",
    showCancelButton: true,
    focusConfirm: false,
    preConfirm: () => ({
      calories: Number(document.getElementById("swal-calories").value) || 0,
      protein: Number(document.getElementById("swal-protein").value) || 0,
      carbs: Number(document.getElementById("swal-carbs").value) || 0,
      fat: Number(document.getElementById("swal-fat").value) || 0,
    }),
  });

  if (!formValues) return;

  addFoodLogEntry({
    name: meal.strMeal,
    image: meal.strMealThumb,
    source: "meal",
    ...formValues,
  });

  toast("success", "Added to your food log");
  if (state.currentPage === "foodlog") renderFoodLogPage();
}

function renderProducts(products) {
  el.productsGrid.innerHTML = products.length
    ? products.map(ui.productCardHTML).join("")
    : ui.emptyStateHTML("No products found", "Try a different search term or barcode");
  el.productsCount.textContent = products.length
    ? `${products.length} product${products.length === 1 ? "" : "s"} found`
    : "Search for products to see results";
}

function applyGradeFilter() {
  const grade = state.products.activeGrade;
  const filtered = grade
    ? state.products.results.filter((p) => p.grade === grade)
    : state.products.results;
  renderProducts(filtered);
}

async function onSearchProductClick() {
  const query = el.productSearchInput.value.trim();
  if (!query) return;

  el.productsGrid.innerHTML = ui.skeletonCardsHTML(8);
  try {
    const products = await off.searchProductsByName(query);
    state.products.results = products;
    state.products.activeGrade = "";
    resetGradeFilterButtons();
    renderProducts(products);
  } catch (err) {
    console.error(err);
    el.productsGrid.innerHTML = ui.errorStateHTML("Couldn't reach the product database");
  }
}

async function onLookupBarcodeClick() {
  const barcode = el.barcodeInput.value.trim();
  if (!barcode) return;

  el.productsGrid.innerHTML = ui.skeletonCardsHTML(4);
  try {
    const product = await off.getProductByBarcode(barcode);
    if (!product) {
      el.productsGrid.innerHTML = ui.emptyStateHTML(
        "No product found",
        `Nothing matched barcode ${barcode}`
      );
      state.products.results = [];
      el.productsCount.textContent = "Search for products to see results";
      return;
    }
    state.products.results = [product];
    state.products.activeGrade = "";
    resetGradeFilterButtons();
    renderProducts([product]);
  } catch (err) {
    console.error(err);
    el.productsGrid.innerHTML = ui.errorStateHTML("Couldn't reach the product database");
  }
}

function resetGradeFilterButtons() {
  document.querySelectorAll(".nutri-score-filter").forEach((btn) => {
    const isAll = btn.dataset.grade === "";
    btn.classList.toggle("bg-emerald-600", isAll);
    btn.classList.toggle("text-white", isAll);
  });
}

function onGradeFilterClick(event) {
  const btn = event.target.closest(".nutri-score-filter");
  if (!btn) return;

  document.querySelectorAll(".nutri-score-filter").forEach((b) => {
    b.classList.remove("bg-emerald-600", "text-white");
  });
  btn.classList.add("bg-emerald-600", "text-white");

  state.products.activeGrade = btn.dataset.grade || "";
  applyGradeFilter();
}

async function onProductCategoryClick(event) {
  const btn = event.target.closest(".product-category-btn");
  if (!btn) return;
  const tag = btn.dataset.category;

  el.productsGrid.innerHTML = ui.skeletonCardsHTML(8);
  try {
    const products = await off.searchProductsByCategory(tag);
    state.products.results = products;
    state.products.activeGrade = "";
    resetGradeFilterButtons();
    renderProducts(products);
  } catch (err) {
    console.error(err);
    el.productsGrid.innerHTML = ui.errorStateHTML("Couldn't load that category");
  }
}

async function onProductCardClick(event) {
  const card = event.target.closest(".product-card");
  if (!card) return;
  const barcode = card.dataset.barcode;
  const product = state.products.results.find((p) => p.barcode === barcode);
  if (!product) return;

  const result = await Swal.fire({
    title: product.name,
    html: `
      ${product.brand ? `<p style="color:#059669;font-weight:600;">${ui.escapeHTML(product.brand)}</p>` : ""}
      <img src="${ui.escapeHTML(product.image)}" style="max-height:160px;margin:10px auto;object-fit:contain;" />
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;text-align:left;font-size:14px;">
        <div><strong>Calories</strong><br>${product.calories} kcal/100g</div>
        <div><strong>Protein</strong><br>${product.protein} g</div>
        <div><strong>Carbs</strong><br>${product.carbs} g</div>
        <div><strong>Fat</strong><br>${product.fat} g</div>
        <div><strong>Sugar</strong><br>${product.sugar} g</div>
        <div><strong>Nutri-Score</strong><br>${product.grade ? product.grade.toUpperCase() : "N/A"}</div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Log to Food Log (per 100g)",
    confirmButtonColor: "#059669",
    cancelButtonText: "Close",
  });

  if (result.isConfirmed) {
    addFoodLogEntry({
      name: product.name,
      image: product.image,
      source: "product",
      calories: product.calories,
      protein: product.protein,
      carbs: product.carbs,
      fat: product.fat,
    });
    toast("success", "Added to your food log");
    if (state.currentPage === "foodlog") renderFoodLogPage();
  }
}

const PROGRESS_KEYS = ["calories", "protein", "carbs", "fat"];

function updateProgressBars(totals) {
  const cards = document.querySelectorAll("#foodlog-today-section .grid > div");
  PROGRESS_KEYS.forEach((key, i) => {
    const card = cards[i];
    if (!card) return;
    const goal = DAILY_GOALS[key];
    const value = totals[key];
    const unit = key === "calories" ? "kcal" : "g";
    const pct = Math.min(100, Math.round((value / goal) * 100));

    const valueLabel = card.querySelector("span.text-gray-500");
    if (valueLabel) valueLabel.textContent = `${Math.round(value)} / ${goal} ${unit}`;

    const bar = card.querySelector("div.h-2\\.5");
    if (bar) bar.style.width = `${pct}%`;
  });
}

function renderWeeklyChart() {
  const weekly = getWeeklyTotals(7);
  const x = weekly.map((d) => d.label);
  const y = weekly.map((d) => d.calories);

  el.weeklyChart.innerHTML = "";
  Plotly.newPlot(
    el.weeklyChart,
    [
      {
        x,
        y,
        type: "bar",
        marker: { color: "#059669" },
        hovertemplate: "%{y} kcal<extra></extra>",
      },
    ],
    {
      margin: { t: 10, r: 10, l: 40, b: 30 },
      yaxis: { title: "kcal" },
      height: 256,
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
    },
    { displayModeBar: false, responsive: true }
  );
}

function renderFoodLogPage() {
  el.foodlogDate.textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const totals = getTodayTotals();
  updateProgressBars(totals);

  const todayEntries = getTodayEntries();
  const heading = document.querySelector("#foodlog-today-section h4");
  if (heading) heading.textContent = `Logged Items (${todayEntries.length})`;

  el.loggedItemsList.innerHTML = todayEntries.length
    ? todayEntries.map(ui.foodLogItemHTML).join("")
    : `
      <div class="text-center py-8 text-gray-500">
        <i class="fa-solid fa-utensils text-4xl mb-3 text-gray-300"></i>
        <p class="font-medium">No meals logged today</p>
        <p class="text-sm">Add meals from the Meals page or scan products</p>
      </div>`;

  el.clearFoodlogBtn.style.display = todayEntries.length ? "" : "none";

  renderWeeklyChart();
}

function onLoggedItemsListClick(event) {
  const btn = event.target.closest(".remove-log-item-btn");
  if (!btn) return;
  removeFoodLogEntry(btn.dataset.logId);
  renderFoodLogPage();
}

async function onClearFoodLogClick() {
  const result = await Swal.fire({
    title: "Clear today's food log?",
    text: "This removes every logged item. This can't be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Clear all",
    confirmButtonColor: "#ef4444",
  });
  if (!result.isConfirmed) return;
  clearFoodLog();
  renderFoodLogPage();
  toast("success", "Food log cleared");
}

async function onQuickLogClick(event) {
  const btn = event.target.closest(".quick-log-btn");
  if (!btn) return;
  const label = btn.querySelector("p")?.textContent || "";

  if (label.includes("Log a Meal")) {
    showPage("meals");
  } else if (label.includes("Scan Product")) {
    showPage("products");
  } else if (label.includes("Custom Entry")) {
    await handleCustomEntry();
  }
}

async function handleCustomEntry() {
  const { value: query } = await Swal.fire({
    title: "Custom Food Entry",
    input: "text",
    inputLabel: "Search the USDA food database",
    inputPlaceholder: "e.g. banana, grilled chicken breast...",
    showCancelButton: true,
    confirmButtonText: "Search",
    confirmButtonColor: "#059669",
  });
  if (!query) return;

  Swal.fire({
    title: "Searching...",
    didOpen: () => Swal.showLoading(),
    allowOutsideClick: false,
  });

  let foods = [];
  try {
    foods = await usda.searchFoods(query, 8);
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Couldn't reach the USDA database. Try again shortly.", "error");
    return;
  }

  if (!foods.length) {
    Swal.fire("No results", `No foods found for "${query}".`, "info");
    return;
  }

  const options = {};
  foods.forEach((food, i) => {
    options[i] = `${food.name}${food.brand ? " — " + food.brand : ""} (${food.calories} kcal)`;
  });

  const { value: selectedIndex } = await Swal.fire({
    title: "Select a food",
    input: "select",
    inputOptions: options,
    showCancelButton: true,
    confirmButtonText: "Log it",
    confirmButtonColor: "#059669",
  });
  if (selectedIndex === undefined || selectedIndex === "") return;

  const food = foods[selectedIndex];
  addFoodLogEntry({
    name: food.name,
    source: "custom",
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
  });

  toast("success", "Added to your food log");
  renderFoodLogPage();
}

// =====================================================================
// INIT
// =====================================================================

function wireEvents() {
  el.searchInput.addEventListener("input", onSearchInput);
  el.categoriesGrid.addEventListener("click", onCategoryCardClick);
  el.quickFilterPills.addEventListener("click", onQuickFilterPillClick);
  el.recipesGrid.addEventListener("click", onRecipeCardClick);
  el.gridViewBtn.addEventListener("click", () => setViewMode("grid"));
  el.listViewBtn.addEventListener("click", () => setViewMode("list"));
  el.backToMealsBtn.addEventListener("click", () => showPage("meals"));
  el.logMealBtn.addEventListener("click", onLogMealClick);
  el.ingredientsList.addEventListener("change", onIngredientToggle);

  el.searchProductBtn.addEventListener("click", onSearchProductClick);
  el.productSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onSearchProductClick();
  });
  el.lookupBarcodeBtn.addEventListener("click", onLookupBarcodeClick);
  el.barcodeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onLookupBarcodeClick();
  });
  document.getElementById("nutri-score-filters").addEventListener("click", onGradeFilterClick);
  el.productCategories.addEventListener("click", onProductCategoryClick);
  el.productsGrid.addEventListener("click", onProductCardClick);

  el.clearFoodlogBtn.addEventListener("click", onClearFoodLogClick);
  el.loggedItemsList.addEventListener("click", onLoggedItemsListClick);
  document.querySelectorAll(".quick-log-btn").forEach((btn) => {
    btn.addEventListener("click", onQuickLogClick);
  });

  initNavigation((pageKey) => {
    state.currentPage = pageKey;
    if (pageKey === "foodlog") renderFoodLogPage();
  });
}

async function init() {
  wireEvents();
  showPage("meals");

  // The overlay ships hidden (class="loading" -> display:none) so the design
  // is visible without JS. Reveal it while we fetch the initial data set.
  el.loadingOverlay.classList.remove("loading");

  try {
    await loadInitialMealsData();
  } catch (err) {
    console.error(err);
    el.categoriesGrid.innerHTML = ui.errorStateHTML("Couldn't load categories");
    el.recipesGrid.innerHTML = ui.errorStateHTML("Couldn't load recipes");
    toast("error", "Some data failed to load — check your connection");
  } finally {
    el.loadingOverlay.classList.add("loading");
  }
}

init();
