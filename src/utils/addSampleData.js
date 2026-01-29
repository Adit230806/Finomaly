import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const addSampleTransactions = async () => {
  const sampleTransactions = [
    {
      transactionId: "TXN001",
      amount: 12500,
      account: "****1234",
      location: "New York, NY",
      status: "completed",
      riskLevel: "low",
      date: Timestamp.now()
    },
    {
      transactionId: "TXN002", 
      amount: 50000,
      account: "****5678",
      location: "Los Angeles, CA",
      status: "pending",
      riskLevel: "high",
      date: Timestamp.now()
    },
    {
      transactionId: "TXN003",
      amount: 75000,
      account: "****3456", 
      location: "Miami, FL",
      status: "flagged",
      riskLevel: "critical",
      date: Timestamp.now()
    }
  ];

  try {
    for (const transaction of sampleTransactions) {
      await addDoc(collection(db, 'transactions'), transaction);
    }
    console.log('Sample transactions added successfully!');
  } catch (error) {
    console.error('Error adding sample transactions:', error);
  }
};