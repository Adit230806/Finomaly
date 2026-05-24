// Seed / demo data and analytics fixtures.
// Domain types live in @/types — re-exported here for backward compatibility.

export type {
  Transaction,
  Category,
  PaymentMethod,
  TxStatus,
  RiskLevel,
} from "@/types/transaction";

export type { Alert, AlertStatus, AlertSeverity } from "@/types/alert";

import type { Transaction, Category } from "@/types/transaction";
import type { Alert } from "@/types/alert";

export interface DailyVolume { date: string; count: number; }
export interface DailyRisk   { date: string; avgRisk: number; anomalyCount: number; }
export interface CategorySpend { category: Category; amount: number; count: number; color: string; }
export interface MerchantFreq  { merchant: string; count: number; totalAmount: number; }
export interface HourlyDist    { hour: number; count: number; avgRisk: number; }

// ── Helpers ──────────────────────────────────────────────────────────────────
function daysAgo(d: number, h = 10, m = 0): string {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  dt.setHours(h, m, 0, 0);
  return dt.toISOString();
}

// ── 50 Transactions ──────────────────────────────────────────────────────────
export const TRANSACTIONS: Transaction[] = [
  // LOW RISK (score 0-30) — 20 items
  { id:"tx-01", amount:12.50,  merchant:"Starbucks",        category:"Food",          location:"Mumbai",   paymentMethod:"UPI",          riskScore:5,  confidenceLevel:98, isAnomaly:false, status:"Normal",  explanation:["Routine coffee purchase","Known merchant","Normal hours"],                                                    timestamp:daysAgo(0,9,15),  userId:"seed-1" },
  { id:"tx-02", amount:9.99,   merchant:"Netflix",          category:"Entertainment", location:"Mumbai",   paymentMethod:"Card",         riskScore:4,  confidenceLevel:99, isAnomaly:false, status:"Normal",  explanation:["Recurring subscription","Expected monthly charge"],                                                          timestamp:daysAgo(0,10,0),  userId:"seed-1" },
  { id:"tx-03", amount:55.00,  merchant:"Uber",             category:"Travel",        location:"Delhi",    paymentMethod:"Wallet",       riskScore:8,  confidenceLevel:97, isAnomaly:false, status:"Normal",  explanation:["Normal ride-share spend","Known location"],                                                                  timestamp:daysAgo(0,8,30),  userId:"seed-1" },
  { id:"tx-04", amount:120.00, merchant:"Amazon",           category:"Shopping",      location:"Mumbai",   paymentMethod:"Card",         riskScore:12, confidenceLevel:95, isAnomaly:false, status:"Normal",  explanation:["Moderate purchase amount","Trusted merchant"],                                                               timestamp:daysAgo(1,14,20), userId:"seed-1" },
  { id:"tx-05", amount:22.00,  merchant:"Walmart",          category:"Shopping",      location:"New York", paymentMethod:"Card",         riskScore:7,  confidenceLevel:98, isAnomaly:false, status:"Normal",  explanation:["Small grocery purchase","Frequent merchant"],                                                                timestamp:daysAgo(1,11,0),  userId:"seed-1" },
  { id:"tx-06", amount:15.00,  merchant:"Starbucks",        category:"Food",          location:"Delhi",    paymentMethod:"UPI",          riskScore:6,  confidenceLevel:99, isAnomaly:false, status:"Normal",  explanation:["Routine food purchase"],                                                                                     timestamp:daysAgo(1,8,45),  userId:"seed-1" },
  { id:"tx-07", amount:8.99,   merchant:"Spotify",          category:"Entertainment", location:"Mumbai",   paymentMethod:"Card",         riskScore:3,  confidenceLevel:99, isAnomaly:false, status:"Normal",  explanation:["Monthly subscription","Expected charge"],                                                                    timestamp:daysAgo(2,12,0),  userId:"seed-1" },
  { id:"tx-08", amount:45.00,  merchant:"Uber",             category:"Travel",        location:"Mumbai",   paymentMethod:"Wallet",       riskScore:9,  confidenceLevel:96, isAnomaly:false, status:"Normal",  explanation:["Normal travel expense"],                                                                                     timestamp:daysAgo(2,18,30), userId:"seed-1" },
  { id:"tx-09", amount:200.00, merchant:"Amazon",           category:"Shopping",      location:"Mumbai",   paymentMethod:"Card",         riskScore:15, confidenceLevel:94, isAnomaly:false, status:"Normal",  explanation:["Moderate purchase","Trusted merchant","Normal hours"],                                                       timestamp:daysAgo(3,15,0),  userId:"seed-1" },
  { id:"tx-10", amount:30.00,  merchant:"Swiggy",           category:"Food",          location:"Delhi",    paymentMethod:"UPI",          riskScore:5,  confidenceLevel:98, isAnomaly:false, status:"Normal",  explanation:["Food delivery","Known merchant"],                                                                            timestamp:daysAgo(3,20,0),  userId:"seed-1" },
  { id:"tx-11", amount:18.50,  merchant:"McDonald's",       category:"Food",          location:"New York", paymentMethod:"Card",         riskScore:4,  confidenceLevel:99, isAnomaly:false, status:"Normal",  explanation:["Fast food purchase","Normal amount"],                                                                        timestamp:daysAgo(4,13,0),  userId:"seed-1" },
  { id:"tx-12", amount:75.00,  merchant:"Steam",            category:"Entertainment", location:"Mumbai",   paymentMethod:"Card",         riskScore:18, confidenceLevel:92, isAnomaly:false, status:"Normal",  explanation:["Gaming purchase","Known platform"],                                                                          timestamp:daysAgo(4,16,0),  userId:"seed-1" },
  { id:"tx-13", amount:250.00, merchant:"Flipkart",         category:"Shopping",      location:"Mumbai",   paymentMethod:"UPI",          riskScore:20, confidenceLevel:91, isAnomaly:false, status:"Normal",  explanation:["Online shopping","Moderate amount"],                                                                         timestamp:daysAgo(5,11,0),  userId:"seed-1" },
  { id:"tx-14", amount:35.00,  merchant:"Zomato",           category:"Food",          location:"Delhi",    paymentMethod:"Wallet",       riskScore:6,  confidenceLevel:98, isAnomaly:false, status:"Normal",  explanation:["Food delivery","Routine purchase"],                                                                          timestamp:daysAgo(5,19,30), userId:"seed-1" },
  { id:"tx-15", amount:60.00,  merchant:"BookMyShow",       category:"Entertainment", location:"Mumbai",   paymentMethod:"Card",         riskScore:10, confidenceLevel:96, isAnomaly:false, status:"Normal",  explanation:["Movie tickets","Normal entertainment spend"],                                                                timestamp:daysAgo(6,17,0),  userId:"seed-1" },
  { id:"tx-16", amount:90.00,  merchant:"MakeMyTrip",       category:"Travel",        location:"Delhi",    paymentMethod:"Card",         riskScore:22, confidenceLevel:90, isAnomaly:false, status:"Normal",  explanation:["Travel booking","Known platform"],                                                                           timestamp:daysAgo(6,10,0),  userId:"seed-1" },
  { id:"tx-17", amount:14.99,  merchant:"Apple",            category:"Entertainment", location:"Mumbai",   paymentMethod:"Card",         riskScore:5,  confidenceLevel:99, isAnomaly:false, status:"Normal",  explanation:["App subscription","Recurring charge"],                                                                       timestamp:daysAgo(7,9,0),   userId:"seed-1" },
  { id:"tx-18", amount:40.00,  merchant:"Walmart",          category:"Shopping",      location:"New York", paymentMethod:"Card",         riskScore:8,  confidenceLevel:97, isAnomaly:false, status:"Normal",  explanation:["Grocery shopping","Normal amount"],                                                                          timestamp:daysAgo(7,14,0),  userId:"seed-1" },
  { id:"tx-19", amount:25.00,  merchant:"Starbucks",        category:"Food",          location:"Berlin",   paymentMethod:"Card",         riskScore:25, confidenceLevel:88, isAnomaly:false, status:"Normal",  explanation:["Coffee purchase","Slightly unusual location but low amount"],                                                timestamp:daysAgo(8,8,0),   userId:"seed-1" },
  { id:"tx-20", amount:110.00, merchant:"Amazon",           category:"Shopping",      location:"Mumbai",   paymentMethod:"Card",         riskScore:14, confidenceLevel:95, isAnomaly:false, status:"Normal",  explanation:["Online purchase","Trusted merchant"],                                                                        timestamp:daysAgo(8,15,0),  userId:"seed-1" },
  // MEDIUM RISK (score 31-70) — 20 items
  { id:"tx-21", amount:850.00,  merchant:"Amazon",           category:"Shopping",      location:"Lagos",    paymentMethod:"Card",         riskScore:45, confidenceLevel:82, isAnomaly:false, status:"Normal",  explanation:["High purchase amount","Unusual location for user","First purchase from this region"],                         timestamp:daysAgo(9,14,0),  userId:"seed-1" },
  { id:"tx-22", amount:500.00,  merchant:"Steam",            category:"Entertainment", location:"Berlin",   paymentMethod:"Card",         riskScore:42, confidenceLevel:80, isAnomaly:false, status:"Normal",  explanation:["Large gaming purchase","Unusual location"],                                                                  timestamp:daysAgo(9,16,0),  userId:"seed-1" },
  { id:"tx-23", amount:320.00,  merchant:"MakeMyTrip",       category:"Travel",        location:"Delhi",    paymentMethod:"Bank Transfer",riskScore:38, confidenceLevel:78, isAnomaly:false, status:"Normal",  explanation:["Large travel booking","Bank transfer method unusual"],                                                       timestamp:daysAgo(10,11,0), userId:"seed-1" },
  { id:"tx-24", amount:1200.00, merchant:"Apple",            category:"Shopping",      location:"New York", paymentMethod:"Card",         riskScore:55, confidenceLevel:85, isAnomaly:false, status:"Normal",  explanation:["High-value electronics purchase","Amount exceeds average","New location"],                                    timestamp:daysAgo(10,13,0), userId:"seed-1" },
  { id:"tx-25", amount:400.00,  merchant:"Flipkart",         category:"Shopping",      location:"Mumbai",   paymentMethod:"UPI",          riskScore:35, confidenceLevel:79, isAnomaly:false, status:"Normal",  explanation:["Large online purchase","Slightly above average spend"],                                                      timestamp:daysAgo(11,10,0), userId:"seed-1" },
  { id:"tx-26", amount:600.00,  merchant:"Walmart",          category:"Shopping",      location:"New York", paymentMethod:"Card",         riskScore:48, confidenceLevel:81, isAnomaly:false, status:"Normal",  explanation:["High grocery spend","Amount 3× average","Unusual time"],                                                     timestamp:daysAgo(11,2,30), userId:"seed-1" },
  { id:"tx-27", amount:750.00,  merchant:"MakeMyTrip",       category:"Travel",        location:"Lagos",    paymentMethod:"Card",         riskScore:62, confidenceLevel:84, isAnomaly:false, status:"Normal",  explanation:["Large travel booking","Unusual destination","High amount"],                                                  timestamp:daysAgo(12,9,0),  userId:"seed-1" },
  { id:"tx-28", amount:280.00,  merchant:"Uber",             category:"Travel",        location:"Berlin",   paymentMethod:"Wallet",       riskScore:40, confidenceLevel:77, isAnomaly:false, status:"Normal",  explanation:["High ride-share cost","Unusual location"],                                                                   timestamp:daysAgo(12,22,0), userId:"seed-1" },
  { id:"tx-29", amount:950.00,  merchant:"Amazon",           category:"Shopping",      location:"Delhi",    paymentMethod:"Card",         riskScore:50, confidenceLevel:83, isAnomaly:false, status:"Normal",  explanation:["Large purchase","Amount significantly above average"],                                                       timestamp:daysAgo(13,15,0), userId:"seed-1" },
  { id:"tx-30", amount:180.00,  merchant:"ATM Withdrawal",   category:"ATM",           location:"Lagos",    paymentMethod:"Card",         riskScore:58, confidenceLevel:86, isAnomaly:false, status:"Normal",  explanation:["ATM withdrawal","Unusual location","Moderate amount"],                                                       timestamp:daysAgo(13,23,0), userId:"seed-1" },
  { id:"tx-31", amount:350.00,  merchant:"Zomato",           category:"Food",          location:"Mumbai",   paymentMethod:"Card",         riskScore:33, confidenceLevel:76, isAnomaly:false, status:"Normal",  explanation:["Large food order","Amount above average for category"],                                                      timestamp:daysAgo(14,20,0), userId:"seed-1" },
  { id:"tx-32", amount:700.00,  merchant:"BookMyShow",       category:"Entertainment", location:"Delhi",    paymentMethod:"Card",         riskScore:44, confidenceLevel:80, isAnomaly:false, status:"Normal",  explanation:["Large entertainment spend","Multiple tickets possibly"],                                                     timestamp:daysAgo(14,17,0), userId:"seed-1" },
  { id:"tx-33", amount:1100.00, merchant:"Flipkart",         category:"Shopping",      location:"Mumbai",   paymentMethod:"Bank Transfer",riskScore:60, confidenceLevel:87, isAnomaly:false, status:"Normal",  explanation:["Very large purchase","Bank transfer unusual for this merchant","High amount"],                               timestamp:daysAgo(15,12,0), userId:"seed-1" },
  { id:"tx-34", amount:220.00,  merchant:"Steam",            category:"Entertainment", location:"New York", paymentMethod:"Card",         riskScore:36, confidenceLevel:78, isAnomaly:false, status:"Normal",  explanation:["Gaming purchase","Moderate amount","Slightly unusual location"],                                             timestamp:daysAgo(15,16,0), userId:"seed-1" },
  { id:"tx-35", amount:480.00,  merchant:"Apple",            category:"Shopping",      location:"Berlin",   paymentMethod:"Card",         riskScore:52, confidenceLevel:82, isAnomaly:false, status:"Normal",  explanation:["Electronics purchase","Unusual location","High amount"],                                                     timestamp:daysAgo(16,11,0), userId:"seed-1" },
  { id:"tx-36", amount:300.00,  merchant:"ATM Withdrawal",   category:"ATM",           location:"Unknown",  paymentMethod:"Card",         riskScore:65, confidenceLevel:88, isAnomaly:false, status:"Normal",  explanation:["ATM withdrawal","Unknown location","Moderate amount"],                                                       timestamp:daysAgo(16,3,0),  userId:"seed-1" },
  { id:"tx-37", amount:560.00,  merchant:"Walmart",          category:"Shopping",      location:"New York", paymentMethod:"Card",         riskScore:41, confidenceLevel:79, isAnomaly:false, status:"Normal",  explanation:["Large grocery purchase","Above average spend"],                                                              timestamp:daysAgo(17,14,0), userId:"seed-1" },
  { id:"tx-38", amount:420.00,  merchant:"Amazon",           category:"Shopping",      location:"Lagos",    paymentMethod:"Card",         riskScore:57, confidenceLevel:84, isAnomaly:false, status:"Normal",  explanation:["Purchase from unusual region","Moderate-high amount"],                                                       timestamp:daysAgo(17,10,0), userId:"seed-1" },
  { id:"tx-39", amount:800.00,  merchant:"MakeMyTrip",       category:"Travel",        location:"Berlin",   paymentMethod:"Bank Transfer",riskScore:63, confidenceLevel:85, isAnomaly:false, status:"Normal",  explanation:["Large international travel booking","Bank transfer","Unusual destination"],                                  timestamp:daysAgo(18,9,0),  userId:"seed-1" },
  { id:"tx-40", amount:150.00,  merchant:"ATM Withdrawal",   category:"ATM",           location:"Delhi",    paymentMethod:"Card",         riskScore:32, confidenceLevel:77, isAnomaly:false, status:"Normal",  explanation:["ATM withdrawal","Known location","Normal amount"],                                                           timestamp:daysAgo(18,15,0), userId:"seed-1" },
  // HIGH RISK (score 71-100) — 10 items
  { id:"tx-41", amount:4299.99, merchant:"Unknown Vendor XZ", category:"Transfer",     location:"Unknown",  paymentMethod:"Crypto",       riskScore:95, confidenceLevel:97, isAnomaly:true,  status:"Anomaly", explanation:["Unknown merchant","Crypto payment","Unknown location","Amount 34× user average","Transaction at 3:24 AM"],  timestamp:daysAgo(19,3,24), userId:"seed-1" },
  { id:"tx-42", amount:7800.00, merchant:"Amazon",             category:"Shopping",     location:"Lagos",    paymentMethod:"Card",         riskScore:88, confidenceLevel:94, isAnomaly:true,  status:"Anomaly", explanation:["Very high amount","Unusual location","Amount 62× average","First purchase from Lagos"],                      timestamp:daysAgo(20,2,10), userId:"seed-1" },
  { id:"tx-43", amount:2100.00, merchant:"Unknown Vendor XZ",  category:"Transfer",     location:"Unknown",  paymentMethod:"Bank Transfer",riskScore:91, confidenceLevel:96, isAnomaly:true,  status:"Anomaly", explanation:["Unknown merchant","International bank transfer","Unknown location","High amount"],                           timestamp:daysAgo(21,4,5),  userId:"seed-1" },
  { id:"tx-44", amount:5500.00, merchant:"ATM Withdrawal",     category:"ATM",          location:"Lagos",    paymentMethod:"Card",         riskScore:85, confidenceLevel:93, isAnomaly:true,  status:"Anomaly", explanation:["Very large ATM withdrawal","Unusual location","Amount far exceeds normal","Late night transaction"],         timestamp:daysAgo(22,1,30), userId:"seed-1" },
  { id:"tx-45", amount:3200.00, merchant:"Unknown Vendor XZ",  category:"Transfer",     location:"Unknown",  paymentMethod:"Crypto",       riskScore:98, confidenceLevel:99, isAnomaly:true,  status:"Anomaly", explanation:["Unknown vendor","Crypto transfer","Unknown location","Extremely high amount","Unusual hour 2:15 AM"],       timestamp:daysAgo(23,2,15), userId:"seed-1" },
  { id:"tx-46", amount:1800.00, merchant:"ATM Withdrawal",     category:"ATM",          location:"Unknown",  paymentMethod:"Card",         riskScore:82, confidenceLevel:92, isAnomaly:true,  status:"Anomaly", explanation:["Large ATM withdrawal","Unknown location","Unusual timing","Amount 14× average"],                            timestamp:daysAgo(24,3,45), userId:"seed-1" },
  { id:"tx-47", amount:6200.00, merchant:"Unknown Vendor XZ",  category:"Transfer",     location:"Lagos",    paymentMethod:"Bank Transfer",riskScore:93, confidenceLevel:97, isAnomaly:true,  status:"Anomaly", explanation:["Unknown merchant","Very high transfer","Unusual location","Multiple risk signals"],                          timestamp:daysAgo(25,4,20), userId:"seed-1" },
  { id:"tx-48", amount:2800.00, merchant:"Amazon",             category:"Shopping",     location:"Unknown",  paymentMethod:"Crypto",       riskScore:79, confidenceLevel:91, isAnomaly:true,  status:"Anomaly", explanation:["Crypto payment on shopping platform","Unknown location","High amount","Unusual payment method"],             timestamp:daysAgo(26,5,0),  userId:"seed-1" },
  { id:"tx-49", amount:4100.00, merchant:"ATM Withdrawal",     category:"ATM",          location:"Berlin",   paymentMethod:"Card",         riskScore:76, confidenceLevel:90, isAnomaly:true,  status:"Anomaly", explanation:["Very large ATM withdrawal","Unusual location","Amount 33× average"],                                         timestamp:daysAgo(27,2,50), userId:"seed-1" },
  { id:"tx-50", amount:9500.00, merchant:"Unknown Vendor XZ",  category:"Transfer",     location:"Unknown",  paymentMethod:"Crypto",       riskScore:99, confidenceLevel:99, isAnomaly:true,  status:"Anomaly", explanation:["Unknown vendor","Largest transaction ever","Crypto","Unknown location","4:01 AM","All risk signals triggered"],timestamp:daysAgo(28,4,1),  userId:"seed-1" },
];

