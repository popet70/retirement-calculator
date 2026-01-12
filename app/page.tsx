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

  const runSimulation = (returnSequence: number[], cpiRate: number, healthShock: boolean, maxYears?: number) => {
    let mainSuper = mainSuperBalance;
    let seqBuffer = sequencingBuffer;
    let cashAccount = 0;
    const results = [];
    const startAge = retirementAge;
    const initialPortfolio = mainSuperBalance + sequencingBuffer;
    let currentSpendingBase = baseSpending;
    const initialWithdrawalRate = baseSpending / initialPortfolio;
    const yearsToRun = maxYears || 35;

    for (let year = 1; year <= yearsToRun; year++) {
      const age = startAge + year - 1;
      let guardrailStatus = 'normal';
      
      // Store starting balances for minimum drawdown calculation
      const startingMainSuper = mainSuper;
      
      if (useGuardrails && year > 1) {
        const currentPortfolio = mainSuper + seqBuffer + cashAccount;
        // Compare withdrawal rates in REAL terms
        const realPortfolio = currentPortfolio / Math.pow(1 + cpiRate / 100, year - 1);
        
        // Calculate total planned spending for this year (base + splurge if applicable)
        let totalPlannedSpending = currentSpendingBase;
        if (splurgeAmount > 0) {
          const splurgeEndAge = splurgeStartAge + splurgeDuration - 1;
          if (age >= splurgeStartAge && age <= splurgeEndAge) {
            totalPlannedSpending += splurgeAmount;
          }
        }
        
        const currentWithdrawalRate = totalPlannedSpending / realPortfolio;
        const safeWithdrawalRate = initialWithdrawalRate;
        const withdrawalRateRatio = (currentWithdrawalRate / safeWithdrawalRate) * 100;
  
  if (withdrawalRateRatio <= 100 - upperGuardrail) {
    guardrailStatus = 'increase';
    currentSpendingBase = currentSpendingBase * (1 + guardrailAdjustment / 100);
  } else if (withdrawalRateRatio >= 100 + lowerGuardrail) {
    guardrailStatus = 'decrease';
    const proposedSpending = currentSpendingBase * (1 - guardrailAdjustment / 100);
    const spendingMultiplier = getSpendingMultiplier(year);
    const indexedPensionFloor = totalPensionIncome / spendingMultiplier;
    currentSpendingBase = Math.max(proposedSpending, indexedPensionFloor);
  }
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
      
      // Add one-off expenses for this age (not subject to guardrails)
      let oneOffAddition = 0;
      oneOffExpenses.forEach(expense => {
        if (expense.age === age) {
          oneOffAddition += expense.amount;
        }
      });
      
      const totalSpending = inflationAdjustedSpending * spendingMultiplier + additionalCosts + oneOffAddition;

      const totalAssets = mainSuper + seqBuffer;
      const indexedMaxPension = agePensionParams.maxPensionPerYear * Math.pow(1 + cpiRate / 100, year - 1);
      const indexedThreshold = (isHomeowner ? agePensionParams.assetTestThresholdHomeowner : agePensionParams.assetTestThresholdNonHomeowner) * Math.pow(1 + cpiRate / 100, year - 1);
      const indexedCutoff = (isHomeowner ? agePensionParams.assetTestCutoffHomeowner : agePensionParams.assetTestCutoffNonHomeowner) * Math.pow(1 + cpiRate / 100, year - 1);
      const indexedTaper = agePensionParams.assetTaperPerYear * Math.pow(1 + cpiRate / 100, year - 1);
      const indexedPensionIncome = totalPensionIncome * Math.pow(1 + cpiRate / 100, year - 1);
      
      let agePension = 0;
      if (includeAgePension && age >= agePensionParams.eligibilityAge) {
        let assetTestPension = indexedMaxPension;
        if (totalAssets > indexedThreshold) {
          const excess = totalAssets - indexedThreshold;
          const reduction = Math.floor(excess / 1000) * (indexedTaper / Math.pow(1 + cpiRate / 100, year - 1)) * Math.pow(1 + cpiRate / 100, year - 1);
          assetTestPension = Math.max(0, indexedMaxPension - reduction);
        }
        if (totalAssets >= indexedCutoff) assetTestPension = 0;

        const indexedIncomeTestFreeArea = agePensionParams.incomeTestFreeArea * Math.pow(1 + cpiRate / 100, year - 1);
        let incomeTestPension = indexedMaxPension;
        if (indexedPensionIncome > indexedIncomeTestFreeArea) {
          const excessIncome = indexedPensionIncome - indexedIncomeTestFreeArea;
          const reduction = excessIncome * agePensionParams.incomeTaperRate;
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
        yearReturn, cpiRate, guardrailStatus, currentSpendingBase
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
      useHistoricalData, historicalPeriod, useMonteCarlo, monteCarloResults, splurgeAmount, splurgeStartAge, splurgeDuration, oneOffExpenses,
      currentAge, retirementAge, agePensionParams, pensionRecipientType, selectedFormalTest, formalTestResults]);

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
    csv += 'Guardrail Status,Current Spending Base\n';

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
      csv += `${r.guardrailStatus || 'normal'},${r.currentSpendingBase.toFixed(2)}\n`;
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
            <p className="text-gray-600">Version 10.1 - Complete Retirement Modeling</p>
          </div>
          <div className="text-right">
            <label className="block text-sm font-medium text-gray-700 mb-2">Display Values</label>
            <div className="flex gap-2 mb-2">
              <button 
                onClick={() => setShowNominalDollars(false)} 
                className={'px-4 py-2 rounded text-sm font-medium ' + (!showNominalDollars ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700')}
              >
                Real {getRetirementYear(retirementAge)} $
              </button>
              <button 
                onClick={() => setShowNominalDollars(true)} 
                className={'px-4 py-2 rounded text-sm font-medium ' + (showNominalDollars ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700')}
              >
                Nominal $
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              {showNominalDollars ? 'Future dollar amounts' : 'Retirement year purchasing power'}
            </p>
            <button 
              onClick={exportDetailedCSV}
              className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
            >
              📊 Export Detailed CSV
            </button>
          </div>
        </div>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <h2 className="text-xl font-bold mb-3">Initial Situation</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Main Super Balance
                <InfoTooltip text="Your main superannuation invested in growth assets. Earns variable returns based on market performance." />
              </label>
              <input type="number" value={mainSuperBalance} onChange={(e) => setMainSuperBalance(Number(e.target.value))} className="w-full p-2 border rounded" step="10000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Sequencing Buffer
                <InfoTooltip text="Cash/defensive assets to cover early retirement years. Withdrawals follow: Cash → Buffer → Main Super. Earns 3% real return (defensive)." />
              </label>
              <input type="number" value={sequencingBuffer} onChange={(e) => setSequencingBuffer(Number(e.target.value))} className="w-full p-2 border rounded" step="10000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Pension Income (per year)
                <InfoTooltip text="Your PSS/CSS/other defined benefit pension income. Indexed to inflation." />
              </label>
              <input type="number" value={totalPensionIncome} onChange={(e) => setTotalPensionIncome(Number(e.target.value))} className="w-full p-2 border rounded" step="5000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Base Annual Spending</label>
              <input type="number" value={baseSpending} onChange={(e) => setBaseSpending(Number(e.target.value))} className="w-full p-2 border rounded" step="5000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                CPI / Inflation Rate (% per year)
                <InfoTooltip text="Annual inflation rate used for projections. Affects spending growth, pension indexation, and real returns. Australian long-term average is 2.5%." />
              </label>
              <input 
                type="number" 
                value={inflationRate} 
                onChange={(e) => setInflationRate(Number(e.target.value))} 
                className="w-full p-2 border rounded" 
                step="0.1"
                min="0"
                max="10"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Current Age
                <InfoTooltip text="Your age today. Used to calculate when you'll reach retirement age." />
              </label>
              <select 
                value={currentAge} 
                onChange={(e) => setCurrentAge(Number(e.target.value))} 
                className="w-full p-2 border rounded"
              >
                {[50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65].map(age => (
                  <option key={age} value={age}>
                    Age {age}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Retirement Age
                <InfoTooltip text="The age at which you plan to retire and start drawing from your super." />
              </label>
              <select 
                value={retirementAge} 
                onChange={(e) => setRetirementAge(Number(e.target.value))} 
                className="w-full p-2 border rounded"
              >
                {[55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70]
                  .filter(age => age >= currentAge)
                  .map(age => (
                    <option key={age} value={age}>
                      Age {age} (Year: {getRetirementYear(age)})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Age Pension Recipient Type
                <InfoTooltip text="Single or couple rates affect maximum payment and asset test thresholds." />
              </label>
              <select 
                value={pensionRecipientType} 
                onChange={(e) => setPensionRecipientType(e.target.value as 'single' | 'couple')} 
                className="w-full p-2 border rounded"
              >
                <option value="couple">Couple (combined rates)</option>
                <option value="single">Single person</option>
              </select>
            </div>
            <div>
              <label className="flex items-center pt-7">
                <input type="checkbox" checked={isHomeowner} onChange={(e) => setIsHomeowner(e.target.checked)} className="mr-2" />
                <span className="text-sm font-medium">
                  Own Home (affects Age Pension asset test)
                  <InfoTooltip text="Homeowners have lower Age Pension asset test thresholds than non-homeowners." />
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="flex items-center">
                <input type="checkbox" checked={includeAgePension} onChange={(e) => setIncludeAgePension(e.target.checked)} className="mr-2" />
                <span className="text-sm font-medium">
                  Include Age Pension
                  <InfoTooltip text="Government payment for retirees aged 67+. Asset and income tested - reduces as your wealth increases." />
                </span>
              </label>
            </div>
          </div>
          
          {includeAgePension && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="text-xs text-gray-700">
                <span className="font-semibold">ℹ️ Age Pension:</span> Using <strong>{pensionRecipientType}</strong> rates 
                (max ~{formatCurrency(agePensionParams.maxPensionPerYear)}/year{pensionRecipientType === 'couple' ? ' combined' : ''}).
              </div>
            </div>
          )}
          
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Total Assets</div>
                <div className="text-xl font-bold text-green-700">{formatCurrency(mainSuperBalance + sequencingBuffer)}</div>
              </div>
              <div>
                <div className="text-gray-600">
                  Income Coverage
                  <InfoTooltip text="Pension income as % of base spending. Higher = less need to draw down assets." />
                </div>
                <div className="text-xl font-bold text-green-700">{((totalPensionIncome / baseSpending) * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-gray-700">
            <div className="font-semibold mb-1">Withdrawal Strategy</div>
            <div>1. Calculate spending need (base + splurge + one-offs)</div>
            <div>2. Subtract pension income and Age Pension</div>
            <div>3. Withdraw remainder: Cash → Buffer → Main Super</div>
            <div>4. Apply minimum drawdown (4-14% based on age), excess to Cash</div>
            <div>5. Apply returns: Main Super (variable), Buffer & Cash (3% real)</div>
          </div>
        </div>

        <div className="bg-white border p-4 rounded mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold">
              Pension Summary
              <InfoTooltip text="Your guaranteed lifetime income from PSS/CSS pension and Age Pension eligibility" />
            </h2>
            <button 
              onClick={() => setShowPensionSummary(!showPensionSummary)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {showPensionSummary ? '▼ Hide' : '▶ Show'}
            </button>
          </div>
          
          {showPensionSummary && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded border border-green-200">
                  <div className="text-sm text-gray-600 mb-1">PSS/CSS Pension ({getRetirementYear(retirementAge)})</div>
                  <div className="text-2xl font-bold text-green-700">
                    {formatCurrency(totalPensionIncome)}
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    ✓ Indexed to CPI ({inflationRate}%)<br/>
                    ✓ Tax-free in retirement
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded border border-blue-200">
                  <div className="text-sm text-gray-600 mb-1">Age Pension Eligibility</div>
                  <div className="text-2xl font-bold text-blue-700">
                    Age {agePensionParams.eligibilityAge}
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    Calendar year: {getRetirementYear(retirementAge) + (agePensionParams.eligibilityAge - retirementAge)}<br/>
                    Asset & income tested<br/>
                    <span className="text-blue-700 font-semibold">
                      {pensionRecipientType === 'couple' ? '👥 Couple rates' : '👤 Single rates'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-purple-50 rounded border border-purple-200">
                  <div className="text-sm text-gray-600 mb-1">Income Coverage</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {((totalPensionIncome / baseSpending) * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    of base spending<br/>
                    covered by PSS/CSS pension
                  </div>
                </div>
              </div>

              {/* Age Pension Over Time Chart */}
              {pensionChartData && pensionChartData.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Age Pension Over Time</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={pensionChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -5 }} />
                      <YAxis tickFormatter={(val) => ((val as number)/1000).toFixed(0) + 'k'} />
                      <Tooltip formatter={(val) => formatCurrency(val as number)} />
                      <Legend />
                      <Area type="monotone" dataKey="PSS/CSS Pension" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="Age Pension" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      <Line type="monotone" dataKey="Total Income" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className="mt-2 text-xs text-gray-600">
                    💡 Stacked areas show PSS/CSS pension (green) + Age Pension (blue). Purple line shows total income.
                    Age Pension reduces as assets grow due to asset test.
                  </div>
                </div>
              )}

              {/* Guardrail Protection Note */}
              {useGuardrails && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 text-lg">🛡️</span>
                    <div className="text-sm">
                      <div className="font-semibold text-gray-900 mb-1">Pension Floor Protection Active</div>
                      <div className="text-gray-700">
                        With guardrails enabled, your spending will never fall below your inflation-adjusted 
                        pension income ({formatCurrency(totalPensionIncome)}), even in severe market downturns. 
                        This provides a guaranteed baseline standard of living.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-white border p-4 rounded mb-6 mt-6">
          <h2 className="text-xl font-bold mb-3">
            Retirement Spending
            <InfoTooltip text="Configure your spending pattern and any additional splurge spending for specific years." />
          </h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Spending Pattern
              <InfoTooltip text="Level (CPI): Constant spending adjusted for inflation. Declining (JP Morgan): Decreases spending over time (go-go, slow-go, no-go years)." />
            </label>
            <div className="flex gap-2">
              <button onClick={() => setSpendingPattern('jpmorgan')} className={'px-4 py-2 rounded ' + (spendingPattern === 'jpmorgan' ? 'bg-purple-600 text-white' : 'bg-gray-200')}>JP Morgan (Declining)</button>
              <button onClick={() => setSpendingPattern('cpi')} className={'px-4 py-2 rounded ' + (spendingPattern === 'cpi' ? 'bg-purple-600 text-white' : 'bg-gray-200')}>CPI (Level)</button>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">
              Additional Splurge Spending
              <InfoTooltip text="Extra spending for specific years (e.g., travel, home renovation). Added on top of regular spending." />
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Annual Splurge Amount: {formatCurrency(splurgeAmount)}
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="200000" 
                  step="5000"
                  value={splurgeAmount} 
                  onChange={(e) => setSplurgeAmount(Number(e.target.value))} 
                  className="w-full" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Start Age: {splurgeStartAge}
                </label>
                <input 
                  type="range" 
                  min={retirementAge} 
                  max="90" 
                  step="1"
                  value={splurgeStartAge} 
                  onChange={(e) => setSplurgeStartAge(Number(e.target.value))} 
                  className="w-full" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Duration (years): {splurgeDuration}
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  step="1"
                  value={splurgeDuration} 
                  onChange={(e) => setSplurgeDuration(Number(e.target.value))} 
                  className="w-full" 
                />
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded">
                {splurgeSummary.enabled ? (
                  <div className="space-y-1 text-sm">
                    <div className="font-semibold text-gray-900">Splurge Summary</div>
                    <div><strong>Total splurge:</strong> {formatCurrency(splurgeSummary.totalSplurge)}</div>
                    <div><strong>Active period:</strong> {splurgeSummary.activePeriod}</div>
                    <div><strong>Annual impact:</strong> {splurgeSummary.annualImpact}</div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">{splurgeSummary.message}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border p-4 rounded mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold">
              One-Off Expenses
              <InfoTooltip text="Single large expenses in specific years (e.g., car purchase, home repairs, wedding). Not recurring." />
            </h2>
            <button 
              onClick={() => setShowOneOffExpenses(!showOneOffExpenses)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {showOneOffExpenses ? '▼ Hide' : '▶ Show'}
            </button>
          </div>
          
          {showOneOffExpenses && (
            <div className="space-y-4">
              {[...oneOffExpenses].sort((a, b) => a.age - b.age).map((expense, sortedIndex) => {
                const actualIndex = oneOffExpenses.findIndex(e => e === expense);
                return (
                  <div key={actualIndex} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <input 
                        type="text"
                        placeholder="Description (e.g., New car)"
                        value={expense.description}
                        onChange={(e) => {
                          const newExpenses = [...oneOffExpenses];
                          newExpenses[actualIndex].description = e.target.value;
                          setOneOffExpenses(newExpenses);
                        }}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div className="w-32">
                      <label className="text-xs text-gray-600">Age</label>
                      <input 
                        type="number"
                        placeholder="Age"
                        value={expense.age}
                        onChange={(e) => {
                          const newExpenses = [...oneOffExpenses];
                          newExpenses[actualIndex].age = Number(e.target.value);
                          setOneOffExpenses(newExpenses);
                        }}
                        className="w-full p-2 border rounded"
                        min={retirementAge}
                        max="100"
                      />
                    </div>
                    <div className="w-40">
                      <label className="text-xs text-gray-600">Amount</label>
                      <input 
                        type="number"
                        placeholder="Amount"
                        value={expense.amount}
                        onChange={(e) => {
                          const newExpenses = [...oneOffExpenses];
                          newExpenses[actualIndex].amount = Number(e.target.value);
                          setOneOffExpenses(newExpenses);
                        }}
                        className="w-full p-2 border rounded"
                        step="1000"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const newExpenses = oneOffExpenses.filter((_, i) => i !== actualIndex);
                        setOneOffExpenses(newExpenses);
                      }}
                      className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
              
              <button 
                onClick={() => {
                  setOneOffExpenses([...oneOffExpenses, { description: '', age: retirementAge + 5, amount: 50000 }]);
                }}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + Add One-Off Expense
              </button>
              
              {oneOffExpenses.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                  <div className="font-semibold text-gray-900 mb-2">Summary</div>
                  <div className="text-sm space-y-1">
                    <div><strong>Total one-off expenses:</strong> {formatCurrency(oneOffExpenses.reduce((sum, e) => sum + e.amount, 0))}</div>
                    <div><strong>Number of expenses:</strong> {oneOffExpenses.length}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border p-4 rounded mb-6">
          <h2 className="text-xl font-bold mb-3">
            Dynamic Spending Guardrails
            <InfoTooltip text="Guyton-Klinger method: adjusts spending up/down based on portfolio performance to sustain withdrawals longer." />
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center">
              <input type="checkbox" checked={useGuardrails} onChange={(e) => setUseGuardrails(e.target.checked)} className="mr-2" />
              <span className="text-sm font-medium">Enable Guardrails</span>
            </label>
          </div>
          {useGuardrails && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Upper Guardrail: {upperGuardrail}%</label>
                <input type="range" min="10" max="30" step="5" value={upperGuardrail} onChange={(e) => setUpperGuardrail(Number(e.target.value))} className="w-full" />
                <p className="text-xs text-gray-600">Increase spending if withdrawal rate drops {upperGuardrail}% below initial</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Lower Guardrail: {lowerGuardrail}%</label>
                <input type="range" min="10" max="25" step="5" value={lowerGuardrail} onChange={(e) => setLowerGuardrail(Number(e.target.value))} className="w-full" />
                <p className="text-xs text-gray-600">Decrease spending if withdrawal rate rises {lowerGuardrail}% above initial</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Adjustment: {guardrailAdjustment}%</label>
                <input type="range" min="5" max="20" step="5" value={guardrailAdjustment} onChange={(e) => setGuardrailAdjustment(Number(e.target.value))} className="w-full" />
                <p className="text-xs text-gray-600">Spending adjustment when triggered</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border p-4 rounded mb-6">
          <h2 className="text-xl font-bold mb-3">Test Scenarios</h2>
          
          <div className="flex gap-2 mb-4 flex-wrap">
            <button onClick={() => { setUseHistoricalData(false); setUseMonteCarlo(false); setUseFormalTest(false); setUseHistoricalMonteCarlo(false); }} className={'px-4 py-2 rounded ' + (!useHistoricalData && !useMonteCarlo && !useFormalTest && !useHistoricalMonteCarlo ? 'bg-blue-600 text-white' : 'bg-gray-200')}>Constant Return</button>
            <button onClick={() => { setUseHistoricalData(true); setUseMonteCarlo(false); setUseFormalTest(false); setUseHistoricalMonteCarlo(false); }} className={'px-4 py-2 rounded ' + (useHistoricalData ? 'bg-orange-600 text-white' : 'bg-gray-200')}>Historical</button>
            <button onClick={() => { setUseMonteCarlo(true); setUseHistoricalData(false); setUseFormalTest(false); setUseHistoricalMonteCarlo(false); setMonteCarloResults(null); }} className={'px-4 py-2 rounded ' + (useMonteCarlo ? 'bg-green-600 text-white' : 'bg-gray-200')}>Monte Carlo</button>
            <button onClick={() => { setUseHistoricalMonteCarlo(true); setUseHistoricalData(false); setUseMonteCarlo(false); setUseFormalTest(false); setHistoricalMonteCarloResults(null); }} className={'px-4 py-2 rounded text-sm ' + (useHistoricalMonteCarlo ? 'bg-teal-600 text-white' : 'bg-gray-200')}>
              Historical MC
              <InfoTooltip text="Monte Carlo using 98 years of verified S&P 500 data from Shiller/Ibbotson (1928-2025)" />
            </button>
            <button onClick={() => { setUseFormalTest(true); setUseHistoricalData(false); setUseMonteCarlo(false); setUseHistoricalMonteCarlo(false); setFormalTestResults(null); }} className={'px-4 py-2 rounded ' + (useFormalTest ? 'bg-purple-600 text-white' : 'bg-gray-200')}>Formal Tests</button>
          </div>
          
          {!useHistoricalData && !useMonteCarlo && !useFormalTest && !useHistoricalMonteCarlo && (
            <div>
              <label className="block text-sm font-medium mb-2">Expected Return: {selectedScenario}%</label>
              <input type="range" min="0" max="10" step="0.5" value={selectedScenario} onChange={(e) => setSelectedScenario(Number(e.target.value))} className="w-full" />
            </div>
          )}
          
          {useHistoricalData && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Select Historical Period</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(historicalReturns).map(period => (
                  <button key={period} onClick={() => setHistoricalPeriod(period)} className={'px-3 py-2 rounded text-sm ' + (historicalPeriod === period ? 'bg-orange-600 text-white' : 'bg-gray-200')}>
                    {historicalLabels[period as keyof typeof historicalLabels]}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {useMonteCarlo && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Number of Simulations</label>
                <select value={monteCarloRuns} onChange={(e) => setMonteCarloRuns(Number(e.target.value))} className="w-full p-2 border rounded">
                  <option value={500}>500</option>
                  <option value={1000}>1,000</option>
                  <option value={2000}>2,000</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Expected Return (%)
                  <InfoTooltip text="Average annual return you expect from your investments over the long term." />
                </label>
                <input type="number" value={expectedReturn} onChange={(e) => setExpectedReturn(Number(e.target.value))} className="w-full p-2 border rounded" step="0.5" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Volatility (%)
                  <InfoTooltip text="How much returns vary year-to-year. Higher = more uncertainty in annual returns." />
                </label>
                <input type="number" value={returnVolatility} onChange={(e) => setReturnVolatility(Number(e.target.value))} className="w-full p-2 border rounded" step="1" />
              </div>
              <button onClick={() => setMonteCarloResults(runMonteCarlo())} className="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 font-bold">
                Run Monte Carlo
                <InfoTooltip text="Runs 1000 scenarios with randomized returns to show range of possible outcomes." />
              </button>
            </div>
          )}
          
          {useHistoricalMonteCarlo && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-teal-50 border border-teal-200 rounded">
                <div className="font-semibold text-teal-900 mb-2">📊 Historical Monte Carlo</div>
                <div className="text-sm text-gray-700">
                  Samples from <strong>98 years of verified S&P 500 data (1928-2025)</strong> from Robert Shiller and Ibbotson SBBI. Includes: Great Depression (-43%), 1974 stagflation (-27%), 1987 crash, 2000 dot-com, 2008 GFC (-37%), 2020 COVID. Real historical returns, not theoretical assumptions.
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Number of Simulations</label>
                <select value={monteCarloRuns} onChange={(e) => setMonteCarloRuns(Number(e.target.value))} className="w-full p-2 border rounded">
                  <option value={500}>500</option>
                  <option value={1000}>1,000</option>
                  <option value={2000}>2,000</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Sampling Method
                  <InfoTooltip text="How to sample from 97 years of historical data. Block Bootstrap is recommended." />
                </label>
                <div className="space-y-2">
                  <button 
                    onClick={() => setHistoricalMethod('overlapping')} 
                    className={'w-full px-3 py-3 rounded text-left text-sm ' + (historicalMethod === 'overlapping' ? 'bg-teal-600 text-white' : 'bg-gray-100 hover:bg-gray-200')}
                  >
                    <div className="font-semibold">Block Bootstrap (Recommended)</div>
                    <div className={'text-xs mt-1 ' + (historicalMethod === 'overlapping' ? 'text-teal-100' : 'text-gray-600')}>
                      Samples {blockSize}-year blocks preserving short-term correlations. Realistic sequences.
                    </div>
                  </button>
                  <button 
                    onClick={() => setHistoricalMethod('shuffle')} 
                    className={'w-full px-3 py-3 rounded text-left text-sm ' + (historicalMethod === 'shuffle' ? 'bg-teal-600 text-white' : 'bg-gray-100 hover:bg-gray-200')}
                  >
                    <div className="font-semibold">Shuffled Years</div>
                    <div className={'text-xs mt-1 ' + (historicalMethod === 'shuffle' ? 'text-teal-100' : 'text-gray-600')}>
                      Random individual years. Maximum diversity but loses correlations.
                    </div>
                  </button>
                  <button 
                    onClick={() => setHistoricalMethod('block')} 
                    className={'w-full px-3 py-3 rounded text-left text-sm ' + (historicalMethod === 'block' ? 'bg-teal-600 text-white' : 'bg-gray-100 hover:bg-gray-200')}
                  >
                    <div className="font-semibold">Complete 35-Year Blocks</div>
                    <div className={'text-xs mt-1 ' + (historicalMethod === 'block' ? 'text-teal-100' : 'text-gray-600')}>
                      Full historical 35-year periods. Only ~62 unique scenarios.
                    </div>
                  </button>
                </div>
              </div>
              
              {historicalMethod === 'overlapping' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Block Size: {blockSize} years</label>
                  <input 
                    type="range" 
                    min="3" 
                    max="10" 
                    step="1"
                    value={blockSize} 
                    onChange={(e) => setBlockSize(Number(e.target.value))} 
                    className="w-full" 
                  />
                  <p className="text-xs text-gray-600 mt-1">Larger blocks preserve more correlation, smaller blocks give more diversity. 5 years is typical.</p>
                </div>
              )}
              
              <button 
                onClick={() => setHistoricalMonteCarloResults(runHistoricalMonteCarlo())} 
                className="w-full px-4 py-3 bg-teal-600 text-white rounded hover:bg-teal-700 font-bold"
              >
                Run Historical Monte Carlo ({monteCarloRuns} simulations)
              </button>
            </div>
          )}
          
          {useFormalTest && (
            <div className="mt-4">
              <button onClick={() => setFormalTestResults(runFormalTests())} className="w-full px-4 py-3 bg-purple-600 text-white rounded hover:bg-purple-700 font-bold">Run All Formal Tests</button>
            </div>
          )}
        </div>

        {useFormalTest && formalTestResults && (
          <div className="bg-white border p-4 rounded mb-6">
            <h2 className="text-xl font-bold mb-3">Formal Test Results</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm">Passed</div>
                <div className="text-3xl font-bold text-green-700">{Object.values(formalTestResults).filter((r: any) => r.passed).length}</div>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <div className="text-sm">Failed</div>
                <div className="text-3xl font-bold text-red-700">{Object.values(formalTestResults).filter((r: any) => !r.passed).length}</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm">Success Rate</div>
                <div className="text-3xl font-bold text-blue-700">{((Object.values(formalTestResults).filter((r: any) => r.passed).length / Object.values(formalTestResults).length) * 100).toFixed(0)}%</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left border">Test</th>
                    <th className="p-2 text-left border">Description</th>
                    <th className="p-2 text-right border">Years Lasted</th>
                    <th className="p-2 text-right border">Final Balance</th>
                    <th className="p-2 text-center border">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(formalTestResults).map((key) => {
                    const test: any = formalTestResults[key as keyof typeof formalTestResults];
                    return (
                      <tr key={key} className={test.passed ? 'bg-green-50 hover:bg-green-100 cursor-pointer' : 'bg-red-50 hover:bg-red-100 cursor-pointer'} onClick={() => setSelectedFormalTest(key)}>
                        <td className="p-2 font-bold border">{test.name}</td>
                        <td className="p-2 border">{test.desc}</td>
                        <td className="p-2 text-right border">{test.yearsLasted} / {test.targetYears} years</td>
                        <td className="p-2 text-right border">{formatCurrency(toDisplayValue(test.finalBalance, test.yearsLasted))}</td>
                        <td className="p-2 text-center text-2xl border">{test.passed ? '✅' : '❌'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-600 mt-2">💡 Click any test row to view its detailed chart below</p>
          </div>
        )}

        {useFormalTest && selectedFormalTest && formalTestResults && formalTestResults[selectedFormalTest as keyof typeof formalTestResults] && (formalTestResults[selectedFormalTest as keyof typeof formalTestResults] as any).simulationData && (
          <div className="bg-white border p-4 rounded mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold">Detailed View: {(formalTestResults[selectedFormalTest as keyof typeof formalTestResults] as any).name}</h2>
              <button onClick={() => setSelectedFormalTest(null)} className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">Close</button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{(formalTestResults[selectedFormalTest as keyof typeof formalTestResults] as any).desc}</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={(formalTestResults[selectedFormalTest as keyof typeof formalTestResults] as any).simulationData.map((r: any) => ({
                year: r.year,
                age: r.age,
                balance: toDisplayValue(r.totalBalance, r.year, r.cpiRate),
                spending: toDisplayValue(r.spending, r.year, r.cpiRate),
                income: toDisplayValue(r.income, r.year, r.cpiRate)
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -5 }} />
                <YAxis tickFormatter={(val) => ((val as number)/1000).toFixed(0) + 'k'} />
                <Tooltip formatter={(val) => formatCurrency(val as number)} />
                <Legend />
                <Line type="monotone" dataKey="balance" name="Total Balance" stroke="#2563eb" strokeWidth={2} />
                <Line type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={1} />
                <Line type="monotone" dataKey="spending" name="Spending" stroke="#ef4444" strokeWidth={1} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {useMonteCarlo && monteCarloResults && (
          <div className="bg-white border p-6 rounded mb-6">
            <h2 className="text-2xl font-bold mb-4">Monte Carlo Results</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-600">
                  Success Rate
                  <InfoTooltip text="Percentage of scenarios where money lasts to target age (35 years)." />
                </div>
                <div className="text-3xl font-bold text-green-700">{monteCarloResults.successRate.toFixed(1)}%</div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-600">
                  10th Percentile
                  <InfoTooltip text="Pessimistic outcome - only 10% of scenarios do worse than this." />
                </div>
                <div className="text-2xl font-bold">{formatCurrency(toDisplayValue(monteCarloResults.percentiles.p10, 35))}</div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-600">
                  Median
                  <InfoTooltip text="Middle outcome - half of scenarios do better, half do worse." />
                </div>
                <div className="text-2xl font-bold">{formatCurrency(toDisplayValue(monteCarloResults.percentiles.p50, 35))}</div>
              </div>
            </div>
            
            {/* Failure Analysis Section */}
            {monteCarloResults.failureStats && monteCarloResults.failureStats.totalFailures > 0 && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded">
                <h3 className="text-lg font-semibold text-red-900 mb-3">
                  ⚠️ Failure Analysis ({monteCarloResults.failureStats.totalFailures} scenarios failed)
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-700 font-semibold mb-2">Average Failure Point</div>
                    <div className="text-xl font-bold text-red-700">
                      Year {monteCarloResults.failureStats.avgFailureYear} (Age {monteCarloResults.failureStats.avgFailureAge})
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-700 font-semibold mb-2">Primary Failure Causes</div>
                    <div className="space-y-1">
                      {monteCarloResults.failureStats.topCauses.map((cause: any, idx: number) => (
                        <div key={idx} className="text-sm">
                          <span className="font-semibold">{cause.cause}:</span> {cause.count} scenarios ({cause.percentage.toFixed(0)}%)
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-white rounded border border-red-300">
                  <div className="text-sm font-semibold text-gray-700 mb-2">💡 What This Means:</div>
                  <div className="text-sm text-gray-700 space-y-1">
                    {monteCarloResults.failureStats.topCauses[0]?.cause === 'Early sequence risk' && (
                      <div>• <strong>Early sequence risk</strong> is the main threat. Poor returns in the first 5 years deplete your portfolio before it can recover. Consider a larger sequencing buffer or more conservative initial withdrawal rate.</div>
                    )}
                    {monteCarloResults.failureStats.topCauses[0]?.cause === 'Poor early returns' && (
                      <div>• <strong>Poor early returns</strong> damage your portfolio when it's largest. Consider increasing your sequencing buffer from ${(sequencingBuffer/1000).toFixed(0)}k or reducing initial spending.</div>
                    )}
                    {monteCarloResults.failureStats.topCauses[0]?.cause === 'Extended bear market' && (
                      <div>• <strong>Extended bear markets</strong> (4+ consecutive down years) are the main risk. Your plan may need more conservative assumptions or a larger safety buffer.</div>
                    )}
                    {monteCarloResults.failureStats.topCauses[0]?.cause === 'Gradual depletion' && (
                      <div>• <strong>Gradual depletion</strong> suggests spending may be too high relative to portfolio size. Consider reducing base spending or increasing initial portfolio.</div>
                    )}
                    <div>• On average, failures occur at Year {monteCarloResults.failureStats.avgFailureYear} (Age {monteCarloResults.failureStats.avgFailureAge}), giving you early warning signs to adjust spending if needed.</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {useHistoricalMonteCarlo && historicalMonteCarloResults && (
          <div className="bg-white border p-6 rounded mb-6">
            <h2 className="text-2xl font-bold mb-4">Historical Monte Carlo Results</h2>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-600">Success Rate</div>
                <div className="text-3xl font-bold text-teal-700">{historicalMonteCarloResults.successRate.toFixed(1)}%</div>
                <div className="text-xs text-gray-500 mt-1">Based on real data</div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-600">Worst Outcome</div>
                <div className="text-2xl font-bold">{formatCurrency(toDisplayValue(historicalMonteCarloResults.percentiles.p10, 35))}</div>
                <div className="text-xs text-gray-500 mt-1">10th percentile</div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-600">Median</div>
                <div className="text-2xl font-bold">{formatCurrency(toDisplayValue(historicalMonteCarloResults.percentiles.p50, 35))}</div>
                <div className="text-xs text-gray-500 mt-1">Typical outcome</div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <div className="text-sm text-gray-600">Best Outcome</div>
                <div className="text-2xl font-bold">{formatCurrency(toDisplayValue(historicalMonteCarloResults.percentiles.p90, 35))}</div>
                <div className="text-xs text-gray-500 mt-1">90th percentile</div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded">
              <div className="text-sm font-semibold text-teal-900 mb-2">📊 Historical Context</div>
              <div className="text-sm text-gray-700 space-y-1">
                <div>• <strong>Data source:</strong> S&P 500 Total Return Index (Shiller/Ibbotson SBBI, 1928-2025)</div>
                <div>• <strong>Data period:</strong> {historicalMonteCarloResults.dataYears} years of verified historical returns</div>
                <div>• <strong>Includes:</strong> Great Depression (-43%), 1974 stagflation (-27%), 1987 crash, 2000 dot-com, 2008 GFC (-37%), 2020 COVID</div>
                <div>• <strong>Method:</strong> {
                  historicalMonteCarloResults.method === 'shuffle' ? 'Random year sampling' :
                  historicalMonteCarloResults.method === 'overlapping' ? `${blockSize}-year block bootstrap` :
                  'Complete 35-year sequences'
                }</div>
                <div>• <strong>Simulations:</strong> {
                  historicalMonteCarloResults.method === 'block' 
                    ? `${historicalMonteCarloResults.actualRuns} unique historical periods tested (all possible 35-year blocks from 1928-2025)`
                    : `${monteCarloRuns.toLocaleString()} scenarios sampled from actual market history`
                }</div>
                <div>• <strong>Advantage:</strong> Real crash patterns, real recoveries, real correlations - not theoretical assumptions</div>
              </div>
            </div>
            
            {/* Failure Analysis Section */}
            {historicalMonteCarloResults.failureStats && historicalMonteCarloResults.failureStats.totalFailures > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <h3 className="text-lg font-semibold text-red-900 mb-3">
                  ⚠️ Failure Analysis ({historicalMonteCarloResults.failureStats.totalFailures} historical scenarios failed)
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-700 font-semibold mb-2">Average Failure Point</div>
                    <div className="text-xl font-bold text-red-700">
                      Year {historicalMonteCarloResults.failureStats.avgFailureYear} (Age {historicalMonteCarloResults.failureStats.avgFailureAge})
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-700 font-semibold mb-2">Primary Failure Causes</div>
                    <div className="space-y-1">
                      {historicalMonteCarloResults.failureStats.topCauses.map((cause: any, idx: number) => (
                        <div key={idx} className="text-sm">
                          <span className="font-semibold">{cause.cause}:</span> {cause.count} scenarios ({cause.percentage.toFixed(0)}%)
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-white rounded border border-red-300">
                  <div className="text-sm font-semibold text-gray-700 mb-2">💡 What This Means (Based on Real History):</div>
                  <div className="text-sm text-gray-700 space-y-1">
                    {historicalMonteCarloResults.failureStats.topCauses[0]?.cause === 'Early sequence risk' && (
                      <div>• <strong>Early sequence risk</strong> from historical crashes (like 1929 or 2008 immediately after retirement) is the main threat. These real historical scenarios depleted portfolios before recovery. Consider a larger sequencing buffer or more conservative initial withdrawal rate.</div>
                    )}
                    {historicalMonteCarloResults.failureStats.topCauses[0]?.cause === 'Poor early returns' && (
                      <div>• <strong>Poor early returns</strong> (similar to retiring in 1929, 1973, or 2000) damage your portfolio when it's largest. Consider increasing your sequencing buffer from ${(sequencingBuffer/1000).toFixed(0)}k or reducing initial spending.</div>
                    )}
                    {historicalMonteCarloResults.failureStats.topCauses[0]?.cause === 'Extended bear market' && (
                      <div>• <strong>Extended bear markets</strong> (like 1929-1932, 1973-1974, or 2000-2002) are the main risk in actual history. Your plan may need more conservative assumptions or a larger safety buffer.</div>
                    )}
                    {historicalMonteCarloResults.failureStats.topCauses[0]?.cause === 'Gradual depletion' && (
                      <div>• <strong>Gradual depletion</strong> suggests spending may be too high even in moderate historical scenarios. Consider reducing base spending or increasing initial portfolio.</div>
                    )}
                    <div>• These failures represent <strong>real historical sequences</strong> from 1928-2025. On average, failures occurred at Year {historicalMonteCarloResults.failureStats.avgFailureYear} (Age {historicalMonteCarloResults.failureStats.avgFailureAge}), giving you early warning to adjust spending.</div>
                    
                    {/* Show specific failing periods for Complete Blocks method */}
                    {historicalMonteCarloResults.method === 'block' && historicalMonteCarloResults.failureStats.allFailures && historicalMonteCarloResults.failureStats.allFailures.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <div className="font-semibold mb-2">📅 Specific Historical Periods That Failed:</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {historicalMonteCarloResults.failureStats.allFailures.map((failure: any, idx: number) => (
                            <div key={idx} className="bg-red-100 p-2 rounded">
                              <span className="font-semibold">{failure.historicalPeriod}</span>
                              <span className="text-gray-600"> - Failed at Year {failure.failureYear}</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-gray-600 mt-2 italic">
                          These are the actual retirement start years that would have resulted in portfolio depletion based on real historical market returns.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {chartData.length > 0 && (
          <div>
            {/* Explanatory Banner for Monte Carlo */}
            {useMonteCarlo && monteCarloResults && (
              <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4">
                <div className="text-sm">
                  <span className="font-semibold text-green-800">📊 Monte Carlo View:</span>
                  <span className="text-gray-700"> Charts below show the median (50th percentile) scenario from {monteCarloRuns.toLocaleString()} simulations. See Monte Carlo Results section above for success rate ({monteCarloResults.successRate.toFixed(1)}%) and percentile analysis.</span>
                </div>
              </div>
            )}

            {/* Explanatory Banner for Historical Monte Carlo */}
            {useHistoricalMonteCarlo && historicalMonteCarloResults && (
              <div className="bg-teal-50 border-l-4 border-teal-500 p-3 mb-4">
                <div className="text-sm">
                  <span className="font-semibold text-teal-800">📊 Historical Monte Carlo View:</span>
                  <span className="text-gray-700"> Charts below show the median scenario from {monteCarloRuns.toLocaleString()} simulations using 98 years of verified S&P 500 data (Shiller/Ibbotson, 1928-2025). Success rate: {historicalMonteCarloResults.successRate.toFixed(1)}%.</span>
                </div>
              </div>
            )}

            {/* Explanatory Banner for Formal Tests */}
            {useFormalTest && formalTestResults && (
              <div className="bg-purple-50 border-l-4 border-purple-500 p-3 mb-4">
                <div className="text-sm">
                  <span className="font-semibold text-purple-800">🧪 Formal Test View:</span>
                  <span className="text-gray-700"> Charts below show {selectedFormalTest ? (formalTestResults[selectedFormalTest as keyof typeof formalTestResults] as any).name : 'the base scenario'}. Click different tests in the table above to compare scenarios.</span>
                </div>
              </div>
            )}

            <div className="bg-white border rounded p-4 mb-6">
              <h2 className="text-xl font-bold mb-3">
                Portfolio Balance
                {useMonteCarlo && monteCarloResults && (
                  <span className="text-base font-normal text-gray-600"> - Median Scenario</span>
                )}
                {useHistoricalMonteCarlo && historicalMonteCarloResults && (
                  <span className="text-base font-normal text-gray-600"> - Historical Median</span>
                )}
                {useFormalTest && selectedFormalTest && formalTestResults && (
                  <span className="text-base font-normal text-gray-600"> - {(formalTestResults[selectedFormalTest as keyof typeof formalTestResults] as any).name}</span>
                )}
                {useMonteCarlo && (
                  <InfoTooltip text="This shows the median (50th percentile) outcome from your Monte Carlo simulation. Half of scenarios performed better, half performed worse." />
                )}
                {useHistoricalMonteCarlo && (
                  <InfoTooltip text="Median outcome from S&P 500 historical data sampling (Shiller/Ibbotson, 1928-2025). Real market behavior, not theoretical assumptions." />
                )}
                {useFormalTest && (
                  <InfoTooltip text="This shows the selected formal test scenario. Click different tests in the table above to update this chart." />
                )}
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" />
                  <YAxis tickFormatter={(val) => ((val as number)/1000).toFixed(0) + 'k'} />
                  <Tooltip formatter={(val) => formatCurrency(val as number)} />
                  <Legend />
                  <Line type="monotone" dataKey="Total Balance" stroke="#2563eb" strokeWidth={3} />
                  <Line type="monotone" dataKey="Main Super" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="Buffer" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="Cash" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border rounded p-4 mb-6">
              <h2 className="text-xl font-bold mb-3">
                Income vs Spending
                {useMonteCarlo && monteCarloResults && (
                  <span className="text-base font-normal text-gray-600"> - Median Scenario</span>
                )}
                {useHistoricalMonteCarlo && historicalMonteCarloResults && (
                  <span className="text-base font-normal text-gray-600"> - Historical Median</span>
                )}
                {useFormalTest && selectedFormalTest && formalTestResults && (
                  <span className="text-base font-normal text-gray-600"> - {(formalTestResults[selectedFormalTest as keyof typeof formalTestResults] as any).name}</span>
                )}
                {useMonteCarlo && (
                  <InfoTooltip text="Median scenario income and spending trajectory. Individual simulations may vary significantly." />
                )}
                {useHistoricalMonteCarlo && (
                  <InfoTooltip text="Median income and spending from S&P 500 historical sampling. Based on 98 years of verified data (Shiller/Ibbotson)." />
                )}
                {useFormalTest && (
                  <InfoTooltip text="Income and spending for the selected test scenario. Click different tests above to compare." />
                )}
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" />
                  <YAxis tickFormatter={(val) => ((val as number)/1000).toFixed(0) + 'k'} />
                  <Tooltip formatter={(val) => formatCurrency(val as number)} />
                  <Legend />
                  <Line type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="Spending" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="text-center text-sm text-gray-600 mt-6">
          Australian Retirement Planning Tool v10.1
        </div>
      </div>
    </div>
  );
};

export default RetirementCalculator;
