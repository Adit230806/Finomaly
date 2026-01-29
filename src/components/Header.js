import React from 'react';
import { useAuth } from '../AuthContext';

const Header = () => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out');
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50 sticky top-0 z-40">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search transactions, accounts, or anomalies..."
              className="w-full pl-12 pr-6 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 focus:bg-white transition-all duration-200 text-gray-700 placeholder-gray-400 shadow-sm focus:shadow-md"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4 ml-8">
          {/* Notification Button */}
          <button className="relative p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 group">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-2 right-2 w-5 h-5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">3</span>
          </button>

          {/* Settings Button */}
          <button className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* User Profile Section */}
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white">
              <span className="text-white text-sm font-bold">
                {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="hidden md:block">
              <div className="text-gray-800 font-semibold text-sm">
                {currentUser?.email?.split('@')[0] || 'User'}
              </div>
              <div className="text-gray-500 text-xs font-medium">Risk Analyst</div>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;