// ── 20 Alerts (from high/medium risk transactions) ───────────────────────────
export const ALERTS: Alert[] = [
  { id:"al-01", transactionId:"tx-41", severity:"high",   reason:"Unknown vendor crypto transfer at 3:24 AM",          status:"New",          timestamp:daysAgo(19,3,25), riskScore:95, merchant:"Unknown Vendor XZ", amount:4299.99, location:"Unknown"  },
  { id:"al-02", transactionId:"tx-42", severity:"high",   reason:"Very high amount purchase from unusual location",     status:"New",          timestamp:daysAgo(20,2,11), riskScore:88, merchant:"Amazon",            amount:7800.00, location:"Lagos"    },
  { id:"al-03", transactionId:"tx-43", severity:"high",   reason:"Unknown merchant international bank transfer",        status:"Under Review", timestamp:daysAgo(21,4,6),  riskScore:91, merchant:"Unknown Vendor XZ", amount:2100.00, location:"Unknown"  },
  { id:"al-04", transactionId:"tx-44", severity:"high",   reason:"Very large ATM withdrawal in unusual location",       status:"Confirmed",    timestamp:daysAgo(22,1,31), riskScore:85, merchant:"ATM Withdrawal",    amount:5500.00, location:"Lagos"    },
  { id:"al-05", transactionId:"tx-45", severity:"high",   reason:"Unknown vendor crypto at 2:15 AM — all signals",     status:"New",          timestamp:daysAgo(23,2,16), riskScore:98, merchant:"Unknown Vendor XZ", amount:3200.00, location:"Unknown"  },
  { id:"al-06", transactionId:"tx-46", severity:"high",   reason:"Large ATM withdrawal from unknown location",          status:"Under Review", timestamp:daysAgo(24,3,46), riskScore:82, merchant:"ATM Withdrawal",    amount:1800.00, location:"Unknown"  },
  { id:"al-07", transactionId:"tx-47", severity:"high",   reason:"Unknown merchant very high bank transfer",            status:"New",          timestamp:daysAgo(25,4,21), riskScore:93, merchant:"Unknown Vendor XZ", amount:6200.00, location:"Lagos"    },
  { id:"al-08", transactionId:"tx-48", severity:"high",   reason:"Crypto payment on shopping platform — unknown loc",  status:"Confirmed",    timestamp:daysAgo(26,5,1),  riskScore:79, merchant:"Amazon",            amount:2800.00, location:"Unknown"  },
  { id:"al-09", transactionId:"tx-49", severity:"high",   reason:"Very large ATM withdrawal at 2:50 AM",               status:"Ignored",      timestamp:daysAgo(27,2,51), riskScore:76, merchant:"ATM Withdrawal",    amount:4100.00, location:"Berlin"   },
  { id:"al-10", transactionId:"tx-50", severity:"high",   reason:"Maximum risk — all signals triggered at 4:01 AM",    status:"Confirmed",    timestamp:daysAgo(28,4,2),  riskScore:99, merchant:"Unknown Vendor XZ", amount:9500.00, location:"Unknown"  },
  { id:"al-11", transactionId:"tx-27", severity:"medium", reason:"Large travel booking to unusual destination",         status:"New",          timestamp:daysAgo(12,9,1),  riskScore:62, merchant:"MakeMyTrip",        amount:750.00,  location:"Lagos"    },
  { id:"al-12", transactionId:"tx-33", severity:"medium", reason:"Large purchase via bank transfer — unusual method",   status:"Under Review", timestamp:daysAgo(15,12,1), riskScore:60, merchant:"Flipkart",          amount:1100.00, location:"Mumbai"   },
  { id:"al-13", transactionId:"tx-36", severity:"medium", reason:"ATM withdrawal from unknown location at 3 AM",        status:"New",          timestamp:daysAgo(16,3,1),  riskScore:65, merchant:"ATM Withdrawal",    amount:300.00,  location:"Unknown"  },
  { id:"al-14", transactionId:"tx-39", severity:"medium", reason:"Large international travel booking via bank transfer",status:"Ignored",      timestamp:daysAgo(18,9,1),  riskScore:63, merchant:"MakeMyTrip",        amount:800.00,  location:"Berlin"   },
  { id:"al-15", transactionId:"tx-24", severity:"medium", reason:"High-value electronics purchase in new location",     status:"Under Review", timestamp:daysAgo(10,13,1), riskScore:55, merchant:"Apple",             amount:1200.00, location:"New York" },
  { id:"al-16", transactionId:"tx-29", severity:"medium", reason:"Large Amazon purchase significantly above average",   status:"Confirmed",    timestamp:daysAgo(13,15,1), riskScore:50, merchant:"Amazon",            amount:950.00,  location:"Delhi"    },
  { id:"al-17", transactionId:"tx-35", severity:"medium", reason:"Electronics purchase from unusual location",          status:"New",          timestamp:daysAgo(16,11,1), riskScore:52, merchant:"Apple",             amount:480.00,  location:"Berlin"   },
  { id:"al-18", transactionId:"tx-38", severity:"medium", reason:"Purchase from unusual region — Lagos",                status:"Ignored",      timestamp:daysAgo(17,10,1), riskScore:57, merchant:"Amazon",            amount:420.00,  location:"Lagos"    },
  { id:"al-19", transactionId:"tx-26", severity:"medium", reason:"High grocery spend at 2:30 AM — unusual timing",     status:"New",          timestamp:daysAgo(11,2,31), riskScore:48, merchant:"Walmart",           amount:600.00,  location:"New York" },
  { id:"al-20", transactionId:"tx-30", severity:"medium", reason:"ATM withdrawal in Lagos at 11 PM",                   status:"Under Review", timestamp:daysAgo(13,23,1), riskScore:58, merchant:"ATM Withdrawal",    amount:180.00,  location:"Lagos"    },
];

