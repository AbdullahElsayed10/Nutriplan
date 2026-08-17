
export function escapeHTML(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const CATEGORY_ICONS = {
  Beef: "fa-drumstick-bite",
  Chicken: "fa-drumstick-bite",
  Dessert: "fa-ice-cream",
  Lamb: "fa-drumstick-bite",
  Miscellaneous: "fa-utensils",
  Pasta: "fa-bowl-food",
  Pork: "fa-bacon",
  Seafood: "fa-fish",
  Side: "fa-carrot",
  Starter: "fa-plate-wheat",
  Vegan: "fa-seedling",
  Vegetarian: "fa-leaf",
  Breakfast: "fa-egg",
  Goat: "fa-drumstick-bite",
};

function categoryIcon(name) {
  return CATEGORY_ICONS[name] || "fa-utensils";
}

const GRADE_COLORS = {
  a: "bg-green-500",
  b: "bg-lime-500",
  c: "bg-yellow-500",
  d: "bg-orange-500",
  e: "bg-red-500",
};


export function skeletonCardsHTML(count = 8) {
  return Array.from({ length: count })
    .map(
      () => `
      <div class="animate-pulse bg-white rounded-xl overflow-hidden shadow-sm">
        <div class="h-40 bg-gray-200"></div>
        <div class="p-4 space-y-2">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>`
    )
    .join("");
}

export function emptyStateHTML(title = "Nothing here yet", subtitle = "") {
  return `
    <div class="col-span-full flex flex-col items-center justify-center py-12 text-center">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <i class="fa-solid fa-search text-gray-400 text-2xl"></i>
      </div>
      <p class="text-gray-500 text-lg font-medium">${escapeHTML(title)}</p>
      ${subtitle ? `<p class="text-gray-400 text-sm mt-2">${escapeHTML(subtitle)}</p>` : ""}
    </div>`;
}

export function errorStateHTML(message = "Something went wrong") {
  return `
    <div class="col-span-full flex flex-col items-center justify-center py-12 text-center">
      <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <i class="fa-solid fa-triangle-exclamation text-red-400 text-2xl"></i>
      </div>
      <p class="text-gray-700 text-lg font-medium">${escapeHTML(message)}</p>
      <p class="text-gray-400 text-sm mt-2">Please try again in a moment.</p>
    </div>`;
}


export function categoryCardHTML(category) {
  return `
    <div
      class="category-card bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-200 hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all group"
      data-category="${escapeHTML(category.strCategory)}"
    >
      <div class="flex items-center gap-2.5">
        <div class="text-white w-9 h-9 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
          <i class="fa-solid ${categoryIcon(category.strCategory)}"></i>
        </div>
        <div>
          <h3 class="text-sm font-bold text-gray-900">${escapeHTML(category.strCategory)}</h3>
        </div>
      </div>
    </div>`;
}

export function recipeCardHTML(meal, viewMode = "grid") {
  const category = meal.strCategory || "";
  const area = meal.strArea || "";
  if (viewMode === "list") {
    return `
      <div class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group flex items-center gap-4 p-3" data-meal-id="${escapeHTML(meal.idMeal)}">
        <img class="w-24 h-24 rounded-lg object-cover shrink-0" src="${escapeHTML(meal.strMealThumb)}" alt="${escapeHTML(meal.strMeal)}" loading="lazy" />
        <div class="flex-1 min-w-0">
          <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors truncate">${escapeHTML(meal.strMeal)}</h3>
          <div class="flex items-center gap-3 text-xs">
            ${category ? `<span class="font-semibold text-gray-900"><i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>${escapeHTML(category)}</span>` : ""}
            ${area ? `<span class="font-semibold text-gray-500"><i class="fa-solid fa-globe text-blue-500 mr-1"></i>${escapeHTML(area)}</span>` : ""}
          </div>
        </div>
        <i class="fa-solid fa-chevron-right text-gray-300 group-hover:text-emerald-500"></i>
      </div>`;
  }
  return `
    <div class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group" data-meal-id="${escapeHTML(meal.idMeal)}">
      <div class="relative h-48 overflow-hidden">
        <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="${escapeHTML(meal.strMealThumb)}" alt="${escapeHTML(meal.strMeal)}" loading="lazy" />
        <div class="absolute bottom-3 left-3 flex gap-2">
          ${category ? `<span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full text-gray-700">${escapeHTML(category)}</span>` : ""}
          ${area ? `<span class="px-2 py-1 bg-emerald-500 text-xs font-semibold rounded-full text-white">${escapeHTML(area)}</span>` : ""}
        </div>
      </div>
      <div class="p-4">
        <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">${escapeHTML(meal.strMeal)}</h3>
        <p class="text-xs text-gray-600 mb-3 line-clamp-2">Delicious recipe to try!</p>
        <div class="flex items-center justify-between text-xs">
          ${category ? `<span class="font-semibold text-gray-900"><i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>${escapeHTML(category)}</span>` : "<span></span>"}
          ${area ? `<span class="font-semibold text-gray-500"><i class="fa-solid fa-globe text-blue-500 mr-1"></i>${escapeHTML(area)}</span>` : ""}
        </div>
      </div>
    </div>`;
}

export function ingredientRowHTML(ingredient) {
  return `
    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors">
      <input type="checkbox" class="ingredient-checkbox w-5 h-5 text-emerald-600 rounded border-gray-300" />
      <span class="text-gray-700 ingredient-label">
        ${ingredient.measure ? `<span class="font-medium text-gray-900">${escapeHTML(ingredient.measure)}</span>` : ""}
        ${escapeHTML(ingredient.name)}
      </span>
    </div>`;
}

export function instructionStepHTML(step, index) {
  return `
    <div class="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
      <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">${index + 1}</div>
      <p class="text-gray-700 leading-relaxed pt-2">${escapeHTML(step)}</p>
    </div>`;
}


export function productCardHTML(product) {
  const gradeColor = GRADE_COLORS[product.grade] || "bg-gray-400";
  const gradeLabel = product.grade ? product.grade.toUpperCase() : "?";
  const img =
    product.image ||
    "https://static.openfoodfacts.org/images/icons/dist/packaging.svg";
  return `
    <div class="product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group" data-barcode="${escapeHTML(product.barcode)}">
      <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
        <img class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" src="${escapeHTML(img)}" alt="${escapeHTML(product.name)}" loading="lazy" />
        <div class="absolute top-2 left-2 ${gradeColor} text-white text-xs font-bold px-2 py-1 rounded uppercase">Nutri-Score ${gradeLabel}</div>
        ${
          product.nova
            ? `<div class="absolute top-2 right-2 bg-lime-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center" title="NOVA ${product.nova}">${product.nova}</div>`
            : ""
        }
      </div>
      <div class="p-4">
        ${product.brand ? `<p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${escapeHTML(product.brand)}</p>` : ""}
        <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">${escapeHTML(product.name)}</h3>
        <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
          ${product.quantity ? `<span><i class="fa-solid fa-weight-scale mr-1"></i>${escapeHTML(product.quantity)}</span>` : ""}
          <span><i class="fa-solid fa-fire mr-1"></i>${product.calories} kcal/100g</span>
        </div>
        <div class="grid grid-cols-4 gap-1 text-center">
          <div class="bg-emerald-50 rounded p-1.5">
            <p class="text-xs font-bold text-emerald-700">${product.protein}g</p>
            <p class="text-[10px] text-gray-500">Protein</p>
          </div>
          <div class="bg-blue-50 rounded p-1.5">
            <p class="text-xs font-bold text-blue-700">${product.carbs}g</p>
            <p class="text-[10px] text-gray-500">Carbs</p>
          </div>
          <div class="bg-purple-50 rounded p-1.5">
            <p class="text-xs font-bold text-purple-700">${product.fat}g</p>
            <p class="text-[10px] text-gray-500">Fat</p>
          </div>
          <div class="bg-orange-50 rounded p-1.5">
            <p class="text-xs font-bold text-orange-700">${product.sugar}g</p>
            <p class="text-[10px] text-gray-500">Sugar</p>
          </div>
        </div>
      </div>
    </div>`;
}


export function foodLogItemHTML(entry) {
  const icons = { meal: "fa-utensils", product: "fa-barcode", custom: "fa-pencil" };
  const time = new Date(entry.loggedAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `
    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl" data-log-id="${escapeHTML(entry.id)}">
      <div class="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
        <i class="fa-solid ${icons[entry.source] || "fa-utensils"} text-emerald-600"></i>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-gray-900 text-sm truncate">${escapeHTML(entry.name)}</p>
        <p class="text-xs text-gray-500">${Math.round(entry.calories)} kcal &middot; ${time}</p>
      </div>
      <button class="remove-log-item-btn text-gray-400 hover:text-red-500 px-2" title="Remove" data-log-id="${escapeHTML(entry.id)}">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>`;
}
