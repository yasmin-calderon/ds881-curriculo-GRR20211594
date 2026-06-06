import "./style.css";
import data from "./data.json";

const $ = (id) => document.getElementById(id);

function renderProfile() {
  const { profile } = data;
  $("profile-name").textContent = profile.name;
  $("profile-title").textContent = profile.title;
  $("profile-location").textContent = profile.location;
  $("profile-summary").textContent = profile.summary;

  const links = [
    { href: `mailto:${profile.email}`, label: "Email" },
    { href: profile.linkedin, label: "LinkedIn" },
    { href: profile.github, label: "GitHub" },
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
    nav.appendChild(a);
  }
}

function renderSkills() {
  const list = $("skills-list");
  list.innerHTML = "";
  for (const skill of data.skills) {
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
  const user = data.profile.githubUser;

  // Sem usuário configurado: mantemos a seção como teaser. O conteúdo real
  // entra quando data.json.profile.githubUser for definido no proximo PR.
  if (!user) {
    hint.textContent = "Os repositorios publicos serao listados aqui em breve.";
    return;
  }

  try {
    const res = await fetch(
      `https://api.github.com/users/${user}/repos?sort=updated&per_page=100`
    );
    if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
    const repos = await res.json();
    const filtered = repos
      .filter((r) => !r.fork && !r.archived)
      .sort(
        (a, b) =>
          b.stargazers_count - a.stargazers_count ||
          new Date(b.pushed_at) - new Date(a.pushed_at)
      )
      .slice(0, 6);

    if (filtered.length === 0) {
      hint.textContent = "Nenhum repositorio publico encontrado ainda.";
      return;
    }

    hint.textContent = `Ultimos ${filtered.length} repositorios atualizados:`;
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
      desc.textContent = repo.description || "Sem descricao.";
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
        stars.textContent = `* ${repo.stargazers_count}`;
        meta.appendChild(stars);
      }
      a.appendChild(meta);

      list.appendChild(a);
    }
  } catch (err) {
    console.error(err);
    hint.textContent = "Nao foi possivel carregar os repositorios do GitHub.";
  }
}

renderProfile();
renderSkills();
renderTimeline("experience-list", data.experience, {
  primary: "role",
  secondary: "company",
  period: "period",
  highlights: "highlights",
});
renderTimeline("education-list", data.education, {
  primary: "degree",
  secondary: "institution",
  period: "period",
});
renderProjects();
