import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter } from 'recharts';

const AnomalyDetection = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setError(null);
    } else {
      setError('Please upload a valid CSV file');
    }
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const transactions = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim());
        const transaction = {};
        headers.forEach((header, index) => {
          transaction[header] = values[index];
        });
        transactions.push(transaction);
      }
    }
    return transactions;
  };

  const analyzeTransactions = async () => {
    if (!csvFile) {
      setError('Please upload a CSV file first');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Reset session before analysis
      await fetch('http://localhost:5000/api/reset-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const csvText = await csvFile.text();
      const transactions = parseCSV(csvText);
      const analysisResults = [];

      for (const transaction of transactions) {
        try {
          const response = await fetch('http://localhost:5000/api/analyze-transaction', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: parseFloat(transaction.amount || transaction.Amount || 0),
              account: transaction.account || transaction.Account || transaction.user_id || 'Unknown',
              timestamp: transaction.timestamp || transaction.Timestamp || new Date().toISOString(),
              transactionId: transaction.id || transaction.ID || Math.random().toString(36).substr(2, 9)
            })
          });

          if (response.ok) {
            const result = await response.json();
            analysisResults.push({
              ...transaction,
              ...result,
              amount: parseFloat(transaction.amount || transaction.Amount || 0)
            });
          } else {
            analysisResults.push({
              ...transaction,
              error: 'Analysis failed',
              riskScore: 0,
              riskLevel: 'Unknown',
              amount: parseFloat(transaction.amount || transaction.Amount || 0)
            });
          }
        } catch (err) {
          analysisResults.push({
            ...transaction,
            error: err.message,
            riskScore: 0,
            riskLevel: 'Error',
            amount: parseFloat(transaction.amount || transaction.Amount || 0)
          });
        }
      }

      setResults(analysisResults);
    } catch (err) {
      setError('Failed to process CSV file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (score) => {
    if (score <= 50) return `${darkMode ? 'bg-emerald-900/30 text-emerald-300 border-emerald-800/50' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}`;
    if (score <= 70) return `${darkMode ? 'bg-amber-900/30 text-amber-300 border-amber-800/50' : 'bg-amber-100 text-amber-800 border-amber-200'}`;
    return `${darkMode ? 'bg-red-900/30 text-red-300 border-red-800/50' : 'bg-red-100 text-red-800 border-red-200'}`;
  };

  const getProgressColor = (score) => {
    if (score <= 50) return 'bg-gradient-to-r from-emerald-500 to-green-500';
    if (score <= 70) return 'bg-gradient-to-r from-amber-500 to-orange-500';
    return 'bg-gradient-to-r from-red-500 to-rose-500';
  };

  const anomalousTransactions = results.filter(t => t.riskScore > 50);

  // Chart data preparation
  const riskDistribution = [
    { name: 'Safe', value: results.filter(t => t.riskScore <= 50).length, color: '#10b981' },
    { name: 'Medium', value: results.filter(t => t.riskScore > 50 && t.riskScore <= 70).length, color: '#f59e0b' },
    { name: 'High', value: results.filter(t => t.riskScore > 70).length, color: '#ef4444' }
  ];

  const riskScoreData = results.map((t, index) => ({
    transaction: `T${index + 1}`,
    riskScore: t.riskScore,
    amount: t.amount
  }));

  const amountVsRisk = results.map((t, index) => ({
    amount: t.amount,
    riskScore: t.riskScore,
    name: `T${index + 1}`
  }));

  const locationRisk = results.reduce((acc, t) => {
    const location = t.location || t.Location || 'Unknown';
    if (!acc[location]) {
      acc[location] = { location, totalRisk: 0, count: 0 };
    }
    acc[location].totalRisk += t.riskScore;
    acc[location].count += 1;
    return acc;
  }, {});

  const locationData = Object.values(locationRisk).map(l => ({
    location: l.location,
    avgRisk: Math.round(l.totalRisk / l.count),
    count: l.count
  }));

  return (
    <div className={`min-h-screen transition-all duration-300 ${darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-red-50 to-orange-50'} p-8`}>
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-3`}>CSV Anomaly Detection</h1>
            <p className={`text-lg ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Upload CSV file to analyze transactions for anomalies using ML model</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-xl transition-all duration-200 ${darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-100'} shadow-lg hover:shadow-xl`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className={`rounded-2xl ${darkMode ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50' : 'bg-white/70 backdrop-blur-xl border border-white/20'} shadow-2xl p-8 mb-8`}>
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-6`}>Upload Transaction Data</h2>
        
        <div className="space-y-6">
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
              CSV File (Required columns: amount, location, account, timestamp)
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className={`block w-full text-sm ${darkMode ? 'text-slate-300 bg-slate-700 border-slate-600' : 'text-slate-900 bg-white border-slate-300'} border rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent p-3`}
            />
          </div>
          
          {csvFile && (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
              <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(2)} KB)
              </p>
            </div>
          )}
          
          <button
            onClick={analyzeTransactions}
            disabled={!csvFile || loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Analyzing...' : 'Analyze Transactions'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className={`mb-6 p-6 rounded-2xl ${darkMode ? 'bg-red-900/20 border border-red-800/30' : 'bg-red-50 border border-red-200'} backdrop-blur-sm`}>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className={`font-medium ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</span>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} font-medium`}>Analyzing transactions with ML model...</div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {results.length > 0 && (
        <div className="space-y-8 mb-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/70 border border-white/20'} backdrop-blur-xl shadow-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Transactions</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{results.length}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'} flex items-center justify-center`}>
                  <svg className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/70 border border-white/20'} backdrop-blur-xl shadow-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Anomalous</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{anomalousTransactions.length}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${darkMode ? 'bg-red-900/30' : 'bg-red-100'} flex items-center justify-center`}>
                  <svg className={`w-6 h-6 ${darkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/70 border border-white/20'} backdrop-blur-xl shadow-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Avg Risk Score</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    {Math.round(results.reduce((sum, t) => sum + t.riskScore, 0) / results.length)}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${darkMode ? 'bg-amber-900/30' : 'bg-amber-100'} flex items-center justify-center`}>
                  <svg className={`w-6 h-6 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/70 border border-white/20'} backdrop-blur-xl shadow-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Amount</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    ${results.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${darkMode ? 'bg-green-900/30' : 'bg-green-100'} flex items-center justify-center`}>
                  <svg className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Risk Distribution Pie Chart */}
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/70 border border-white/20'} backdrop-blur-xl shadow-lg`}>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-4`}>Risk Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Scores Bar Chart */}
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/70 border border-white/20'} backdrop-blur-xl shadow-lg`}>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-4`}>Risk Scores by Transaction</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={riskScoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="transaction" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                  <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                      border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="riskScore" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Amount vs Risk Scatter Plot */}
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/70 border border-white/20'} backdrop-blur-xl shadow-lg`}>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-4`}>Amount vs Risk Score</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={amountVsRisk}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="amount" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                  <YAxis dataKey="riskScore" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                      border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Scatter dataKey="riskScore" fill="#ef4444" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Location Risk Analysis */}
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/70 border border-white/20'} backdrop-blur-xl shadow-lg`}>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-4`}>Risk by Location</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={locationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="location" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                  <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                      border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="avgRisk" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <div className={`rounded-2xl ${darkMode ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50' : 'bg-white/70 backdrop-blur-xl border border-white/20'} shadow-2xl overflow-hidden`}>
          <div className={`p-8 border-b ${darkMode ? 'border-slate-700/50' : 'border-slate-200/50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Analysis Results</h3>
                <div className={`px-4 py-2 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'} backdrop-blur-sm`}>
                  <span className={`text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {results.length} Total | {anomalousTransactions.length} Anomalous
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={`divide-y ${darkMode ? 'divide-slate-700/50' : 'divide-slate-200/50'} max-h-96 overflow-y-auto`}>
            {results.map((transaction, index) => (
              <div key={index} className={`p-6 hover:${darkMode ? 'bg-slate-700/20' : 'bg-slate-50/50'} transition-all duration-200`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className={`px-3 py-1 rounded-lg ${getRiskBadge(transaction.riskScore || 0)} border font-bold text-sm`}>
                        {transaction.riskLevel || 'Unknown'}
                      </div>
                      <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        ${transaction.amount.toLocaleString()}
                      </span>
                      <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Score: {transaction.riskScore || 0}/100
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <div className={`w-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded-full h-2 overflow-hidden`}>
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(transaction.riskScore || 0)}`}
                          style={{ width: `${transaction.riskScore || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Location: </span>
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          {transaction.location || transaction.Location || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Account: </span>
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          {transaction.account || transaction.Account || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>ID: </span>
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          {transaction.transactionId || transaction.id || transaction.ID || 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    {transaction.reasons && transaction.reasons.length > 0 && (
                      <div className={`mt-3 p-3 rounded-lg ${darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
                        <p className={`text-sm font-medium ${darkMode ? 'text-red-300' : 'text-red-700'} mb-1`}>Anomaly Reasons:</p>
                        <ul className="text-sm space-y-1">
                          {transaction.reasons.map((reason, idx) => (
                            <li key={idx} className={`${darkMode ? 'text-red-400' : 'text-red-600'}`}>• {reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnomalyDetection;