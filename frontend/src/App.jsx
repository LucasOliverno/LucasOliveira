import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import EngineeringProjects from './pages/EngineeringProjects';
import TechProjects from './pages/TechProjects';
import AboutPage from './pages/AboutPage';
import ProjectDetails from './pages/ProjectDetails';

function App() {
  return (
    <Router>
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
      </div>
    </Router>
  );
}

export default App;
