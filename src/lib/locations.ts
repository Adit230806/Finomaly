/** Maharashtra cities for transaction location simulation */
export const MAHARASHTRA_LOCATIONS = [
  "Mumbai, MH",
  "Pune, MH",
  "Nashik, MH",
  "Aurangabad, MH",
  "Nagpur, MH",
  "Kolhapur, MH",
  "Solapur, MH",
  "Amravati, MH",
  "Akola, MH",
  "Parbhani, MH",
  "Nanded, MH",
  "Latur, MH",
  "Dhule, MH",
  "Ahmednagar, MH",
  "Chandrapur, MH",
  "Jalgaon, MH",
  "Satara, MH",
  "Sangli, MH",
  "Ratnagiri, MH",
  "Thane, MH",
] as const;

export type MaharashtraLocation = (typeof MAHARASHTRA_LOCATIONS)[number];
