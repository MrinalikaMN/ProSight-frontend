import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects'; // Add this import

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            
            {/* Replace the placeholder with your new component */}
            <Route path="/projects" element={<Projects />} />
            
            <Route path="/warnings" element={
              <h2 className="text-2xl font-bold text-slate-800">Early Warning Center (Coming Soon)</h2>
            } />
            <Route path="/team" element={
              <h2 className="text-2xl font-bold text-slate-800">Team Capacity Intelligence (Coming Soon)</h2>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
