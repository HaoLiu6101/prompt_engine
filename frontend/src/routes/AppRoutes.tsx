import { Routes, Route } from 'react-router-dom';
import Home from './Home';
import Launcher from './Launcher';
import PromptCatalog from './PromptCatalog';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Launcher />} />
      <Route path="/prompts" element={<PromptCatalog />} />
      <Route path="/home" element={<Home />} />
    </Routes>
  );
}

export default AppRoutes;
