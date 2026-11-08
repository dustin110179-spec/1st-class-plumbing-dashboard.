/**
 * Richardson and Plano housing figures used by the market model.
 * Household counts match ACS 5-year 2020–2024 table B25003 (occupied housing units).
 * Tenure, structure, and year-built figures are labeled with their ACS vintage.
 * Hypothetical demand (jobs per household, tickets, penetration) lives in MarketAssumptions, not here.
 */

export const CENSUS_HOUSEHOLDS = {
  richardson: {
    households: 45818,
    source: "U.S. Census Bureau, ACS 5-year 2020–2024, table B25003 (occupied housing units).",
    year: "2020–2024",
  },
  plano: {
    households: 112438,
    source: "U.S. Census Bureau, ACS 5-year 2020–2024, table B25003 (occupied housing units).",
    year: "2020–2024",
  },
} as const;

export const CENSUS_HOUSING_DETAIL = {
  richardson: {
    occupiedHouseholds: 45444,
    ownerOccupied: 23104,
    ownerShare: 0.508,
    renterOccupied: 22340,
    housingUnits: 47827,
    detachedShare: 0.541,
    attachedShare: 0.038,
    medianYearBuilt: 1985,
    medianHouseholdIncome: 96257,
    medianHomeValue: 405600,
    source: "U.S. Census Bureau, ACS 5-year 2019–2023 (city of Richardson, TX).",
    year: "2019–2023",
  },
  plano: {
    occupiedHouseholds: 110522,
    ownerOccupied: 62592,
    ownerShare: 0.566,
    renterOccupied: 47930,
    housingUnits: 116440,
    detachedShare: 0.594,
    attachedShare: 0.039,
    medianYearBuilt: 1993,
    medianHouseholdIncome: 108649,
    medianHomeValue: 440600,
    source: "U.S. Census Bureau, ACS 5-year 2019–2023 (city of Plano, TX).",
    year: "2019–2023",
  },
} as const;

export interface ZipFact {
  zip: string;
  city: "richardson" | "plano" | "adjacent";
  label: string;
  households: number | null;
  householdsNote: string;
  ownerShare: number | null;
  medianYearBuilt: number | null;
  medianIncome: number | null;
  medianHomeValue: number | null;
  source: string;
}

export const ZIP_FACTS: ZipFact[] = [
  {
    zip: "75080",
    city: "richardson",
    label: "West Richardson / UT Dallas",
    households: 18842,
    householdsNote: "Occupied households, ACS 5-year 2020–2024.",
    ownerShare: 0.55,
    medianYearBuilt: 1973,
    medianIncome: 92903,
    medianHomeValue: 447100,
    source: "U.S. Census Bureau, ACS 5-year 2020–2024, ZCTA 75080.",
  },
  {
    zip: "75081",
    city: "richardson",
    label: "East Richardson",
    households: 14015,
    householdsNote: "Derived: 14,538 housing units × (1 − 3.6% vacant), ACS 5-year 2020–2024. Occupied count is estimated from units and vacancy, not a published B25003 extract.",
    ownerShare: 0.51,
    medianYearBuilt: 1979,
    medianIncome: 93165,
    medianHomeValue: 371500,
    source: "U.S. Census Bureau, ACS 5-year 2020–2024, ZCTA 75081.",
  },
  {
    zip: "75082",
    city: "richardson",
    label: "Northeast Richardson / Murphy edge",
    households: null,
    householdsNote: "Reliable occupied-household count not confirmed in the sources used for this build.",
    ownerShare: 0.482,
    medianYearBuilt: 2002,
    medianIncome: 110534,
    medianHomeValue: 492900,
    source: "U.S. Census Bureau, ACS 5-year 2020–2024, ZCTA 75082 (owner share and year built).",
  },
  {
    zip: "75023",
    city: "plano",
    label: "West Plano",
    households: 18923,
    householdsNote: "Derived: 19,670 housing units × (1 − 3.8% vacant), ACS 5-year 2020–2024. Occupied count is estimated from units and vacancy.",
    ownerShare: 0.64,
    medianYearBuilt: 1985,
    medianIncome: 109660,
    medianHomeValue: 416500,
    source: "U.S. Census Bureau, ACS 5-year 2020–2024, ZCTA 75023.",
  },
  {
    zip: "75025",
    city: "plano",
    label: "East Plano",
    households: null,
    householdsNote: "Occupied-household count not confirmed in the sources used for this build.",
    ownerShare: 0.66,
    medianYearBuilt: null,
    medianIncome: 143260,
    medianHomeValue: 486100,
    source: "U.S. Census Bureau, ACS 5-year 2020–2024, ZCTA 75025.",
  },
  {
    zip: "75074",
    city: "plano",
    label: "Central Plano",
    households: 18979,
    householdsNote: "Derived: 19,708 housing units × (1 − 3.7% vacant), ACS 5-year 2020–2024. Occupied count is estimated from units and vacancy.",
    ownerShare: 0.53,
    medianYearBuilt: 1994,
    medianIncome: 88697,
    medianHomeValue: 371000,
    source: "U.S. Census Bureau, ACS 5-year 2020–2024, ZCTA 75074.",
  },
  {
    zip: "75075",
    city: "plano",
    label: "South Plano",
    households: null,
    householdsNote: "Occupied-household count not confirmed in the sources used for this build.",
    ownerShare: 0.61,
    medianYearBuilt: 1988,
    medianIncome: 98365,
    medianHomeValue: 428000,
    source: "U.S. Census Bureau, ACS 5-year 2020–2024, ZCTA 75075.",
  },
  {
    zip: "75093",
    city: "plano",
    label: "West Plano / Willow Bend",
    households: null,
    householdsNote: "Occupied-household count not confirmed in the sources used for this build.",
    ownerShare: 0.59,
    medianYearBuilt: null,
    medianIncome: 124563,
    medianHomeValue: 670500,
    source: "U.S. Census Bureau, ACS 5-year 2020–2024, ZCTA 75093.",
  },
];
