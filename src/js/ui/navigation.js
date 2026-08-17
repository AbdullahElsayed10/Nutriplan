
const PAGE_CONFIG = {
  meals: {
    title: "Meals & Recipes",
    subtitle: "Discover delicious and nutritious recipes tailored for you",
    sections: ["search-filters-section", "meal-categories-section", "all-recipes-section"],
  },
  "meal-details": {
    title: "Recipe Details",
    subtitle: "",
    sections: ["meal-details"],
  },
  products: {
    title: "Product Scanner",
    subtitle: "Search packaged foods or scan a barcode for nutrition facts",
    sections: ["products-section"],
  },
  foodlog: {
    title: "Food Log",
    subtitle: "Track and monitor your daily nutrition intake",
    sections: ["foodlog-section"],
  },
};

const ALL_SECTIONS = Array.from(
  new Set(Object.values(PAGE_CONFIG).flatMap((p) => p.sections))
);

export function showPage(pageKey) {
  const config = PAGE_CONFIG[pageKey] || PAGE_CONFIG.meals;

  ALL_SECTIONS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = config.sections.includes(id) ? "" : "none";
  });

  const headerTitle = document.querySelector("#header h1");
  const headerSubtitle = document.querySelector("#header p");
  if (headerTitle) headerTitle.textContent = config.title;
  if (headerSubtitle) headerSubtitle.textContent = config.subtitle;

  if (pageKey !== "meal-details") {
    setActiveNavLink(pageKey);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setActiveNavLink(pageKey) {
  const navLinks = document.querySelectorAll(".nav-link");
  const indexByPage = { meals: 0, products: 1, foodlog: 2 };
  const activeIndex = indexByPage[pageKey] ?? 0;

  navLinks.forEach((link, index) => {
    const isActive = index === activeIndex;
    link.classList.toggle("bg-emerald-50", isActive);
    link.classList.toggle("text-emerald-700", isActive);
    link.classList.toggle("text-gray-600", !isActive);

    const label = link.querySelector("span");
    if (label) {
      label.classList.toggle("font-semibold", isActive);
      label.classList.toggle("font-medium", !isActive);
    }
  });
}

export function initNavigation(onNavigate) {
  const navLinks = document.querySelectorAll(".nav-link");
  const pageKeys = ["meals", "products", "foodlog"];

  navLinks.forEach((link, index) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const pageKey = pageKeys[index] || "meals";
      showPage(pageKey);
      closeSidebar();
      if (typeof onNavigate === "function") onNavigate(pageKey);
    });
  });

  const menuBtn = document.getElementById("header-menu-btn");
  const closeBtn = document.getElementById("sidebar-close-btn");
  const overlay = document.getElementById("sidebar-overlay");

  if (menuBtn) menuBtn.addEventListener("click", openSidebar);
  if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
  if (overlay) overlay.addEventListener("click", closeSidebar);
}

function openSidebar() {
  document.getElementById("sidebar")?.classList.add("open");
  document.getElementById("sidebar-overlay")?.classList.add("active");
}

function closeSidebar() {
  document.getElementById("sidebar")?.classList.remove("open");
  document.getElementById("sidebar-overlay")?.classList.remove("active");
}
