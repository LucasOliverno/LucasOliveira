# Lucas Oliveira — Portfolio

Source code for my professional portfolio: a single-page React app showcasing
Engineering and Software projects, with a bilingual (PT/EN) UI and a small blog.

## Stack

React 19 + Vite, React Router, i18next. No backend — project and blog content
are static data modules bundled with the app.

## Structure

```
frontend/
├── src/
│   ├── pages/       ← Home, About, Projects, ProjectDetails, Blog, BlogPost
│   ├── components/  ← Navbar, Hero, About, ProjectCard, ProjectGrid, Footer
│   ├── data/         ← projects.js (project catalog), posts.js (blog posts)
│   ├── i18n/         ← PT/EN translations
│   └── App.jsx
└── public/           ← images, PDFs (docs), static assets
```

Adding a project means adding an entry to `frontend/src/data/projects.js`
(`localizeProject` handles the `_en` suffix fields automatically) — pages
render from that data, nothing else needs to change.

## Setup & Running

```bash
npm install --prefix frontend
npm run dev       # http://localhost:5173
npm run build      # production build
npm run preview    # preview the production build
```

The root `package.json` is a thin wrapper that forwards `dev`/`build`/`preview`
into `frontend/` via `--prefix`, so these can also be run directly from
`frontend/`.

## Featured Projects

| Project | Category | Stack |
|---|---|---|
| TEP-Sentinel | Engenharia | PyTorch/TensorFlow, Stable-Baselines3, Gemini, LangChain |
| HydroCalc Pro | Engenharia | Python, Streamlit, Plotly, Gemini |
| IndustrialEco | Engenharia | Python/FastAPI, Next.js, NumPy/SciPy |
| SGCA | Programação | Java 21, DDD, Clean Architecture |
| AI Data Bridge | Programação | FastAPI, Next.js, Vanna.ai (LLM+RAG), PostgreSQL |
| VoxFinance | Programação | Next.js, FastAPI, Llama 3.1, Deepgram |

Full list, descriptions, and galleries live in `frontend/src/data/projects.js`.
