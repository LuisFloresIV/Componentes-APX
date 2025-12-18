// Helpers
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function debounce(fn, wait = 120){
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// Theme
const THEME_KEY = "apx_theme";
function setTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}
function toggleTheme(){
  const curr = document.documentElement.getAttribute("data-theme") || "dark";
  setTheme(curr === "dark" ? "light" : "dark");
}
setTheme(localStorage.getItem(THEME_KEY) || "dark");

// Smooth scroll buttons
$$("[data-scroll]").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-scroll");
    const el = $(target);
    if(el) el.scrollIntoView({behavior:"smooth", block:"start"});
  });
});

// Tabs
$$("[data-tabs]").forEach(tabs => {
  const buttons = $$(".tabBtn", tabs);
  const panels = $$(".tabPanel", tabs);

  function activate(id){
    buttons.forEach(b => b.classList.toggle("isActive", b.dataset.tab === id));
    panels.forEach(p => p.classList.toggle("isActive", p.id === id));
  }

  buttons.forEach(btn => btn.addEventListener("click", () => activate(btn.dataset.tab)));
});

// Search filter (real)
const searchInput = $("#searchInput");
const clearSearch = $("#clearSearch");
const filterables = $$("section.block, article.card, details.acc");

function normalize(s){
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function matchesQuery(el, q){
  if(!q) return true;
  const tags = normalize(el.getAttribute("data-tags") || "");
  const text = normalize(el.textContent || "");
  return tags.includes(q) || text.includes(q);
}

function applySearch(){
  const q = normalize(searchInput.value.trim());

  // Show/hide individual elements
  filterables.forEach(el => {
    const ok = matchesQuery(el, q);
    el.classList.toggle("hidden", !ok);
  });

  // If a section is hidden, also hide it (already in filterables). But ensure
  // parent sections can still show if any of their children match.
  $$("section.block").forEach(section => {
    if(q === ""){
      section.classList.remove("hidden");
      return;
    }
    const anyChildVisible =
      !section.classList.contains("hidden") ||
      $$(":scope .card:not(.hidden), :scope .acc:not(.hidden)", section).length > 0;

    section.classList.toggle("hidden", !anyChildVisible);
  });

  // Auto expand accordions that match query
  if(q){
    $$("details.acc").forEach(d => {
      if(d.classList.contains("hidden")) return;
      const ok = matchesQuery(d, q);
      if(ok) d.open = true;
    });
  }

  // First visible block: scroll small hint (optional)
}

searchInput.addEventListener("input", debounce(applySearch, 110));
clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  applySearch();
  searchInput.focus();
});

// Expand / collapse all accordions
$("#expandAll").addEventListener("click", () => {
  $$("details.acc").forEach(d => { if(!d.classList.contains("hidden")) d.open = true; });
});
$("#collapseAll").addEventListener("click", () => {
  $$("details.acc").forEach(d => { d.open = false; });
});

// Sidebar active section (IntersectionObserver)
const navLinks = $$(".navItem");
const sections = $$("section.block");
const linkById = new Map(navLinks.map(a => [a.getAttribute("href").replace("#",""), a]));

const obs = new IntersectionObserver((entries) => {
  // pick the most visible
  const visible = entries
    .filter(e => e.isIntersecting)
    .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];

  if(!visible) return;

  const id = visible.target.id;
  navLinks.forEach(a => a.classList.remove("isActive"));
  const link = linkById.get(id);
  if(link) link.classList.add("isActive");
}, { root: null, threshold: [0.15, 0.25, 0.5, 0.75] });

sections.forEach(s => obs.observe(s));

// Toast (glossary)
const toast = $("#toast");
let toastTimer = null;

function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

$$(".glossItem").forEach(btn => {
  btn.addEventListener("click", () => {
    showToast(btn.getAttribute("data-toast"));
  });
});

// Theme button
$("#toggleTheme").addEventListener("click", () => toggleTheme());

// Quiz
const quizForm = $("#quizForm");
const quizResult = $("#quizResult");
const resetQuiz = $("#resetQuiz");

const answers = { q1:"b", q2:"a", q3:"b", q4:"b" };

quizForm.addEventListener("submit", (e) => {
  e.preventDefault();
  let score = 0;
  let total = Object.keys(answers).length;
  const wrong = [];

  for(const [q, correct] of Object.entries(answers)){
    const chosen = (new FormData(quizForm)).get(q);
    if(chosen === correct) score++;
    else wrong.push(q);
  }

  const pct = Math.round((score / total) * 100);
  let msg = `Resultado: ${score}/${total} (${pct}%). `;

  if(score === total){
    msg += "¡Perfecto!";
  } else {
    msg += "Te faltó repasar: " + wrong.map(q => q.toUpperCase()).join(", ") + ".";
  }

  quizResult.textContent = msg;
});

resetQuiz.addEventListener("click", () => {
  quizForm.reset();
  quizResult.textContent = "";
});

// First run
applySearch();
