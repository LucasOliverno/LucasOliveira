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
  const { category, featured } = req.query;
  let projects = projectsData.projects;

  if (category) {
    projects = projects.filter(p => p.category === category);
  }

  if (featured === 'true') {
    projects = projects.filter(p => p.featured);
  }

  res.json(projects);
});

app.get('/api/projects/:id', (req, res) => {
  const project = projectsData.projects.find(p => p.id === req.params.id);
  
  if (!project) {
    return res.status(404).json({ error: 'Projeto não encontrado' });
  }

  res.json(project);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api/projects`);
});
