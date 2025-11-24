import { Routes, Route } from 'react-router-dom';
import Home from './Home';
import Welcome from './Welcome';
import PromptCatalog from './PromptCatalog';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/prompts" element={<PromptCatalog />} />
      <Route path="/home" element={<Home />} />
    </Routes>
  );
}

export default AppRoutes;
