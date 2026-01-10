/**
 * Country code to country name mapping (ISO 3166-1 alpha-2)
 */

export const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  // North America
  US: "United States",
  CA: "Canada",
  MX: "Mexico",
  
  // Europe
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  BE: "Belgium",
  CH: "Switzerland",
  AT: "Austria",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  PL: "Poland",
  CZ: "Czech Republic",
  GR: "Greece",
  PT: "Portugal",
  IE: "Ireland",
  RU: "Russia",
  UA: "Ukraine",
  
  // Middle East & North Africa
  IQ: "Iraq",
  IR: "Iran",
  TR: "Turkey",
  SA: "Saudi Arabia",
  AE: "United Arab Emirates",
  KW: "Kuwait",
  QA: "Qatar",
  BH: "Bahrain",
  OM: "Oman",
  YE: "Yemen",
  JO: "Jordan",
  LB: "Lebanon",
  SY: "Syria",
  PS: "Palestine",
  IL: "Israel",
  EG: "Egypt",
  LY: "Libya",
  TN: "Tunisia",
  DZ: "Algeria",
  MA: "Morocco",
  SD: "Sudan",
  XK: "Kurdistan",
  
  // Asia
  CN: "China",
  IN: "India",
  JP: "Japan",
  KR: "South Korea",
  KP: "North Korea",
  TH: "Thailand",
  VN: "Vietnam",
  ID: "Indonesia",
  MY: "Malaysia",
  SG: "Singapore",
  PH: "Philippines",
  PK: "Pakistan",
  BD: "Bangladesh",
  AF: "Afghanistan",
  KZ: "Kazakhstan",
  UZ: "Uzbekistan",
  
  // Oceania
  AU: "Australia",
  NZ: "New Zealand",
  
  // South America
  BR: "Brazil",
  AR: "Argentina",
  CL: "Chile",
  CO: "Colombia",
  PE: "Peru",
  VE: "Venezuela",
  
  // Africa
  ZA: "South Africa",
  NG: "Nigeria",
  KE: "Kenya",
  ET: "Ethiopia",
  GH: "Ghana",
};

/**
 * Convert country code to country name
 */
export function getCountryNameFromCode(code: string): string {
  return COUNTRY_CODE_TO_NAME[code.toUpperCase()] || code;
}

/**
 * Convert country name to country code (reverse lookup)
 */
export function getCountryCode(countryName: string): string | null {
  if (!countryName) return null;
  
  // If already a 2-letter code
  if (countryName.length === 2 && /^[A-Z]{2}$/i.test(countryName)) {
    return countryName.toUpperCase();
  }
  
  // Create reverse mapping
  const nameToCode: Record<string, string> = {};
  Object.entries(COUNTRY_CODE_TO_NAME).forEach(([code, name]) => {
    nameToCode[name.toLowerCase()] = code;
  });
  
  return nameToCode[countryName.toLowerCase()] || null;
}