// ── Analytics mock data ───────────────────────────────────────────────────────

// 30-day transaction volume
export const DAILY_VOLUME: DailyVolume[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (29 - i));
  return { date: d.toLocaleDateString("en-US", { month:"short", day:"numeric" }), count: 20 + Math.round(Math.sin(i * 0.4) * 15 + Math.random() * 20) };
});

// 30-day risk score trend
export const DAILY_RISK: DailyRisk[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (29 - i));
  return {
    date: d.toLocaleDateString("en-US", { month:"short", day:"numeric" }),
    avgRisk: 20 + Math.round(Math.sin(i * 0.5) * 20 + Math.random() * 15),
    anomalyCount: Math.max(0, Math.round(Math.sin(i * 0.3) * 3 + 1)),
  };
});

// Spending by category
export const CATEGORY_SPEND: CategorySpend[] = [
  { category:"Shopping",     amount:18420, count:18, color:"#00C853" },
  { category:"Food",         amount:4280,  count:12, color:"#FF9500" },
  { category:"Travel",       amount:9650,  count:8,  color:"#007AFF" },
  { category:"ATM",          amount:12380, count:7,  color:"#FF3B30" },
  { category:"Transfer",     amount:25300, count:5,  color:"#AF52DE" },
  { category:"Entertainment",amount:3120,  count:10, color:"#5AC8FA" },
];

