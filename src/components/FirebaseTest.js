import React, { useState } from 'react';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const FirebaseTest = () => {
  const [status, setStatus] = useState('');
  const [data, setData] = useState([]);

  const testConnection = async () => {
    setStatus('Testing Firebase connection...');
    try {
      // Test adding data
      const docRef = await addDoc(collection(db, 'test'), {
        message: 'Hello Firebase!',
        timestamp: Timestamp.now()
      });
      setStatus(`✅ Successfully added document with ID: ${docRef.id}`);
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  const addTransactionData = async () => {
    setStatus('Adding transaction data...');
    try {
      const transaction = {
        transactionId: "TXN001",
        amount: 12500,
        account: "****1234",
        location: "New York, NY",
        status: "completed",
        riskLevel: "low",
        date: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'transactions'), transaction);
      setStatus(`✅ Transaction added with ID: ${docRef.id}`);
    } catch (error) {
      setStatus(`❌ Error adding transaction: ${error.message}`);
    }
  };

  const readTransactions = async () => {
    setStatus('Reading transactions...');
    try {
      const querySnapshot = await getDocs(collection(db, 'transactions'));
      const transactions = [];
      querySnapshot.forEach((doc) => {
        transactions.push({ id: doc.id, ...doc.data() });
      });
      setData(transactions);
      setStatus(`✅ Found ${transactions.length} transactions`);
    } catch (error) {
      setStatus(`❌ Error reading transactions: ${error.message}`);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Firebase Test</h2>
      
      <div className="space-y-4">
        <button 
          onClick={testConnection}
          className="px-4 py-2 bg-blue-600 text-white rounded mr-4"
        >
          Test Connection
        </button>
        
        <button 
          onClick={addTransactionData}
          className="px-4 py-2 bg-green-600 text-white rounded mr-4"
        >
          Add Transaction
        </button>
        
        <button 
          onClick={readTransactions}
          className="px-4 py-2 bg-purple-600 text-white rounded"
        >
          Read Transactions
        </button>
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <strong>Status:</strong> {status}
      </div>

      {data.length > 0 && (
        <div className="mt-4">
          <h3 className="font-bold">Data:</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default FirebaseTest;