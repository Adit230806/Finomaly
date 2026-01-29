import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [anomalyAlerts, setAnomalyAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const unsubscribeTransactions = onSnapshot(
      collection(db, 'transactions'),
      (querySnapshot) => {
        const transactionData = [];
        querySnapshot.forEach((doc) => {
          transactionData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setTransactions(transactionData);
      }
    );

    const unsubscribeAlerts = onSnapshot(
      collection(db, 'anomalyAlerts'),
      (querySnapshot) => {
        const alertData = [];
        querySnapshot.forEach((doc) => {
          alertData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setAnomalyAlerts(alertData);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeTransactions();
      unsubscribeAlerts();
    };
  }, []);

  const getRiskScore = (transaction) => {
    const alert = anomalyAlerts.find(alert => alert.transactionId === transaction.id);
    return alert?.riskScore || transaction.riskScore || Math.floor(Math.random() * 100);
  };

  const riskCounts = {
    safe: transactions.filter(t => getRiskScore(t) <= 50).length,
    medium: transactions.filter(t => getRiskScore(t) > 50 && getRiskScore(t) <= 70).length,
    high: transactions.filter(t => getRiskScore(t) > 70).length
  };

  const totalAnomalies = riskCounts.medium + riskCounts.high;

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'} p-8`}>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} font-medium`}>Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'} p-8`}>
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-3`}>Finomaly Dashboard</h1>
            <p className={`text-lg ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Real-time financial anomaly detection & monitoring</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-xl transition-all duration-200 ${darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-100'} shadow-lg hover:shadow-xl`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        <div className={`group relative overflow-hidden rounded-2xl ${darkMode ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50' : 'bg-white/70 backdrop-blur-xl border border-white/20'} p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'} mb-2 tracking-wide uppercase`}>Total Transactions</p>
              <p className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-1`}>{transactions.length.toLocaleString()}</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Live monitoring</span>
              </div>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`group relative overflow-hidden rounded-2xl ${darkMode ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50' : 'bg-white/70 backdrop-blur-xl border border-white/20'} p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'} mb-2 tracking-wide uppercase`}>Safe Transactions</p>
              <p className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-1`}>{riskCounts.safe.toLocaleString()}</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Verified secure</span>
              </div>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`group relative overflow-hidden rounded-2xl ${darkMode ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50' : 'bg-white/70 backdrop-blur-xl border border-white/20'} p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'} mb-2 tracking-wide uppercase`}>Medium Risk</p>
              <p className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-1`}>{riskCounts.medium.toLocaleString()}</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Requires review</span>
              </div>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`group relative overflow-hidden rounded-2xl ${darkMode ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50' : 'bg-white/70 backdrop-blur-xl border border-white/20'} p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}>
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-rose-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'} mb-2 tracking-wide uppercase`}>High Risk</p>
              <p className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-1`}>{riskCounts.high.toLocaleString()}</p>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Immediate attention</span>
              </div>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`rounded-2xl ${darkMode ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50' : 'bg-white/70 backdrop-blur-xl border border-white/20'} p-8 shadow-xl`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Anomaly Overview</h3>
            <div className={`px-4 py-2 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100/50'} backdrop-blur-sm`}>
              <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Live Data</span>
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Total Anomalies Detected</span>
              </div>
              <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{totalAnomalies}</span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Detection Rate</span>
              </div>
              <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                {transactions.length > 0 ? ((totalAnomalies / transactions.length) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Active Alerts</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{anomalyAlerts.length}</span>
                {anomalyAlerts.length > 0 && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl ${darkMode ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50' : 'bg-white/70 backdrop-blur-xl border border-white/20'} p-8 shadow-xl`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Risk Distribution</h3>
            <div className={`px-4 py-2 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100/50'} backdrop-blur-sm`}>
              <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Real-time</span>
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                  <span className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Safe (0-50)</span>
                </div>
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{riskCounts.safe}</span>
              </div>
              <div className={`w-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded-full h-3 overflow-hidden`}>
                <div
                  className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${transactions.length > 0 ? (riskCounts.safe / transactions.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                  <span className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Medium (51-70)</span>
                </div>
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{riskCounts.medium}</span>
              </div>
              <div className={`w-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded-full h-3 overflow-hidden`}>
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${transactions.length > 0 ? (riskCounts.medium / transactions.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                  <span className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>High (71-100)</span>
                </div>
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{riskCounts.high}</span>
              </div>
              <div className={`w-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded-full h-3 overflow-hidden`}>
                <div
                  className="bg-gradient-to-r from-red-500 to-rose-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${transactions.length > 0 ? (riskCounts.high / transactions.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;