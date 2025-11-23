import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '../routes/AppRoutes';
import TopNav from '../components/TopNav';
import './app.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <TopNav />
        <main className="app-content">
          <AppRoutes />
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
