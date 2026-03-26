import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import EngineeringProjects from './pages/EngineeringProjects';
import TechProjects from './pages/TechProjects';
import AboutPage from './pages/AboutPage';
import ProjectDetails from './pages/ProjectDetails';
import { useScrollReveal } from './hooks/useScrollReveal';

function AppInner() {
  useScrollReveal();

  useEffect(() => {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    const move = (e) => {
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      ring.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    };

    const addHover = () => document.body.classList.add('cursor-hover');
    const removeHover = () => document.body.classList.remove('cursor-hover');

    window.addEventListener('mousemove', move);

    const interactives = document.querySelectorAll('a, button');
    interactives.forEach((el) => {
      el.addEventListener('mouseenter', addHover);
      el.addEventListener('mouseleave', removeHover);
    });

    return () => {
      window.removeEventListener('mousemove', move);
      interactives.forEach((el) => {
        el.removeEventListener('mouseenter', addHover);
        el.removeEventListener('mouseleave', removeHover);
      });
    };
  }, []);

  return (
    <div className="app">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/engenharia" element={<EngineeringProjects />} />
        <Route path="/tech" element={<TechProjects />} />
        <Route path="/sobre" element={<AboutPage />} />
        <Route path="/projeto/:id" element={<ProjectDetails />} />
      </Routes>

      <Footer />

      <div className="cursor-dot" id="cursor-dot" />
      <div className="cursor-ring" id="cursor-ring" />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  );
}

export default App;
