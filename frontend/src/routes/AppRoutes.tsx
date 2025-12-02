import { Navigate, Route, Routes } from 'react-router-dom';
import Connect from './Connect';
import PromptCatalog from './PromptCatalog';
import Workspace from './Workspace';
import Settings from './Settings';
import RequireConfig from './RequireConfig';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Connect />} />
      <Route
        path="/workspace"
        element={
          <RequireConfig>
            <Workspace />
          </RequireConfig>
        }
      />
      <Route path="/settings" element={<Settings />} />
      <Route
        path="/prompts"
        element={
          <RequireConfig>
            <PromptCatalog />
          </RequireConfig>
        }
      />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
