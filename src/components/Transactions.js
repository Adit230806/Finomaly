import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Setting up Firebase listener...');
    console.log('Database object:', db);
    
    const unsubscribe = onSnapshot(
      collection(db, 'transactions'),
      (querySnapshot) => {
        console.log('Firebase response received');
        console.log('Number of documents:', querySnapshot.size);
        
        const transactionData = [];
        querySnapshot.forEach((doc) => {
          console.log('Document:', doc.id, doc.data());
          transactionData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log('Final transaction data:', transactionData);
        setTransactions(transactionData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Firebase error:', error);
        setError('Failed to fetch transactions: ' + error.message);
        setLoading(false);
      }
    );

    return () => {
      console.log('Cleaning up Firebase listener');
      unsubscribe();
    };
  }, []);

  const exportToPDF = () => {
    const element = document.getElementById('transactions-table');
    const opt = {
      margin: 10,
      filename: 'transactions_report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'landscape' }
    };

    // Create a simple HTML table for PDF
    let htmlContent = `
      <h2>Finomaly - Transactions Report</h2>
      <p>Generated on: ${new Date().toLocaleString()}</p>
      <table border="1" cellpadding="10" style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background-color:#f0f0f0;">
            <th>Transaction ID</th>
            <th>Amount (₹)</th>
            <th>Account</th>
            <th>Location</th>
            <th>Status</th>
            <th>Risk Level</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
    `;

    transactions.forEach(tx => {
      htmlContent += `
        <tr>
          <td>${tx.transactionId || tx.id}</td>
          <td>${tx.amount?.toLocaleString() || 'N/A'}</td>
          <td>${tx.account || 'N/A'}</td>
          <td>${tx.location || 'N/A'}</td>
          <td>${tx.status || 'Unknown'}</td>
          <td>${tx.riskLevel || 'Unknown'}</td>
          <td>${formatDate(tx.date)}</td>
        </tr>
      `;
    });

    htmlContent += `
        </tbody>
      </table>
      <p style="margin-top:20px;"><strong>Summary:</strong></p>
      <p>Total Transactions: ${transactions.length}</p>
      <p>Total Amount: ₹${transactions.reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()}</p>
    `;

    // Use html2pdf library
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => {
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      window.html2pdf().set(opt).from(element).save();
    };
    document.head.appendChild(script);
  };

  const deleteAllTransactions = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'transactions'));
      console.log('Deleting', querySnapshot.size, 'documents');
      
      const deletePromises = querySnapshot.docs.map(document => {
        console.log('Deleting document:', document.id);
        return deleteDoc(doc(db, 'transactions', document.id));
      });
      
      await Promise.all(deletePromises);
      console.log('All transactions deleted!');
    } catch (error) {
      console.error('Error deleting transactions:', error);
      setError('Failed to delete transactions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    switch(risk?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'flagged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading transactions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Transactions</h2>
        <p className="text-gray-600 text-lg">View and manage all financial transactions</p>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">Transactions ({transactions.length})</h3>
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                Filter
              </button>
            <button onClick={exportToPDF} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200">
              Export PDF
            </button>
            </div>
          </div>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">No transactions found in database.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Transaction ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Account</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Location</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Risk Level</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((transaction, index) => (
                  <tr key={transaction.id || index} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{transaction.transactionId || transaction.id}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">₹{transaction.amount?.toLocaleString() || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{transaction.account || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{transaction.location || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(transaction.riskLevel)}`}>
                        {transaction.riskLevel || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(transaction.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;