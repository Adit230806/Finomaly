import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
      const csvText = await csvFile.text();
      const transactions = parseCSV(csvText);
      
      const response = await fetch('http://localhost:5000/api/analyze-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: transactions.map(tx => ({
            id: tx.id || tx.ID || Math.random().toString(36).substr(2, 9),
            account: tx.account || tx.Account || 'Unknown',
            amount: parseFloat(tx.amount || tx.Amount || 0),
            timestamp: tx.timestamp || tx.Timestamp || new Date().toISOString()
          }))
        })
      });

      if (response.ok) {
        const batchResult = await response.json();
        
        if (!batchResult.results || !Array.isArray(batchResult.results)) {
          setError('Invalid response format');
          setLoading(false);
          return;
        }
        
        const analysisResults = batchResult.results.map(result => ({
          id: result.transactionId,
          account: result.account,
          amount: result.amount,
          riskScore: result.riskScore || 0,
          riskLevel: result.riskLevel || "Unknown",
          isAnomaly: result.isAnomaly,
          reasons: result.reasons || []
        }));
        
        setResults(analysisResults);
      } else {
        setError('Batch analysis failed');
      }
    } catch (err) {
      setError('Failed to process CSV: ' + err.message);
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

  const anomalousTransactions = results.filter(t => t.isAnomaly);

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

  return (
    <div className={`min-h-screen transition-all duration-300 ${darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-red-50 to-orange-50'} p-8`}>
      <div className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-3`}>CSV Anomaly Detection</h1>
            <p className={`text-lg ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Upload CSV to analyze transactions</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-xl transition-all duration-200 ${darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-100'} shadow-lg hover:shadow-xl`}
          >
            {darkMode ? 'Sun' : 'Moon'}
          </button>
        </div>
      </div>

      <div className={`rounded-2xl ${darkMode ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50' : 'bg-white/70 backdrop-blur-xl border border-white/20'} shadow-2xl p-8 mb-8`}>
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-6`}>Upload Transaction Data</h2>
        
        <div className="space-y-6">
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
              CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className={`block w-full text-sm ${darkMode ? 'text-slate-300 bg-slate-700 border-slate-600' : 'text-slate-900 bg-white border-slate-300'} border rounded-lg cursor-pointer p-3`}
            />
          </div>
          
          {csvFile && (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
              <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Selected: {csvFile.name}
              </p>
            </div>
          )}
          
          <button
            onClick={analyzeTransactions}
            disabled={!csvFile || loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze Transactions'}
          </button>
        </div>
      </div>

      {error && (
        <div className={`mb-6 p-6 rounded-2xl ${darkMode ? 'bg-red-900/20 border border-red-800/30' : 'bg-red-50 border border-red-200'}`}>
          <span className={`font-medium ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</span>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} font-medium`}>Analyzing...</div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/70 border border-white/20'} shadow-lg`}>
              <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{results.length}</p>
            </div>
            
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/70 border border-white/20'} shadow-lg`}>
              <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Anomalies</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{anomalousTransactions.length}</p>
            </div>
            
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/70 border border-white/20'} shadow-lg`}>
              <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Avg Risk</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                {Math.round(results.reduce((sum, t) => sum + (t.riskScore || 0), 0) / results.length) || 0}
              </p>
            </div>
            
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/70 border border-white/20'} shadow-lg`}>
              <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Amount</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                ₹{results.reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className={`rounded-2xl ${darkMode ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50' : 'bg-white/70 backdrop-blur-xl border border-white/20'} shadow-2xl p-8`}>
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-8`}>Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
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

          <div className={`rounded-2xl ${darkMode ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50' : 'bg-white/70 backdrop-blur-xl border border-white/20'} shadow-2xl p-8`}>
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-8`}>Risk Scores</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskScoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="transaction" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <Tooltip />
                <Bar dataKey="riskScore" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className={`rounded-2xl ${darkMode ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50' : 'bg-white/70 backdrop-blur-xl border border-white/20'} shadow-2xl overflow-hidden`}>
          <div className={`p-8 border-b ${darkMode ? 'border-slate-700/50' : 'border-slate-200/50'}`}>
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Results</h3>
          </div>

          <div className={`divide-y ${darkMode ? 'divide-slate-700/50' : 'divide-slate-200/50'} max-h-96 overflow-y-auto`}>
            {results.map((transaction, index) => (
              <div key={index} className="p-6">
                <div className="flex items-center space-x-4 mb-3">
                  <div className={`px-3 py-1 rounded-lg ${getRiskBadge(transaction.riskScore)} border font-bold text-sm`}>
                    {transaction.riskLevel}
                  </div>
                  <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    ₹{transaction.amount.toLocaleString()}
                  </span>
                  <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Score: {transaction.riskScore}/100
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className={`w-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded-full h-2 overflow-hidden`}>
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(transaction.riskScore)}`}
                      style={{ width: `${transaction.riskScore}%` }}
                    ></div>
                  </div>
                </div>
                
                {transaction.reasons && transaction.reasons.length > 0 && (
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
                    <p className={`text-sm font-medium ${darkMode ? 'text-red-300' : 'text-red-700'} mb-1`}>Reasons:</p>
                    <ul className="text-sm space-y-1">
                      {transaction.reasons.map((reason, idx) => (
                        <li key={idx} className={`${darkMode ? 'text-red-400' : 'text-red-600'}`}>• {reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnomalyDetection;