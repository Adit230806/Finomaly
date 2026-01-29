import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import AnomalyDetection from './components/AnomalyDetection';
import FirebaseTest from './components/FirebaseTest';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/test" element={<FirebaseTest />} />
          <Route path="/*" element={
            <PrivateRoute>
              <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Header />
                  <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/transactions" element={<Transactions />} />
                      <Route path="/anomaly-detection" element={<AnomalyDetection />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;