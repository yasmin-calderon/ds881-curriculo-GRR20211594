import "./style.css";
import dataPt from "./data.pt.json";
import dataEn from "./data.en.json";

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "cv-lang";
const SUPPORTED = ["pt", "en"];
const ALL = { pt: dataPt, en: dataEn };

// Decide o idioma inicial: preferencia salva > preferencia do navegador > pt.
function detectInitialLang() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (SUPPORTED.includes(stored)) return stored;
  const browser = (navigator.language || "").toLowerCase();
  if (browser.startsWith("en")) return "en";
  return "pt";
}

let currentLang = detectInitialLang();
const data = () => ALL[currentLang];
const t = (key) => data().ui[key];

async function copyToClipboard(text, anchor) {
  try {
    await navigator.clipboard.writeText(text);
    const original = anchor.textContent;
    const rect = anchor.getBoundingClientRect();
    anchor.style.minWidth = `${rect.width}px`;
    anchor.style.justifyContent = "center";
    anchor.textContent = t("copied");
    anchor.classList.add("is-copied");
    setTimeout(() => {
      anchor.textContent = original;
      anchor.classList.remove("is-copied");
      anchor.style.minWidth = "";
      anchor.style.justifyContent = "";
    }, 1500);
  } catch (err) {
    console.error("Clipboard API indisponivel:", err);
    window.location.href = anchor.href;
  }
}

function renderStaticUI() {
  document.documentElement.lang = currentLang === "pt" ? "pt-BR" : "en";
  document.title = t("windowTitle");
  $("hero-tag").textContent = t("tag");
  $("about-heading").textContent = t("about");
  $("skills-heading").textContent = t("skills");
  $("experience-heading").textContent = t("experience");
  $("education-heading").textContent = t("education");
  $("projects-heading").textContent = t("projects");
  $("footer-text").textContent = t("footer");
}

function renderProfile() {
  const p = data().profile;
  $("profile-name").textContent = p.name;
  $("profile-title").textContent = p.title;
  $("profile-location").textContent = p.location;
  $("profile-summary").textContent = p.summary;

  const links = [
    { href: `mailto:${p.email}`, label: p.email, copy: p.email },
    { href: p.linkedin, label: "LinkedIn" },
    { href: p.github, label: "GitHub" },
  ];
  const nav = $("profile-links");
  nav.innerHTML = "";
  for (const link of links) {
    const a = document.createElement("a");
    a.href = link.href;
    a.textContent = link.label;
    if (link.href.startsWith("http")) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    if (link.copy) {
      a.title = t("copyHint");
      a.addEventListener("click", (e) => {
        e.preventDefault();
        copyToClipboard(link.copy, a);
      });
    }
    nav.appendChild(a);
  }
}

function renderSkills() {
  const list = $("skills-list");
  list.innerHTML = "";
  for (const skill of data().skills) {
    const li = document.createElement("li");
    li.textContent = skill;
    list.appendChild(li);
  }
}

function renderTimeline(listId, items, fields) {
  const list = $(listId);
  list.innerHTML = "";
  for (const item of items) {
    const li = document.createElement("li");
    li.className = "timeline-item";

    const primary = document.createElement("p");
    primary.className = "timeline-primary";
    primary.textContent = item[fields.primary];
    li.appendChild(primary);

    const secondary = document.createElement("p");
    secondary.className = "timeline-secondary";
    secondary.textContent = item[fields.secondary];
    li.appendChild(secondary);

    const period = document.createElement("p");
    period.className = "timeline-period";
    period.textContent = item[fields.period];
    li.appendChild(period);

    if (fields.highlights && item[fields.highlights]?.length) {
      const ul = document.createElement("ul");
      ul.className = "timeline-highlights";
      for (const h of item[fields.highlights]) {
        const hLi = document.createElement("li");
        hLi.textContent = h;
        ul.appendChild(hLi);
      }
      li.appendChild(ul);
    }

    list.appendChild(li);
  }
}

async function renderProjects() {
  const hint = $("projects-hint");
  const list = $("projects-list");
  list.innerHTML = "";
  const user = data().profile.githubUser;

  if (!user) {
    hint.textContent = t("projectsTeaser");
    return;
  }

  try {
    const res = await fetch(
      `https://api.github.com/users/${user}/repos?sort=updated&per_page=100`
    );
    if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
    const repos = await res.json();
    const filtered = repos
      .filter((r) => !r.fork && !r.archived && r.description)
      .sort(
        (a, b) =>
          b.stargazers_count - a.stargazers_count ||
          new Date(b.pushed_at) - new Date(a.pushed_at)
      )
      .slice(0, 6);

    if (filtered.length === 0) {
      hint.textContent = t("projectsNone");
      return;
    }

    hint.textContent = t("projectsLoaded").replace("{n}", filtered.length);
    for (const repo of filtered) {
      const a = document.createElement("a");
      a.className = "project-card";
      a.href = repo.html_url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";

      const name = document.createElement("span");
      name.className = "project-name";
      name.textContent = repo.name;
      a.appendChild(name);

      const desc = document.createElement("p");
      desc.className = "project-desc";
      desc.textContent = repo.description || t("noDescription");
      a.appendChild(desc);

      const meta = document.createElement("div");
      meta.className = "project-meta";
      if (repo.language) {
        const lang = document.createElement("span");
        lang.className = "project-lang";
        lang.textContent = repo.language;
        meta.appendChild(lang);
      }
      if (repo.stargazers_count > 0) {
        const stars = document.createElement("span");
        stars.textContent = `★ ${repo.stargazers_count}`;
        meta.appendChild(stars);
      }
      a.appendChild(meta);

      list.appendChild(a);
    }
  } catch (err) {
    console.error(err);
    hint.textContent = t("projectsError");
  }
}

function updateLangSwitcher() {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.lang === currentLang);
    btn.setAttribute("aria-pressed", btn.dataset.lang === currentLang);
  });
}

function setLang(lang) {
  if (!SUPPORTED.includes(lang) || lang === currentLang) return;
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  renderAll();
}

function renderAll() {
  renderStaticUI();
  renderProfile();
  renderSkills();
  renderTimeline("experience-list", data().experience, {
    primary: "role",
    secondary: "company",
    period: "period",
    highlights: "highlights",
  });
  renderTimeline("education-list", data().education, {
    primary: "degree",
    secondary: "institution",
    period: "period",
  });
  renderProjects();
  updateLangSwitcher();
}

function bindLangSwitcher() {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.dataset.lang));
  });
}

bindLangSwitcher();
renderAll();
