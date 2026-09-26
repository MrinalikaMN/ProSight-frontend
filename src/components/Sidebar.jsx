import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Projects', path: '/projects', icon: '📁' },
    { name: 'Early Warnings', path: '/warnings', icon: '🚨' },
    { name: 'Team Capacity', path: '/team', icon: '👥' },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-wider text-indigo-400">ProSight</h1>
        <p className="text-xs text-slate-400 mt-1">Intelligence Platform</p>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-6 border-t border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center font-bold">
            PM
          </div>
          <div>
            <p className="text-sm font-medium">Project Manager</p>
            <p className="text-xs text-slate-400">Active Session</p>
          </div>
        </div>
      </div>
    </div>
  );
}