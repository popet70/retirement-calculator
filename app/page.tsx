'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart } from 'recharts';

const InfoTooltip = ({ text }: { text: string }) => {
  return (
    <span style={{ position: 'relative', display: 'inline-block', marginLeft: '4px' }}>
      <span 
        style={{ 
          color: '#2563eb', 
          cursor: 'help', 
          fontSize: '14px',
          fontWeight: 'bold'
        }}
        title={text}
      >
        ⓘ
      </span>
    </span>
  );
};

const RetirementCalculator = () => {
  const [mainSuperBalance, setMainSuperBalance] = useState(1360000);
  const [sequencingBuffer, setSequencingBuffer] = useState(200000);
  const [totalPensionIncome, setTotalPensionIncome] = useState(101000);
  const [baseSpending, setBaseSpending] = useState(120000);
  const [selectedScenario, setSelectedScenario] = useState(4);
  const [isHomeowner, setIsHomeowner] = useState(true);
  const [includeAgePension, setIncludeAgePension] = useState(true);
  const [spendingPattern, setSpendingPattern] = useState('jpmorgan');
  const [useGuardrails, setUseGuardrails] = useState(false);
  const [upperGuardrail, setUpperGuardrail] = useState(20);
  const [lowerGuardrail, setLowerGuardrail] = useState(15);
  const [guardrailAdjustment, setGuardrailAdjustment] = useState(10);
  const [showNominalDollars, setShowNominalDollars] = useState(false);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [inflationRate, setInflationRate] = useState(2.5);
  const [useHistoricalData, setUseHistoricalData] = useState(false);
  const [useMonteCarlo, setUseMonteCarlo] = useState(false);
  const [useFormalTest, setUseFormalTest] = useState(false);
  const [historicalPeriod, setHistoricalPeriod] = useState('gfc2008');
  const [monteCarloRuns, setMonteCarloRuns] = useState(1000);
  const [expectedReturn, setExpectedReturn] = useState(7);
  const [returnVolatility, setReturnVolatility] = useState(18);
  const [monteCarloResults, setMonteCarloResults] = useState<any>(null);
  const [formalTestResults, setFormalTestResults] = useState(null);
  const [selectedFormalTest, setSelectedFormalTest] = useState<string | null>(null);
  const [splurgeAmount, setSplurgeAmount] = useState(0);
  const [splurgeStartAge, setSplurgeStartAge] = useState(65);
  const [splurgeDuration, setSplurgeDuration] = useState(5);
  const [oneOffExpenses, setOneOffExpenses] = useState([
    { description: 'Major Appliance Replacement', age: 64, amount: 12000 },
    { description: 'Technology Refresh', age: 62, amount: 5000 },
    { description: 'Unexpected Home Repairs', age: 64, amount: 10000 },
    { description: 'Vehicle Replacement', age: 68, amount: 60000 },
    { description: 'Second Appliance Cycle', age: 68, amount: 10000 },
    { description: 'Home Maintenance', age: 70, amount: 25000 },
    { description: 'Technology Upgrade #2', age: 72, amount: 6000 },
    { description: 'Medical/Dental Work', age: 74, amount: 20000 },
    { description: 'Minor Accessibility Mods', age: 75, amount: 10000 },
    { description: 'Major Home Maintenance #2', age: 77, amount: 35000 },
    { description: 'Third Vehicle', age: 78, amount: 60000 },
    { description: 'Appliance Cycle #3', age: 79, amount: 12000 },
    { description: 'Significant Accessibility Modifications', age: 82, amount: 30000 },
    { description: 'In-home Care Setup', age: 84, amount: 15000 }
  ]);
  const [showOneOffExpenses, setShowOneOffExpenses] = useState(true);
  const [showPensionSummary, setShowPensionSummary] = useState(true);
  const [currentAge, setCurrentAge] = useState(55);
  const [retirementAge, setRetirementAge] = useState(60);
  const [pensionRecipientType, setPensionRecipientType] = useState<'single' | 'couple'>('couple');
  
  // Aged Care Configuration
  const [includeAgedCare, setIncludeAgedCare] = useState(false);
  const [agedCareApproach, setAgedCareApproach] = useState<'probabilistic' | 'deterministic'>('probabilistic');
  const [agedCareRAD, setAgedCareRAD] = useState(400000); // Refundable Accommodation Deposit
  const [agedCareAnnualCost, setAgedCareAnnualCost] = useState(65000); // Basic + means-tested fees
  const [deterministicAgedCareAge, setDeterministicAgedCareAge] = useState(85);
  const [agedCareDuration, setAgedCareDuration] = useState(3); // Average stay duration
  const [personAtHomeSpending, setPersonAtHomeSpending] = useState(0.70); // Person at home needs 70% of couple spending
  const [deathInCare, setDeathInCare] = useState(true); // Assume death in aged care (vs exit)
  
  // Partner configuration for aged care
  const [partnerAge, setPartnerAge] = useState(55); // Simone's age
  const [includePartnerAgedCare, setIncludePartnerAgedCare] = useState(true);
  
  // Partner Mortality Modeling
  const [includePartnerMortality, setIncludePartnerMortality] = useState(false);
  const [partnerGender, setPartnerGender] = useState<'male' | 'female'>('female');
  const [pensionReversionary, setPensionReversionary] = useState(0.67); // PSS/CSS reversionary percentage

  // Debt Repayment at Retirement
  const [includeDebt, setIncludeDebt] = useState(false);
  const [debts, setDebts] = useState<Array<{name: string, amount: number, interestRate: number, repaymentYears: number, extraPayment: number}>>([]);

  // Calculate retirement year based on current age
  const getRetirementYear = (retAge: number) => {
    const currentYear = 2026;
    const yearsUntilRetirement = retAge - currentAge;
    return currentYear + yearsUntilRetirement;
  };

  const historicalReturns = {
    gfc2008: [-37,26,15,2,16,32,14,1,12,22,-4,29,19,31,-18,27,16,21,12,26,18,22,15,28,8,18,12,20,15,18,17,16,18,17,18],
    covid2020: [-18,27,16,21,12,26,18,22,15,28,8,18,12,20,15,18,22,16,19,24,11,17,14,21,13,19,16,23,12,18,17,18,16,19,17],
    depression1929: [-8,-25,-43,-8,54,48,-1,33,-35,31,26,0,-10,29,-12,34,20,36,25,6,19,31,24,18,16,7,21,43,32,19,23,20,18,22,19],
    dotcom2000: [-9,-12,-22,29,11,5,16,6,-37,26,15,2,16,32,14,1,12,22,-4,29,19,31,-18,27,16,21,12,26,18,22,19,20,17,18,19],
    stagflation1973: [-15,-26,37,24,-7,7,18,32,22,6,-5,21,5,16,32,18,-3,31,21,7,12,16,15,22,18,26,19,28,14,20,18,19,20,17,19],
    bullmarket1982: [22,23,6,32,18,5,17,32,31,19,-3,38,23,33,28,21,10,-9,-12,-22,29,11,5,16,6,-37,26,15,2,16,14,12,15,11,13]
  };

  const historicalLabels = {
    gfc2008: '2008 Global Financial Crisis',
    covid2020: '2020 COVID-19 Pandemic',
    depression1929: '1929 Great Depression',
    dotcom2000: '2000 Dot-com Crash',
    stagflation1973: '1973 Stagflation Crisis',
    bullmarket1982: '1982 Bull Market'
  };

  const formalTests = {
    A1: { name: 'A1: Base Case', returns: Array(35).fill(5), cpi: 2.5, desc: '5% return, baseline test', health: false, years: 35 },
    A2: { name: 'A2: Low Returns', returns: Array(35).fill(3.5), cpi: 2.5, desc: '3.5% return, structural test', health: false, years: 35 },
    B1: { name: 'B1: Crash', returns: [-25,-15,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5], cpi: 2.5, desc: 'Immediate crash then recovery', health: false, years: 35 },
    B2: { name: 'B2: Bear Market', returns: [0,0,0,0,0,0,0,0,0,0,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5], cpi: 2.5, desc: '10 years zero return', health: false, years: 35 },
    B3: { name: 'B3: High Volatility', returns: [12,-18,15,-12,20,-15,18,-10,10,-8,15,-12,8,-5,12,-8,10,-6,8,-4,7,-3,6,-2,5,5,5,5,5,5,5,5,5,5,5], cpi: 2.5, desc: 'High volatility 5% average', health: false, years: 35 },
    C1: { name: 'C1: High Inflation', returns: Array(35).fill(5), cpi: 5, desc: '5% CPI entire period', health: false, years: 35 },
    D1: { name: 'D1: Extreme Longevity', returns: Array(45).fill(5), cpi: 2.5, desc: 'Survival to age 105', health: false, years: 45 },
    G1: { name: 'G1: Health Shock', returns: Array(35).fill(5), cpi: 2.5, desc: '$30k/year from age 75', health: true, years: 35 },
    H1: { name: 'H1: Worst Case', returns: [-25,-15,5,0,0,0,0,0,0,0,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5], cpi: 5, desc: 'Crash + High CPI + Health', health: true, years: 35 }
  };

  // Historical market data: S&P 500 Total Return Index (1928-2025, 98 years)
  // Source: Robert Shiller (Yale University) and Ibbotson SBBI
  // Data represents actual annual total returns (price appreciation + reinvested dividends)
  // This is verified, authoritative data used by financial professionals worldwide
  const historicalMarketData = [
    // 1928-1940: Great Depression era
    { year: 1928, return: 43.8 }, { year: 1929, return: -8.4 }, { year: 1930, return: -25.1 },
    { year: 1931, return: -43.3 }, { year: 1932, return: -8.2 }, { year: 1933, return: 54.0 },
    { year: 1934, return: -1.4 }, { year: 1935, return: 47.7 }, { year: 1936, return: 33.9 },
    { year: 1937, return: -35.0 }, { year: 1938, return: 31.1 }, { year: 1939, return: -0.4 },
    { year: 1940, return: -9.8 },
    // 1941-1960: WWII and post-war boom
    { year: 1941, return: -11.6 }, { year: 1942, return: 20.3 }, { year: 1943, return: 25.9 },
    { year: 1944, return: 19.8 }, { year: 1945, return: 36.4 }, { year: 1946, return: -8.1 },
    { year: 1947, return: 5.7 }, { year: 1948, return: 5.5 }, { year: 1949, return: 18.8 },
    { year: 1950, return: 31.7 }, { year: 1951, return: 24.0 }, { year: 1952, return: 18.4 },
    { year: 1953, return: -1.0 }, { year: 1954, return: 52.6 }, { year: 1955, return: 31.6 },
    { year: 1956, return: 6.6 }, { year: 1957, return: -10.8 }, { year: 1958, return: 43.4 },
    { year: 1959, return: 12.0 }, { year: 1960, return: 0.5 },
    // 1961-1980: Growth, then stagflation
    { year: 1961, return: 26.9 }, { year: 1962, return: -8.7 }, { year: 1963, return: 22.8 },
    { year: 1964, return: 16.5 }, { year: 1965, return: 12.5 }, { year: 1966, return: -10.1 },
    { year: 1967, return: 24.0 }, { year: 1968, return: 11.1 }, { year: 1969, return: -8.5 },
    { year: 1970, return: 4.0 }, { year: 1971, return: 14.3 }, { year: 1972, return: 19.0 },
    { year: 1973, return: -14.7 }, { year: 1974, return: -26.5 }, { year: 1975, return: 37.2 },
    { year: 1976, return: 23.8 }, { year: 1977, return: -7.2 }, { year: 1978, return: 6.6 },
    { year: 1979, return: 18.4 }, { year: 1980, return: 32.4 },
    // 1981-2000: Reagan/Thatcher era, dot-com boom
    { year: 1981, return: -4.9 }, { year: 1982, return: 21.4 }, { year: 1983, return: 22.5 },
    { year: 1984, return: 6.3 }, { year: 1985, return: 32.2 }, { year: 1986, return: 18.5 },
    { year: 1987, return: 5.2 }, { year: 1988, return: 16.8 }, { year: 1989, return: 31.5 },
    { year: 1990, return: -3.2 }, { year: 1991, return: 30.5 }, { year: 1992, return: 7.7 },
    { year: 1993, return: 10.0 }, { year: 1994, return: 1.3 }, { year: 1995, return: 37.4 },
    { year: 1996, return: 23.1 }, { year: 1997, return: 33.4 }, { year: 1998, return: 28.6 },
    { year: 1999, return: 21.0 }, { year: 2000, return: -9.1 },
    // 2001-2025: Dot-com crash, GFC, COVID, recent
    { year: 2001, return: -11.9 }, { year: 2002, return: -22.1 }, { year: 2003, return: 28.7 },
    { year: 2004, return: 10.9 }, { year: 2005, return: 4.9 }, { year: 2006, return: 15.8 },
    { year: 2007, return: 5.5 }, { year: 2008, return: -37.0 }, { year: 2009, return: 26.5 },
    { year: 2010, return: 15.1 }, { year: 2011, return: 2.1 }, { year: 2012, return: 16.0 },
    { year: 2013, return: 32.4 }, { year: 2014, return: 13.7 }, { year: 2015, return: 1.4 },
    { year: 2016, return: 12.0 }, { year: 2017, return: 21.8 }, { year: 2018, return: -4.4 },
    { year: 2019, return: 31.5 }, { year: 2020, return: 18.4 }, { year: 2021, return: 28.7 },
    { year: 2022, return: -18.1 }, { year: 2023, return: 26.3 }, { year: 2024, return: 23.3 },
    { year: 2025, return: 12.1 }
  ];

  // New state for Historical Monte Carlo
  const [useHistoricalMonteCarlo, setUseHistoricalMonteCarlo] = useState(false);
  const [historicalMethod, setHistoricalMethod] = useState<'shuffle' | 'overlapping' | 'block'>('overlapping');
  const [blockSize, setBlockSize] = useState(5);
  const [historicalMonteCarloResults, setHistoricalMonteCarloResults] = useState<any>(null);

  // Auto-switch aged care to deterministic when leaving Monte Carlo scenarios
  useEffect(() => {
    if (includeAgedCare && agedCareApproach === 'probabilistic' && !useMonteCarlo && !useHistoricalMonteCarlo) {
      setAgedCareApproach('deterministic');
    }
  }, [useMonteCarlo, useHistoricalMonteCarlo, includeAgedCare, agedCareApproach]);


  const runFormalTests = () => {
    const results: any = {};
    Object.keys(formalTests).forEach((key: string) => {
      const test = formalTests[key as keyof typeof formalTests];
      const simResult = runSimulation(test.returns, test.cpi, test.health, test.years);
      const targetYears = test.years;
      const passed = simResult && simResult.length >= targetYears && simResult[simResult.length - 1].totalBalance > 0;
      results[key] = {
        name: test.name,
        desc: test.desc,
        passed: passed,
        finalBalance: simResult && simResult.length > 0 ? simResult[simResult.length - 1].totalBalance : 0,
        yearsLasted: simResult ? simResult.length : 0,
        targetYears: targetYears,
        simulationData: simResult
      };
    });
    return results;
  };

  const agePensionParams = useMemo(() => {
    if (pensionRecipientType === 'single') {
      return {
        eligibilityAge: 67,
        maxPensionPerYear: 29754,  // Single rate
        assetTestThresholdHomeowner: 314000,
        assetTestCutoffHomeowner: 695500,
        assetTestThresholdNonHomeowner: 566000,
        assetTestCutoffNonHomeowner: 947500,
        assetTaperPerYear: 78,
        incomeTestFreeArea: 5512,  // Single rate
        incomeTaperRate: 0.50
      };
    } else {
      return {
        eligibilityAge: 67,
        maxPensionPerYear: 44855,  // Couple rate (combined)
        assetTestThresholdHomeowner: 451500,
        assetTestCutoffHomeowner: 986500,
        assetTestThresholdNonHomeowner: 675500,
        assetTestCutoffNonHomeowner: 1210500,
        assetTaperPerYear: 78,
        incomeTestFreeArea: 8736,  // Couple rate
        incomeTaperRate: 0.50
      };
    }
  }, [pensionRecipientType]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(value);
  };

  // Convert value for display
  // Simulation stores values in NOMINAL dollars (inflation-adjusted forward from retirement year)
  // year is years from retirement (1-35)
  const toDisplayValue = (value: number, year = 1, cpi?: number) => {
    if (showNominalDollars) {
      // Show nominal - simulation values are already nominal
      return value;
    } else {
      // Convert from nominal to real retirement year dollars by deflating
      // Use provided CPI rate if available (for formal tests with different CPI), otherwise use global inflationRate
      const cpiToUse = cpi !== undefined ? cpi : inflationRate;
      return value / Math.pow(1 + cpiToUse / 100, year - 1);
    }
  };

  const splurgeSummary = useMemo(() => {
    if (splurgeAmount === 0) {
      return { enabled: false, message: "Set splurge amount above $0 to activate", totalSplurge: 0, activePeriod: '', annualImpact: '' };
    }
    
    const totalSplurge = splurgeAmount * splurgeDuration;
    const endAge = splurgeStartAge + splurgeDuration - 1;
    const startYear = getRetirementYear(retirementAge) + (splurgeStartAge - retirementAge);
    const endYear = startYear + splurgeDuration - 1;
    const combinedSpending = baseSpending + splurgeAmount;
    
    return {
      enabled: true,
      totalSplurge,
      activePeriod: `Age ${splurgeStartAge} to ${endAge} (${startYear}-${endYear})`,
      annualImpact: `Combined spending ${formatCurrency(combinedSpending)}/year`
    };
  }, [splurgeAmount, splurgeStartAge, splurgeDuration, baseSpending, retirementAge, currentAge]);

  const getSpendingMultiplier = (year: number) => {
    if (spendingPattern === 'cpi') {
      return 1.0;
    } else {
      // JP Morgan declining pattern
      if (year <= 10) {
        return Math.pow(0.982, year - 1);
      } else if (year <= 20) {
        const year10Multiplier = Math.pow(0.982, 9);
        return year10Multiplier * Math.pow(0.986, year - 10);
      } else {
        const year10Multiplier = Math.pow(0.982, 9);
        const year20Multiplier = year10Multiplier * Math.pow(0.986, 10);
        return year20Multiplier * Math.pow(0.999, year - 20);
      }
    }
  };

  const getMinimumDrawdown = (age: number, balance: number) => {
    if (balance <= 0) return 0;
    let rate;
    if (age < 65) rate = 0.04;
    else if (age < 75) rate = 0.05;
    else if (age < 80) rate = 0.06;
    else if (age < 85) rate = 0.07;
    else if (age < 90) rate = 0.09;
    else if (age < 95) rate = 0.11;
    else rate = 0.14;
    return balance * rate;
  };

  // Calculate probability of needing aged care by age
  // Based on Australian data: ~30% of people use residential aged care
  // Risk increases sharply after 80
  const getAgedCareProbability = (age: number) => {
    if (age < 75) return 0.02; // 2% cumulative by 75
    if (age < 80) return 0.05; // 5% by 80
    if (age < 85) return 0.15; // 15% by 85
    if (age < 90) return 0.30; // 30% by 90
    if (age < 95) return 0.45; // 45% by 95
    return 0.55; // 55% by 100
  };

  // Calculate aged care costs for a given year
  // Returns: { radRequired, annualCost, inAgedCare }
  const getAgedCareCosts = (
    age: number, 
    year: number, 
    cpiRate: number,
    randomValue: number, // For probabilistic approach
    currentlyInCare: boolean,
    yearsInCare: number
  ) => {
    if (!includeAgedCare) return { radRequired: 0, annualCost: 0, inAgedCare: false, yearsInCare: 0 };

    let inAgedCare = currentlyInCare;
    let newYearsInCare = yearsInCare;

    if (agedCareApproach === 'deterministic') {
      // Simple: enter at specified age, stay for specified duration
      if (age >= deterministicAgedCareAge && age < deterministicAgedCareAge + agedCareDuration) {
        inAgedCare = true;
        newYearsInCare = age - deterministicAgedCareAge + 1;
      } else if (age >= deterministicAgedCareAge + agedCareDuration) {
        // Exited care after completing duration
        inAgedCare = false;
        newYearsInCare = 0;
      }
    } else {
      // Probabilistic: use age-based probability and random value
      if (!currentlyInCare) {
        const probability = getAgedCareProbability(age);
        // Check if this is the year they enter care
        // Use cumulative approach: if random value < probability for this age band
        if (randomValue < probability / 100) { // Convert probability to 0-1 range
          inAgedCare = true;
          newYearsInCare = 1;
        }
      } else {
        // Already in care, continue until duration expires
        newYearsInCare = yearsInCare + 1;
        if (newYearsInCare <= agedCareDuration) {
          inAgedCare = true;
        } else {
          // Exited care (or died)
          inAgedCare = false;
          newYearsInCare = 0;
        }
      }
    }

    if (!inAgedCare) {
      return { radRequired: 0, annualCost: 0, inAgedCare: false, yearsInCare: newYearsInCare };
    }

    // RAD is required in first year of care
    const inflationAdjustedRAD = newYearsInCare === 1 
      ? agedCareRAD * Math.pow(1 + cpiRate / 100, year - 1)
      : 0;

    // Annual costs increase with CPI
    const inflationAdjustedAnnualCost = agedCareAnnualCost * Math.pow(1 + cpiRate / 100, year - 1);

    return {
      radRequired: inflationAdjustedRAD,
      annualCost: inflationAdjustedAnnualCost,
      inAgedCare: true,
      yearsInCare: newYearsInCare
    };
  };

  // Australian mortality probabilities (probability of death in next year)
  // Based on ABS Life Tables 2020-2022
  const getMortalityProbability = (age: number, gender: 'male' | 'female') => {
    // Simplified Australian life table data
    const maleMortality: { [key: number]: number } = {
      55: 0.0033, 60: 0.0055, 65: 0.0095, 70: 0.0157, 75: 0.0266,
      80: 0.0468, 85: 0.0816, 90: 0.1418, 95: 0.2347, 100: 0.35
    };
    
    const femaleMortality: { [key: number]: number } = {
      55: 0.0020, 60: 0.0031, 65: 0.0052, 70: 0.0091, 75: 0.0160,
      80: 0.0293, 85: 0.0557, 90: 0.1086, 95: 0.1960, 100: 0.32
    };
    
    const table = gender === 'male' ? maleMortality : femaleMortality;
    
    // Find appropriate probability
    if (age < 55) return 0.001; // Very low before 55
    if (age >= 100) return table[100];
    
    // Find bracket
    const brackets = [55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
    let lowerBracket = 55;
    for (const bracket of brackets) {
      if (age >= bracket) lowerBracket = bracket;
    }
    
    return table[lowerBracket];
  };

  // Calculate minimum annual payment for amortized loan
  const calculateMinimumDebtPayment = (principal: number, annualRate: number, years: number): number => {
    if (principal <= 0 || years <= 0) return 0;
    const monthlyRate = annualRate / 100 / 12;
    const numPayments = years * 12;
    
    if (monthlyRate === 0) {
      // No interest - simple division
      return principal / years;
    }
    
    // Standard amortization formula: P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                           (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    return monthlyPayment * 12; // Annual payment
  };

  const runSimulation = (returnSequence: number[], cpiRate: number, healthShock: boolean, maxYears?: number) => {
    let mainSuper = mainSuperBalance;
    let seqBuffer = sequencingBuffer;
    let cashAccount = 0;
    const results = [];
    const startAge = retirementAge;
    const initialPortfolio = mainSuperBalance + sequencingBuffer;
    let currentSpendingBase = baseSpending;
    // Calculate initial NET withdrawal rate (spending minus pension income)
    const initialNetSpendingNeed = Math.max(0, baseSpending - totalPensionIncome);
    const initialWithdrawalRate = initialNetSpendingNeed / initialPortfolio;
    const yearsToRun = maxYears || 35;
    
    // Aged care state tracking
    let inAgedCare = false;
    let yearsInAgedCare = 0;
    let radPaid = 0; // Track if RAD has been paid (refundable on exit)
    const agedCareRandomValue = Math.random(); // Single random value for probabilistic aged care
    
    // Debt repayment tracking - array of debts with balances
    const debtBalances = includeDebt ? debts.map(d => ({
      name: d.name,
      balance: d.amount,
      interestRate: d.interestRate,
      repaymentYears: d.repaymentYears,
      extraPayment: d.extraPayment,
      minimumPayment: calculateMinimumDebtPayment(d.amount, d.interestRate, d.repaymentYears)
    })) : [];
    
    // Partner survival tracking (for aged care death scenario)
    let partnerAlive = pensionRecipientType === 'couple'; // Only relevant if couple
    let spendingAdjustedForSingle = false; // Track if we've already adjusted to single
    let spendingBaseBeforeAgedCare = 0; // Save spending base before aged care for restoration on exit
    const partnerMortalityRandomValue = Math.random(); // Single random value for probabilistic mortality
    let cumulativeMortalityProbability = 0; // Track cumulative probability for death trigger

    for (let year = 1; year <= yearsToRun; year++) {
      const age = startAge + year - 1;
      let guardrailStatus = 'normal';
      
      // Store starting balances for minimum drawdown calculation
      const startingMainSuper = mainSuper;
      
      // AGED CARE STATUS CHECK (must happen before guardrails)
      // Determine if we're entering, in, or exiting aged care
      const agedCareCosts = getAgedCareCosts(age, year, cpiRate, agedCareRandomValue, inAgedCare, yearsInAgedCare);
      const wasInCare = inAgedCare;
      inAgedCare = agedCareCosts.inAgedCare;
      yearsInAgedCare = agedCareCosts.yearsInCare;
      
      // AGED CARE SPENDING ADJUSTMENT (must happen before guardrails)
      // When person enters aged care, adjust base spending to "person at home alone" level
      if (inAgedCare && !spendingAdjustedForSingle && pensionRecipientType === 'couple') {
        // Save the current spending base before aged care adjustment (includes any prior guardrail changes)
        spendingBaseBeforeAgedCare = currentSpendingBase;
        // Adjust to person at home level
        currentSpendingBase = baseSpending * personAtHomeSpending;
        spendingAdjustedForSingle = true; // Mark that we've adjusted
      }
      
      // DEATH IN AGED CARE
      // If person was in care and is now exiting, check if they died or recovered
      if (wasInCare && !inAgedCare && deathInCare && partnerAlive && pensionRecipientType === 'couple') {
        // Partner died in aged care - survivor continues at appropriate spending level
        partnerAlive = false;
        
        // Restore to the spending base from before aged care entered
        // This preserves any legitimate guardrail adjustments from years 1-24
        // while removing the aged care-specific cuts from years 25-29
        if (spendingBaseBeforeAgedCare > 0) {
          // Apply the single spending ratio to the pre-aged-care base
          currentSpendingBase = spendingBaseBeforeAgedCare * personAtHomeSpending;
        } else {
          // Fallback if somehow not saved (shouldn't happen)
          currentSpendingBase = baseSpending * personAtHomeSpending;
        }
        
      } else if (wasInCare && !inAgedCare && !deathInCare && spendingAdjustedForSingle) {
        // Person recovered and exited care - restore couple spending
        if (spendingBaseBeforeAgedCare > 0) {
          currentSpendingBase = spendingBaseBeforeAgedCare; // Restore to pre-aged-care level
        } else {
          currentSpendingBase = baseSpending; // Fallback to original couple level
        }
        spendingAdjustedForSingle = false;
      }
      
      // PARTNER MORTALITY (independent of aged care)
      // Check if partner dies this year (only if couple and partner still alive and not already in aged care death scenario)
      if (includePartnerMortality && pensionRecipientType === 'couple' && partnerAlive && !inAgedCare) {
        const partnerCurrentAge = partnerAge + year - 1;
        const yearlyMortalityRate = getMortalityProbability(partnerCurrentAge, partnerGender);
        
        // Add this year's mortality to cumulative probability
        cumulativeMortalityProbability += yearlyMortalityRate;
        
        // Check if partner dies this year using single random value
        if (partnerMortalityRandomValue < cumulativeMortalityProbability) {
          partnerAlive = false;
          
          // Transition to single spending if not already adjusted
          if (!spendingAdjustedForSingle) {
            currentSpendingBase = currentSpendingBase * personAtHomeSpending;
            spendingAdjustedForSingle = true;
          }
        }
      }
      
     // GUARDRAILS - Compare NET withdrawal rate (spending minus income) in REAL TERMS
      if (useGuardrails && year > 1) {
        const currentPortfolio = mainSuper + seqBuffer + cashAccount;
        // Compare withdrawal rates in REAL terms
        const realPortfolio = currentPortfolio / Math.pow(1 + cpiRate / 100, year - 1);
        
        // Calculate total planned spending for this year (base + splurge + aged care if applicable)
        // All in REAL TERMS (retirement year dollars)
        let totalPlannedSpending = currentSpendingBase;
        if (splurgeAmount > 0) {
          const splurgeEndAge = splurgeStartAge + splurgeDuration - 1;
          if (age >= splurgeStartAge && age <= splurgeEndAge) {
            totalPlannedSpending += splurgeAmount;
          }
        }
        // Include aged care annual costs in guardrail calculation (in real terms)
        if (agedCareCosts.annualCost > 0) {
          const realAgedCareCost = agedCareCosts.annualCost / Math.pow(1 + cpiRate / 100, year - 1);
          totalPlannedSpending += realAgedCareCost;
        }
        
        // Calculate current income to determine NET spending need
        // Use dynamic pension parameters based on partner status
        const currentPensionParams = (pensionRecipientType === 'couple' && !partnerAlive) 
          ? {
              eligibilityAge: 67,
              maxPensionPerYear: 29754,  // Single rate
              assetTestThresholdHomeowner: 314000,
              assetTestCutoffHomeowner: 695500,
              assetTestThresholdNonHomeowner: 566000,
              assetTestCutoffNonHomeowner: 947500,
              assetTaperPerYear: 78,
              incomeTestFreeArea: 5512,
              incomeTaperRate: 0.50
            }
          : agePensionParams;

        // Estimate current Age Pension based on current portfolio (in REAL terms)
        let estimatedAgePension = 0;
        if (includeAgePension && age >= currentPensionParams.eligibilityAge) {
          const totalAssets = mainSuper + seqBuffer + cashAccount;
          const realAssets = totalAssets / Math.pow(1 + cpiRate / 100, year - 1);
          const indexedMaxPension = currentPensionParams.maxPensionPerYear;
          const indexedThreshold = (isHomeowner ? currentPensionParams.assetTestThresholdHomeowner : currentPensionParams.assetTestThresholdNonHomeowner);
          const indexedCutoff = (isHomeowner ? currentPensionParams.assetTestCutoffHomeowner : currentPensionParams.assetTestCutoffNonHomeowner);
          
          let assetTestPension = indexedMaxPension;
          if (realAssets > indexedThreshold) {
            const excess = realAssets - indexedThreshold;
            const reduction = Math.floor(excess / 1000) * currentPensionParams.assetTaperPerYear;
            assetTestPension = Math.max(0, indexedMaxPension - reduction);
          }
          if (realAssets >= indexedCutoff) assetTestPension = 0;
          
          estimatedAgePension = assetTestPension;
        }

        // Adjust pension income for partner death
        const adjustedPensionIncome = (pensionRecipientType === 'couple' && !partnerAlive)
          ? totalPensionIncome * pensionReversionary
          : totalPensionIncome;

        // CRITICAL: Convert pension income to REAL TERMS to match spending
        // adjustedPensionIncome is already inflation-adjusted (nominal), so deflate it
        const realPensionIncome = adjustedPensionIncome / Math.pow(1 + cpiRate / 100, year - 1);
        const realAgePension = estimatedAgePension;  // Already in real terms from calculation above
        
        // Calculate NET spending need (what actually comes from portfolio) - ALL IN REAL TERMS
        const totalEstimatedIncome = realPensionIncome + realAgePension;
        const netSpendingNeed = Math.max(0, totalPlannedSpending - totalEstimatedIncome);
        
        // Compare NET withdrawal rates
        const currentWithdrawalRate = realPortfolio > 0 ? netSpendingNeed / realPortfolio : 0;
        const safeWithdrawalRate = initialWithdrawalRate;
        const withdrawalRateRatio = safeWithdrawalRate > 0 ? (currentWithdrawalRate / safeWithdrawalRate) * 100 : 100;
  
        if (withdrawalRateRatio <= 100 - upperGuardrail) {
          guardrailStatus = 'increase';
          currentSpendingBase = currentSpendingBase * (1 + guardrailAdjustment / 100);
        } else if (withdrawalRateRatio >= 100 + lowerGuardrail) {
          guardrailStatus = 'decrease';
          const proposedSpending = currentSpendingBase * (1 - guardrailAdjustment / 100);
          const spendingMultiplier = getSpendingMultiplier(year);
          
          // Floor includes PSS/CSS pension AND Age Pension (but ONLY if Age Pension is enabled)
          const maxAgePension = includeAgePension 
            ? ((pensionRecipientType === 'couple' && !partnerAlive) 
                ? 29754  // Single rate if partner died
                : agePensionParams.maxPensionPerYear)  // Couple or single rate
            : 0;  // Don't include Age Pension in floor if it's disabled
            
          const adjustedPSS = (pensionRecipientType === 'couple' && !partnerAlive)
            ? totalPensionIncome * pensionReversionary  // Apply reversionary if partner died
            : totalPensionIncome;
            
          const indexedPensionFloor = (adjustedPSS + maxAgePension) / spendingMultiplier;
          currentSpendingBase = Math.max(proposedSpending, indexedPensionFloor);
        }
      }
      
      // DEBUG LOGGING - REMOVE AFTER FIXING
      if (year <= 5) {
        console.log(`=== YEAR ${year} (Age ${age}) ===`);
        console.log(`Guardrail Status: ${guardrailStatus}`);
        console.log(`currentSpendingBase: ${currentSpendingBase.toFixed(2)}`);
        if (useGuardrails && year > 1) {
          const currentPortfolio = mainSuper + seqBuffer + cashAccount;
          const realPortfolio = currentPortfolio / Math.pow(1 + cpiRate / 100, year - 1);
          
          // Recalculate for logging (variables are out of scope)
          let totalPlannedSpending = currentSpendingBase;
          if (splurgeAmount > 0) {
            const splurgeEndAge = splurgeStartAge + splurgeDuration - 1;
            if (age >= splurgeStartAge && age <= splurgeEndAge) {
              totalPlannedSpending += splurgeAmount;
            }
          }
          if (agedCareCosts.annualCost > 0) {
            const realAgedCareCost = agedCareCosts.annualCost / Math.pow(1 + cpiRate / 100, year - 1);
            totalPlannedSpending += realAgedCareCost;
          }
          
          const adjustedPensionIncome = (pensionRecipientType === 'couple' && !partnerAlive)
            ? totalPensionIncome * pensionReversionary
            : totalPensionIncome;
          const realPensionIncome = adjustedPensionIncome / Math.pow(1 + cpiRate / 100, year - 1);
          
          const netSpendingNeed = Math.max(0, totalPlannedSpending - realPensionIncome);
          const currentWithdrawalRate = realPortfolio > 0 ? netSpendingNeed / realPortfolio : 0;
          const withdrawalRateRatio = initialWithdrawalRate > 0 ? (currentWithdrawalRate / initialWithdrawalRate) * 100 : 100;
          
          console.log(`Real Portfolio: ${realPortfolio.toFixed(2)}`);
          console.log(`Real Pension Income: ${realPensionIncome.toFixed(2)}`);
          console.log(`Net Spending Need: ${netSpendingNeed.toFixed(2)}`);
          console.log(`Current WD Rate: ${(currentWithdrawalRate * 100).toFixed(4)}%`);
          console.log(`Initial WD Rate: ${(initialWithdrawalRate * 100).toFixed(4)}%`);
          console.log(`Ratio: ${withdrawalRateRatio.toFixed(2)}%`);
        }
        console.log('');
      }
      
      const spendingMultiplier = getSpendingMultiplier(year);
      
      // Calculate base spending in real terms including splurge
      let realBaseSpending = currentSpendingBase;
      
      // Add splurge to base if within the splurge period (in real terms)
      if (splurgeAmount > 0) {
        const splurgeEndAge = splurgeStartAge + splurgeDuration - 1;
        if (age >= splurgeStartAge && age <= splurgeEndAge) {
          realBaseSpending += splurgeAmount;
        }
      }
      
      // Now inflate this combined base to nominal terms
      const inflationAdjustedSpending = realBaseSpending * Math.pow(1 + cpiRate / 100, year - 1);
      
      // Additional costs not subject to guardrails
      let additionalCosts = 0;
      if (healthShock && year >= 15) {
        additionalCosts = 30000;
      }
      
      // Annual aged care fees (not refundable, not subject to guardrails)
      additionalCosts += agedCareCosts.annualCost;
      
      // Debt repayment (not subject to guardrails - unavoidable commitment)
      let totalDebtPayment = 0;
      let totalDebtInterest = 0;
      let totalDebtPrincipal = 0;
      let totalDebtBalance = 0;
      
      if (includeDebt && debtBalances.length > 0) {
        debtBalances.forEach(debt => {
          if (debt.balance > 0) {
            // Calculate interest for the year
            const interestPaid = debt.balance * (debt.interestRate / 100);
            
            // Total payment = minimum + extra
            const payment = debt.minimumPayment + debt.extraPayment;
            
            // Cap payment at outstanding balance + interest (can't overpay)
            const actualPayment = Math.min(payment, debt.balance + interestPaid);
            
            // Calculate principal paid
            const principalPaid = actualPayment - interestPaid;
            
            // Update debt balance
            debt.balance = Math.max(0, debt.balance + interestPaid - actualPayment);
            
            // Accumulate totals
            totalDebtPayment += actualPayment;
            totalDebtInterest += interestPaid;
            totalDebtPrincipal += principalPaid;
            totalDebtBalance += debt.balance;
          }
        });
        
        // Add total debt payments to additional costs
        additionalCosts += totalDebtPayment;
      }
      
      // RAD (Refundable Accommodation Deposit) - comes from main super as lump sum
      let radWithdrawn = 0;
      if (agedCareCosts.radRequired > 0) {
        radWithdrawn = agedCareCosts.radRequired;
        // Note: radPaid will be set AFTER withdrawal to reflect actual amount paid
      }
      
      // When exiting aged care, RAD is refunded
      let radRefund = 0;
      if (radPaid > 0 && !inAgedCare) {
        radRefund = radPaid;
        radPaid = 0; // Reset after refund
      }
      
      // Add one-off expenses for this age (not subject to guardrails)
      let oneOffAddition = 0;
      oneOffExpenses.forEach(expense => {
        if (expense.age === age) {
          oneOffAddition += expense.amount;
        }
      });
      
      const totalSpending = inflationAdjustedSpending * spendingMultiplier + additionalCosts + oneOffAddition;

      // Use dynamic Age Pension parameters based on current partner status
      const currentPensionParams = (pensionRecipientType === 'couple' && !partnerAlive) 
        ? {
            eligibilityAge: 67,
            maxPensionPerYear: 29754,  // Single rate (partner died)
            assetTestThresholdHomeowner: 314000,
            assetTestCutoffHomeowner: 695500,
            assetTestThresholdNonHomeowner: 566000,
            assetTestCutoffNonHomeowner: 947500,
            assetTaperPerYear: 78,
            incomeTestFreeArea: 5512,
            incomeTaperRate: 0.50
          }
        : agePensionParams;

      const totalAssets = mainSuper + seqBuffer;
      
      // Adjust pension income if partner has died (reversionary benefit)
      let adjustedPensionIncome = totalPensionIncome;
      if (pensionRecipientType === 'couple' && !partnerAlive) {
        // Apply reversionary percentage (typically 67% for PSS/CSS)
        adjustedPensionIncome = totalPensionIncome * pensionReversionary;
      }
      
      const indexedMaxPension = currentPensionParams.maxPensionPerYear * Math.pow(1 + cpiRate / 100, year - 1);
      const indexedThreshold = (isHomeowner ? currentPensionParams.assetTestThresholdHomeowner : currentPensionParams.assetTestThresholdNonHomeowner) * Math.pow(1 + cpiRate / 100, year - 1);
      const indexedCutoff = (isHomeowner ? currentPensionParams.assetTestCutoffHomeowner : currentPensionParams.assetTestCutoffNonHomeowner) * Math.pow(1 + cpiRate / 100, year - 1);
      const indexedTaper = currentPensionParams.assetTaperPerYear * Math.pow(1 + cpiRate / 100, year - 1);
      const indexedPensionIncome = adjustedPensionIncome * Math.pow(1 + cpiRate / 100, year - 1);
      
      let agePension = 0;
      if (includeAgePension && age >= currentPensionParams.eligibilityAge) {
        let assetTestPension = indexedMaxPension;
        if (totalAssets > indexedThreshold) {
          const excess = totalAssets - indexedThreshold;
          const reduction = Math.floor(excess / 1000) * (indexedTaper / Math.pow(1 + cpiRate / 100, year - 1)) * Math.pow(1 + cpiRate / 100, year - 1);
          assetTestPension = Math.max(0, indexedMaxPension - reduction);
        }
        if (totalAssets >= indexedCutoff) assetTestPension = 0;

        const indexedIncomeTestFreeArea = currentPensionParams.incomeTestFreeArea * Math.pow(1 + cpiRate / 100, year - 1);
        let incomeTestPension = indexedMaxPension;
        if (indexedPensionIncome > indexedIncomeTestFreeArea) {
          const excessIncome = indexedPensionIncome - indexedIncomeTestFreeArea;
          const reduction = excessIncome * currentPensionParams.incomeTaperRate;
          incomeTestPension = Math.max(0, indexedMaxPension - reduction);
        }
        agePension = Math.min(assetTestPension, incomeTestPension);
      }
      
      const totalIncome = indexedPensionIncome + agePension;
      const netSpendingNeed = Math.max(0, totalSpending - totalIncome);

      // STEP 1: MINIMUM DRAWDOWN (Required by law - must happen first)
      // Withdraw minimum % from Main Super based on age and deposit to Cash
      const minDrawdown = getMinimumDrawdown(age, startingMainSuper);
      let superDrawnForMinimum = 0;
      if (minDrawdown > 0 && mainSuper >= minDrawdown) {
        mainSuper -= minDrawdown;
        cashAccount += minDrawdown;
        superDrawnForMinimum = minDrawdown;
      }

      // STEP 2: SPENDING WITHDRAWAL LOGIC
      // Now use Cash → Buffer → Super waterfall to cover spending needs
      let withdrawn = 0;
      if (netSpendingNeed > 0) {
        // Withdraw from Cash Account first
        if (cashAccount >= netSpendingNeed) {
          cashAccount -= netSpendingNeed;
          withdrawn = netSpendingNeed;
        } else {
          withdrawn = cashAccount;
          cashAccount = 0;
          let remaining = netSpendingNeed - withdrawn;
          
          // Withdraw from Sequencing Buffer
          if (seqBuffer >= remaining) {
            seqBuffer -= remaining;
            withdrawn += remaining;
          } else {
            withdrawn += seqBuffer;
            remaining = remaining - seqBuffer;
            seqBuffer = 0;
            
            // Withdraw from Main Super (additional to minimum drawdown)
            if (mainSuper >= remaining) {
              mainSuper -= remaining;
              withdrawn += remaining;
            } else {
              withdrawn += mainSuper;
              mainSuper = 0;
            }
          }
        }
      }

      // Total withdrawn from super = minimum drawdown + any additional for spending
      const totalSuperWithdrawn = superDrawnForMinimum + Math.max(0, netSpendingNeed - (withdrawn - Math.max(0, netSpendingNeed - cashAccount - seqBuffer)));

      // STEP 3: RAD PAYMENT (if entering aged care)
      // RAD cascades through accounts: Main Super → Buffer → Cash (like normal spending)
      if (radWithdrawn > 0) {
        let radRemaining = radWithdrawn;
        
        // Try Main Super first
        if (mainSuper >= radRemaining) {
          mainSuper -= radRemaining;
          radRemaining = 0;
        } else {
          radRemaining -= mainSuper;
          mainSuper = 0;
          
          // Then Sequencing Buffer
          if (seqBuffer >= radRemaining) {
            seqBuffer -= radRemaining;
            radRemaining = 0;
          } else {
            radRemaining -= seqBuffer;
            seqBuffer = 0;
            
            // Finally Cash Account
            if (cashAccount >= radRemaining) {
              cashAccount -= radRemaining;
              radRemaining = 0;
            } else {
              radRemaining -= cashAccount;
              cashAccount = 0;
            }
          }
        }
        
        // If still short, record actual amount paid (partial RAD)
        // This would trigger DAP in reality, but we keep it simple
        if (radRemaining > 0) {
          radWithdrawn -= radRemaining; // Only paid what was available
        }
        
        // Track the actual amount paid for future refund
        radPaid = radWithdrawn;
      }
      
      // STEP 4: RAD REFUND (if exiting aged care)
      // RAD is refunded to cash (estate/beneficiary receives as cash, not super)
      if (radRefund > 0) {
        cashAccount += radRefund;
      }

      // APPLY RETURNS:
      // Main Super: Variable returns based on scenario/historical/Monte Carlo
      // Buffer & Cash: Fixed 3% real return (defensive assets)
      const yearReturn = returnSequence[year - 1] || 0;
      mainSuper = mainSuper * (1 + yearReturn / 100);
      seqBuffer = seqBuffer * 1.03;  // 3% real
      cashAccount = cashAccount * 1.03;  // 3% real
      const totalBalance = mainSuper + seqBuffer + cashAccount;

      results.push({
        year, age, mainSuper, seqBuffer, cashAccount, totalBalance,
        spending: totalSpending, income: totalIncome, agePension, pensionIncome: indexedPensionIncome,
        withdrawn, minDrawdown, superDrawnForMinimum,
        yearReturn, cpiRate, guardrailStatus, currentSpendingBase,
        inAgedCare, agedCareAnnualCost: agedCareCosts.annualCost, radWithdrawn, radRefund,
        partnerAlive,
        debtBalance: totalDebtBalance, debtPayment: totalDebtPayment, debtInterestPaid: totalDebtInterest, debtPrincipalPaid: totalDebtPrincipal
      });

      if (totalBalance <= 0) break;
    }
    return results;
  };

  const runMonteCarlo = () => {
    const allResults = [];
    const failureAnalysis = [];
    
    for (let i = 0; i < monteCarloRuns; i++) {
      const returns = [];
      for (let year = 0; year < 35; year++) {
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const randomReturn = expectedReturn + z0 * returnVolatility;
        returns.push(randomReturn);
      }
      const result = runSimulation(returns, inflationRate, false, 35);
      allResults.push(result);
      
      // Analyze if this scenario failed
      const failed = result.length < 35 || result[result.length - 1].totalBalance <= 0;
      if (failed) {
        const failureYear = result.length;
        const failureAge = result[result.length - 1]?.age || 0;
        
        // Analyze the failure
        let earlyReturns = returns.slice(0, Math.min(10, returns.length));
        let avgEarlyReturn = earlyReturns.reduce((a, b) => a + b, 0) / earlyReturns.length;
        
        // Find worst consecutive years
        let worstStreak = 0;
        let worstStreakStart = 0;
        let currentStreak = 0;
        let currentStreakStart = 0;
        
        for (let j = 0; j < returns.length; j++) {
          if (returns[j] < 0) {
            if (currentStreak === 0) currentStreakStart = j + 1;
            currentStreak++;
            if (currentStreak > worstStreak) {
              worstStreak = currentStreak;
              worstStreakStart = currentStreakStart;
            }
          } else {
            currentStreak = 0;
          }
        }
        
        // Determine primary failure cause
        let primaryCause = '';
        if (worstStreak >= 3 && worstStreakStart <= 5) {
          primaryCause = 'Early sequence risk';
        } else if (avgEarlyReturn < 0) {
          primaryCause = 'Poor early returns';
        } else if (worstStreak >= 4) {
          primaryCause = 'Extended bear market';
        } else {
          primaryCause = 'Gradual depletion';
        }
        
        failureAnalysis.push({
          scenarioNumber: i + 1,
          failureYear: failureYear,
          failureAge: failureAge,
          avgEarlyReturn: avgEarlyReturn,
          worstStreak: worstStreak,
          worstStreakStart: worstStreakStart,
          primaryCause: primaryCause,
          returns: returns
        });
      }
    }

    const successful = allResults.filter(r => r.length === 35 && r[34].totalBalance > 0).length;
    const successRate = (successful / monteCarloRuns) * 100;
    const finalBalances = allResults.map(r => {
      const lastYear = r[r.length - 1];
      return lastYear ? lastYear.totalBalance : 0;
    }).sort((a, b) => a - b);

    const getPercentile = (arr: number[], p: number) => {
      const index = Math.floor(arr.length * p / 100);
      return arr[index] || 0;
    };

    const percentiles = {
      p10: getPercentile(finalBalances, 10),
      p50: getPercentile(finalBalances, 50),
      p90: getPercentile(finalBalances, 90)
    };

    const medianBalance = percentiles.p50;
    let closestIndex = 0;
    let closestDiff = Math.abs(finalBalances[0] - medianBalance);
    for (let i = 1; i < allResults.length; i++) {
      const lastYear = allResults[i][allResults[i].length - 1];
      const balance = lastYear ? lastYear.totalBalance : 0;
      const diff = Math.abs(balance - medianBalance);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = i;
      }
    }
    
    // Aggregate failure statistics
    let failureStats = null;
    if (failureAnalysis.length > 0) {
      const avgFailureYear = failureAnalysis.reduce((sum, f) => sum + f.failureYear, 0) / failureAnalysis.length;
      const avgFailureAge = failureAnalysis.reduce((sum, f) => sum + f.failureAge, 0) / failureAnalysis.length;
      
      const causeCount: { [key: string]: number } = {};
      failureAnalysis.forEach(f => {
        causeCount[f.primaryCause] = (causeCount[f.primaryCause] || 0) + 1;
      });
      
      const topCauses = Object.entries(causeCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cause, count]) => ({ cause, count, percentage: (count / failureAnalysis.length * 100) }));
      
      failureStats = {
        totalFailures: failureAnalysis.length,
        avgFailureYear: Math.round(avgFailureYear),
        avgFailureAge: Math.round(avgFailureAge),
        topCauses: topCauses,
        allFailures: failureAnalysis.slice(0, 10) // Keep first 10 for detailed view
      };
    }
    
    return {
      medianSimulation: allResults[closestIndex],
      successRate: successRate,
      percentiles: percentiles,
      failureStats: failureStats
    };
  };

  const runHistoricalMonteCarlo = () => {
    const allResults = [];
    const failureAnalysis = [];
    
    // For Complete Blocks method, determine the actual number of unique scenarios
    let actualRuns = monteCarloRuns;
    let uniqueBlocksMap = new Map(); // Track unique starting years for Complete Blocks
    
    if (historicalMethod === 'block') {
      // Complete 35-year blocks: maximum possible is (dataLength - 35 + 1)
      const maxUniqueBlocks = historicalMarketData.length - 35 + 1;
      actualRuns = Math.min(monteCarloRuns, maxUniqueBlocks);
      
      // Pre-generate all unique starting indices
      const allStartIndices = Array.from({ length: maxUniqueBlocks }, (_, i) => i);
      
      // If user wants fewer than max, randomly select which ones to use
      if (actualRuns < maxUniqueBlocks) {
        // Shuffle and take first actualRuns
        for (let i = allStartIndices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allStartIndices[i], allStartIndices[j]] = [allStartIndices[j], allStartIndices[i]];
        }
        allStartIndices.length = actualRuns;
      }
      
      // Run each unique block exactly once
      for (let i = 0; i < actualRuns; i++) {
        const startIdx = allStartIndices[i];
        const startYear = historicalMarketData[startIdx].year;
        const endYear = historicalMarketData[startIdx + 34].year;
        
        let returns: number[] = [];
        for (let year = 0; year < 35; year++) {
          returns.push(historicalMarketData[startIdx + year].return);
        }
        
        const result = runSimulation(returns, inflationRate, false, 35);
        allResults.push(result);
        
        // Track this unique block
        uniqueBlocksMap.set(i, { startYear, endYear, startIdx });
        
        // Analyze if this scenario failed
        const failed = result.length < 35 || result[result.length - 1].totalBalance <= 0;
        if (failed) {
          const failureYear = result.length;
          const failureAge = result[result.length - 1]?.age || 0;
          
          let earlyReturns = returns.slice(0, Math.min(10, returns.length));
          let avgEarlyReturn = earlyReturns.reduce((a, b) => a + b, 0) / earlyReturns.length;
          
          let worstStreak = 0;
          let worstStreakStart = 0;
          let currentStreak = 0;
          let currentStreakStart = 0;
          
          for (let j = 0; j < returns.length; j++) {
            if (returns[j] < 0) {
              if (currentStreak === 0) currentStreakStart = j + 1;
              currentStreak++;
              if (currentStreak > worstStreak) {
                worstStreak = currentStreak;
                worstStreakStart = currentStreakStart;
              }
            } else {
              currentStreak = 0;
            }
          }
          
          let primaryCause = '';
          if (worstStreak >= 3 && worstStreakStart <= 5) {
            primaryCause = 'Early sequence risk';
          } else if (avgEarlyReturn < 0) {
            primaryCause = 'Poor early returns';
          } else if (worstStreak >= 4) {
            primaryCause = 'Extended bear market';
          } else {
            primaryCause = 'Gradual depletion';
          }
          
          failureAnalysis.push({
            scenarioNumber: i + 1,
            failureYear: failureYear,
            failureAge: failureAge,
            avgEarlyReturn: avgEarlyReturn,
            worstStreak: worstStreak,
            worstStreakStart: worstStreakStart,
            primaryCause: primaryCause,
            returns: returns,
            historicalPeriod: `${startYear}-${endYear}` // Track which historical period failed
          });
        }
      }
    } else {
      // Shuffle or Overlapping methods - use normal loop
      for (let i = 0; i < monteCarloRuns; i++) {
        let returns: number[] = [];
        
        if (historicalMethod === 'shuffle') {
          // Method 1: Shuffled years - random sampling with replacement
          for (let year = 0; year < 35; year++) {
            const randomIdx = Math.floor(Math.random() * historicalMarketData.length);
            returns.push(historicalMarketData[randomIdx].return);
          }
        } else {
          // Method 3: Overlapping block bootstrap (default)
          while (returns.length < 35) {
            const maxStartIdx = historicalMarketData.length - blockSize;
            const startIdx = Math.floor(Math.random() * (maxStartIdx + 1));
            for (let j = 0; j < blockSize && returns.length < 35; j++) {
              returns.push(historicalMarketData[startIdx + j].return);
            }
          }
        }
        
        const result = runSimulation(returns, inflationRate, false, 35);
        allResults.push(result);
      
      // Analyze if this scenario failed
      const failed = result.length < 35 || result[result.length - 1].totalBalance <= 0;
      if (failed) {
        const failureYear = result.length;
        const failureAge = result[result.length - 1]?.age || 0;
        
        // Analyze the failure
        let earlyReturns = returns.slice(0, Math.min(10, returns.length));
        let avgEarlyReturn = earlyReturns.reduce((a, b) => a + b, 0) / earlyReturns.length;
        
        // Find worst consecutive years
        let worstStreak = 0;
        let worstStreakStart = 0;
        let currentStreak = 0;
        let currentStreakStart = 0;
        
        for (let j = 0; j < returns.length; j++) {
          if (returns[j] < 0) {
            if (currentStreak === 0) currentStreakStart = j + 1;
            currentStreak++;
            if (currentStreak > worstStreak) {
              worstStreak = currentStreak;
              worstStreakStart = currentStreakStart;
            }
          } else {
            currentStreak = 0;
          }
        }
        
        // Determine primary failure cause
        let primaryCause = '';
        if (worstStreak >= 3 && worstStreakStart <= 5) {
          primaryCause = 'Early sequence risk';
        } else if (avgEarlyReturn < 0) {
          primaryCause = 'Poor early returns';
        } else if (worstStreak >= 4) {
          primaryCause = 'Extended bear market';
        } else {
          primaryCause = 'Gradual depletion';
        }
        
        failureAnalysis.push({
          scenarioNumber: i + 1,
          failureYear: failureYear,
          failureAge: failureAge,
          avgEarlyReturn: avgEarlyReturn,
          worstStreak: worstStreak,
          worstStreakStart: worstStreakStart,
          primaryCause: primaryCause,
          returns: returns
        });
      }
      }
    }

    const successful = allResults.filter(r => r.length === 35 && r[34].totalBalance > 0).length;
    const successRate = (successful / actualRuns) * 100;
    const finalBalances = allResults.map(r => {
      const lastYear = r[r.length - 1];
      return lastYear ? lastYear.totalBalance : 0;
    }).sort((a, b) => a - b);

    const getPercentile = (arr: number[], p: number) => {
      const index = Math.floor(arr.length * p / 100);
      return arr[index] || 0;
    };

    const percentiles = {
      p10: getPercentile(finalBalances, 10),
      p50: getPercentile(finalBalances, 50),
      p90: getPercentile(finalBalances, 90)
    };

    const medianBalance = percentiles.p50;
    let closestIndex = 0;
    let closestDiff = Math.abs(finalBalances[0] - medianBalance);
    for (let i = 1; i < allResults.length; i++) {
      const lastYear = allResults[i][allResults[i].length - 1];
      const balance = lastYear ? lastYear.totalBalance : 0;
      const diff = Math.abs(balance - medianBalance);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = i;
      }
    }
    
    // Aggregate failure statistics
    let failureStats = null;
    if (failureAnalysis.length > 0) {
      const avgFailureYear = failureAnalysis.reduce((sum, f) => sum + f.failureYear, 0) / failureAnalysis.length;
      const avgFailureAge = failureAnalysis.reduce((sum, f) => sum + f.failureAge, 0) / failureAnalysis.length;
      
      const causeCount: { [key: string]: number } = {};
      failureAnalysis.forEach(f => {
        causeCount[f.primaryCause] = (causeCount[f.primaryCause] || 0) + 1;
      });
      
      const topCauses = Object.entries(causeCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cause, count]) => ({ cause, count, percentage: (count / failureAnalysis.length * 100) }));
      
      failureStats = {
        totalFailures: failureAnalysis.length,
        avgFailureYear: Math.round(avgFailureYear),
        avgFailureAge: Math.round(avgFailureAge),
        topCauses: topCauses,
        allFailures: failureAnalysis.slice(0, 10) // Keep first 10 for detailed view
      };
    }
    
    return {
      medianSimulation: allResults[closestIndex],
      successRate: successRate,
      percentiles: percentiles,
      method: historicalMethod,
      dataYears: historicalMarketData.length,
      failureStats: failureStats,
      actualRuns: actualRuns,
      uniqueBlocksMap: historicalMethod === 'block' ? uniqueBlocksMap : null
    };
  };

  const simulationResults = useMemo(() => {
    // Priority: Historical Monte Carlo > Regular Monte Carlo > Formal Test > Historical > Constant
    if (useHistoricalMonteCarlo && historicalMonteCarloResults && historicalMonteCarloResults.medianSimulation) {
      return historicalMonteCarloResults.medianSimulation;
    }
    
    if (useMonteCarlo && monteCarloResults && monteCarloResults.medianSimulation) {
      return monteCarloResults.medianSimulation;
    }
    
    // Use selected formal test data when available
    if (useFormalTest && selectedFormalTest && formalTestResults) {
      const testResult = formalTestResults[selectedFormalTest as keyof typeof formalTestResults] as any;
      if (testResult && testResult.simulationData) {
        return testResult.simulationData;
      }
    }
    
    let returns;
    if (useHistoricalData) {
      returns = historicalReturns[historicalPeriod as keyof typeof historicalReturns];
    } else {
      returns = Array(35).fill(selectedScenario);
    }
    return runSimulation(returns, inflationRate, false, 35);
  }, [mainSuperBalance, sequencingBuffer, totalPensionIncome, baseSpending,
      selectedScenario, isHomeowner, includeAgePension, spendingPattern, useGuardrails, upperGuardrail, lowerGuardrail, guardrailAdjustment,
      useHistoricalData, historicalPeriod, useMonteCarlo, monteCarloResults, useHistoricalMonteCarlo, historicalMonteCarloResults,
      splurgeAmount, splurgeStartAge, splurgeDuration, oneOffExpenses,
      currentAge, retirementAge, agePensionParams, pensionRecipientType, selectedFormalTest, formalTestResults,
      includeAgedCare, agedCareApproach, agedCareRAD, agedCareAnnualCost, deterministicAgedCareAge, agedCareDuration,
      personAtHomeSpending, deathInCare, 
      includePartnerMortality, partnerAge, partnerGender, pensionReversionary,
      includeDebt, debts]);

  const chartData = useMemo(() => {
    if (!simulationResults) return [];
    return simulationResults.map((r: any) => ({
      year: r.year, 
      age: r.age,
      'Total Balance': toDisplayValue(r.totalBalance, r.year, r.cpiRate),
      'Main Super': toDisplayValue(r.mainSuper, r.year, r.cpiRate),
      'Buffer': toDisplayValue(r.seqBuffer, r.year, r.cpiRate),
      'Cash': toDisplayValue(r.cashAccount, r.year, r.cpiRate),
      'Spending': toDisplayValue(r.spending, r.year, r.cpiRate),
      'Income': toDisplayValue(r.income, r.year, r.cpiRate)
    }));
  }, [simulationResults, showNominalDollars]);

  const pensionChartData = useMemo(() => {
    if (!simulationResults) return [];
    return simulationResults.map((r: any) => ({
      age: r.age,
      'Age Pension': toDisplayValue(r.agePension, r.year, r.cpiRate),
      'PSS/CSS Pension': toDisplayValue(r.pensionIncome, r.year, r.cpiRate),
      'Total Income': toDisplayValue(r.income, r.year, r.cpiRate)
    }));
  }, [simulationResults, showNominalDollars]);

  const exportDetailedCSV = () => {
    if (!simulationResults || simulationResults.length === 0) {
      alert('No simulation results to export. Please run a simulation first.');
      return;
    }

    // CSV Header
    let csv = 'Year,Age,Calendar Year,';
    csv += 'Main Super Start,Buffer Start,Cash Start,Total Start,';
    csv += 'Base Spending,Spending Multiplier,Inflation Adjusted Spending,Splurge Addition,One-Off Expenses,Health Costs,Total Spending,';
    csv += 'Pension Income,Age Pension,Total Income,';
    csv += 'Net Spending Need,Cash Used For Spending,Buffer Used For Spending,Super Used For Spending,Total Spent From Accounts,';
    csv += 'Minimum Drawdown Required,Super Drawn For Min Drawdown,Min Drawdown Excess Remaining in Cash,';
    csv += 'Return %,Main Super End,Buffer End,Cash End,Total End,';
    csv += 'Guardrail Status,Current Spending Base,';
    csv += 'In Aged Care,Aged Care Annual Cost,RAD Withdrawn,RAD Refund,Partner Alive,';
    csv += 'Debt Balance,Debt Payment,Debt Interest,Debt Principal\n';

    // Calculate detailed breakdown for each year
    simulationResults.forEach((r: any, index: number) => {
      const calendarYear = getRetirementYear(retirementAge) + r.year - 1;
      
      // Get previous year balances (or initial for year 1)
      const prevMainSuper = index === 0 ? mainSuperBalance : simulationResults[index - 1].mainSuper;
      const prevBuffer = index === 0 ? sequencingBuffer : simulationResults[index - 1].seqBuffer;
      const prevCash = index === 0 ? 0 : simulationResults[index - 1].cashAccount;
      const prevTotal = prevMainSuper + prevBuffer + prevCash;

      // Calculate spending components
      const spendingMultiplier = r.year <= 10 ? Math.pow(0.982, r.year - 1) : 
                                  r.year <= 20 ? Math.pow(0.982, 9) * Math.pow(0.986, r.year - 10) :
                                  Math.pow(0.982, 9) * Math.pow(0.986, 10) * Math.pow(0.999, r.year - 20);
      const inflationAdjustedSpending = baseSpending * Math.pow(1 + r.cpiRate / 100, r.year - 1);
      const splurgeAddition = (splurgeAmount > 0 && r.age >= splurgeStartAge && r.age <= splurgeStartAge + splurgeDuration - 1) 
                              ? splurgeAmount * Math.pow(1 + r.cpiRate / 100, r.year - 1) : 0;
      const oneOffTotal = oneOffExpenses.filter(e => e.age === r.age).reduce((sum, e) => sum + e.amount, 0);
      const healthCosts = 0; // Would be 30000 if health shock enabled and year >= 15

      // Use stored values from simulation results
      const minDrawdownAmount = r.minDrawdown || 0;
      const superForMinimum = r.superDrawnForMinimum || 0;
      const netSpendingNeed = Math.max(0, r.spending - r.income);
      
      // Calculate withdrawal breakdown
      // After minimum drawdown goes to cash, spending waterfall is: Cash -> Buffer -> Super
      let cashUsed = 0, bufferUsed = 0, superUsedForSpending = 0;
      
      if (netSpendingNeed > 0) {
        // Cash available includes the minimum drawdown that just went in
        const cashAvailable = prevCash + superForMinimum;
        
        if (cashAvailable >= netSpendingNeed) {
          cashUsed = netSpendingNeed;
        } else {
          cashUsed = cashAvailable;
          const remaining1 = netSpendingNeed - cashUsed;
          
          if (prevBuffer >= remaining1) {
            bufferUsed = remaining1;
          } else {
            bufferUsed = prevBuffer;
            superUsedForSpending = remaining1 - bufferUsed;
          }
        }
      }
      
      const totalSuperWithdrawn = superForMinimum + superUsedForSpending;
      const excessToCash = superForMinimum - Math.min(superForMinimum, cashUsed);

      // Format row
      csv += `${r.year},${r.age},${calendarYear},`;
      csv += `${prevMainSuper.toFixed(2)},${prevBuffer.toFixed(2)},${prevCash.toFixed(2)},${prevTotal.toFixed(2)},`;
      csv += `${baseSpending.toFixed(2)},${spendingMultiplier.toFixed(4)},${inflationAdjustedSpending.toFixed(2)},${splurgeAddition.toFixed(2)},${oneOffTotal.toFixed(2)},${healthCosts.toFixed(2)},${r.spending.toFixed(2)},`;
      csv += `${(r.income - r.agePension).toFixed(2)},${r.agePension.toFixed(2)},${r.income.toFixed(2)},`;
      csv += `${netSpendingNeed.toFixed(2)},${cashUsed.toFixed(2)},${bufferUsed.toFixed(2)},${superUsedForSpending.toFixed(2)},${(cashUsed + bufferUsed + superUsedForSpending).toFixed(2)},`;
      csv += `${minDrawdownAmount.toFixed(2)},${superForMinimum.toFixed(2)},${excessToCash.toFixed(2)},`;
      csv += `${r.yearReturn.toFixed(2)},${r.mainSuper.toFixed(2)},${r.seqBuffer.toFixed(2)},${r.cashAccount.toFixed(2)},${r.totalBalance.toFixed(2)},`;
      csv += `${r.guardrailStatus || 'normal'},${r.currentSpendingBase.toFixed(2)},`;
      csv += `${r.inAgedCare ? 'TRUE' : 'FALSE'},${(r.agedCareAnnualCost || 0).toFixed(2)},${(r.radWithdrawn || 0).toFixed(2)},${(r.radRefund || 0).toFixed(2)},${r.partnerAlive ? 'TRUE' : 'FALSE'},`;
      csv += `${(r.debtBalance || 0).toFixed(2)},${(r.debtPayment || 0).toFixed(2)},${(r.debtInterestPaid || 0).toFixed(2)},${(r.debtPrincipalPaid || 0).toFixed(2)}\n`;
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retirement_simulation_detailed_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Australian Retirement Planning Tool</h1>
            <p className="text-gray-600">Version 14.4 - With Debug Logging</p>
          </div>
        </div>
        <div className="text-center text-sm text-gray-600 mt-6">
          Australian Retirement Planning Tool v14.4 with Debug Logging
        </div>
      </div>
    </div>
  );
};

export default RetirementCalculator;
