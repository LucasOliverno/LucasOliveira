import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Load projects data
const projectsPath = join(__dirname, 'data', 'projects.json');
const projectsData = JSON.parse(readFileSync(projectsPath, 'utf-8'));

// Routes
app.get('/api/projects', (req, res) => {
  const { category, featured, lang } = req.query;
  let projects = projectsData.projects.map(p => {
    if (lang === 'en') {
      return {
        ...p,
        title: p.title_en || p.title,
        subtitle: p.subtitle_en || p.subtitle,
        description: p.description_en || p.description,
        fullDescription: p.fullDescription_en || p.fullDescription,
        techStack: p.techStack_en || p.techStack,
        challenges: p.challenges_en || p.challenges,
        results: p.results_en || p.results
      };
    }
    if (lang === 'es') {
      return {
        ...p,
        title: p.title_es || p.title,
        subtitle: p.subtitle_es || p.subtitle,
        description: p.description_es || p.description,
        fullDescription: p.fullDescription_es || p.fullDescription,
        techStack: p.techStack_es || p.techStack,
        challenges: p.challenges_es || p.challenges,
        results: p.results_es || p.results
      };
    }
    return p;
  });

  if (category) {
    projects = projects.filter(p => p.category === category);
  }

  if (featured === 'true') {
    projects = projects.filter(p => p.featured);
  }

  res.json(projects);
});

app.get('/api/projects/:id', (req, res) => {
  const { lang } = req.query;
  const project = projectsData.projects.find(p => p.id === req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Projeto não encontrado' });
  }

  if (lang === 'en') {
    return res.json({
      ...project,
      title: project.title_en || project.title,
      subtitle: project.subtitle_en || project.subtitle,
      description: project.description_en || project.description,
      fullDescription: project.fullDescription_en || project.fullDescription,
      techStack: project.techStack_en || project.techStack,
      challenges: project.challenges_en || project.challenges,
      results: project.results_en || project.results
    });
  }

  if (lang === 'es') {
    return res.json({
      ...project,
      title: project.title_es || project.title,
      subtitle: project.subtitle_es || project.subtitle,
      description: project.description_es || project.description,
      fullDescription: project.fullDescription_es || project.fullDescription,
      techStack: project.techStack_es || project.techStack,
      challenges: project.challenges_es || project.challenges,
      results: project.results_es || project.results
    });
  }

  res.json(project);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));

  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📊 API available at http://${HOST}:${PORT}/api/projects`);
});
