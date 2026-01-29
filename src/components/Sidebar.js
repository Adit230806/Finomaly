import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: '📊', path: '/dashboard' },
    { name: 'Transactions', icon: '💳', path: '/transactions' },
    { name: 'Anomaly Detection', icon: '🚨', path: '/anomaly-detection' },
    { name: 'Analytics', icon: '📈', path: '/analytics' },
    { name: 'Settings', icon: '⚙️', path: '/settings' }
  ];

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 w-64 shadow-2xl relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10 pointer-events-none"></div>

      {/* Header */}
      <div className="relative p-6 border-b border-slate-700/50">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg animate-glow">
            <span className="text-2xl">🔍</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Finomaly
            </h1>
          </div>
        </div>
        <p className="text-slate-400 text-sm font-medium pl-1">Financial Intelligence</p>
      </div>

      {/* Navigation */}
      <nav className="relative mt-6 px-3">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path || (location.pathname === '/' && item.path === '/dashboard');
          return (
            <Link
              key={index}
              to={item.path}
              className={`group relative flex items-center px-4 py-3.5 my-1.5 rounded-xl transition-all duration-200 ${isActive
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
              )}

              {/* Icon */}
              <span className={`text-2xl mr-4 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'
                }`}>
                {item.icon}
              </span>

              {/* Text */}
              <span className="font-semibold text-[15px]">{item.name}</span>

              {/* Hover glow effect */}
              {!isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-purple-600/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default Sidebar;