// Merchant frequency
export const MERCHANT_FREQ: MerchantFreq[] = [
  { merchant:"Amazon",          count:12, totalAmount:14200 },
  { merchant:"Starbucks",       count:10, totalAmount:145   },
  { merchant:"ATM Withdrawal",  count:8,  totalAmount:12380 },
  { merchant:"Unknown Vendor XZ",count:5, totalAmount:25100 },
  { merchant:"Uber",            count:7,  totalAmount:380   },
  { merchant:"Walmart",         count:6,  totalAmount:1350  },
  { merchant:"MakeMyTrip",      count:5,  totalAmount:2340  },
  { merchant:"Steam",           count:4,  totalAmount:1070  },
];

// Hourly distribution (24 hours)
export const HOURLY_DIST: HourlyDist[] = Array.from({ length: 24 }, (_, h) => {
  const isNight = h >= 1 && h <= 5;
  return {
    hour: h,
    count: isNight ? Math.round(Math.random() * 3 + 1) : Math.round(Math.sin((h - 6) * 0.4) * 15 + 20 + Math.random() * 10),
    avgRisk: isNight ? 65 + Math.round(Math.random() * 25) : 15 + Math.round(Math.random() * 30),
  };
});

// Risk heatmap: 7 days × 24 hours
export const RISK_HEATMAP: { day: number; hour: number; avgRisk: number }[] = [];
for (let day = 0; day < 7; day++) {
  for (let hour = 0; hour < 24; hour++) {
    const isNight = hour >= 1 && hour <= 5;
    RISK_HEATMAP.push({
      day,
      hour,
      avgRisk: isNight ? 55 + Math.round(Math.random() * 40) : 10 + Math.round(Math.random() * 45),
    });
  }
}

export const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
