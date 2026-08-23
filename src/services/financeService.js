/**
 * Calculate Equated Monthly Installment (EMI)
 * Formula: E = P * r * (1 + r)^n / ((1 + r)^n - 1)
 * @param {number} principal - Loan amount in INR
 * @param {number} annualRate - Annual interest rate in percent (e.g., 8.5)
 * @param {number} tenureMonths - Total tenure in months
 * @returns {number} Rounded EMI in INR
 */
export function calculateEMI(principal, annualRate, tenureMonths) {
  if (!principal || principal <= 0 || !tenureMonths || tenureMonths <= 0) return 0;
  if (!annualRate || annualRate <= 0) return Math.round(principal / tenureMonths);

  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  return Math.round(emi);
}

/**
 * Generate full monthly and yearly amortization schedules
 * @param {number} principal - Loan amount in INR
 * @param {number} annualRate - Annual interest rate in percent
 * @param {number} tenureMonths - Total tenure in months
 */
export function generateAmortizationSchedule(principal, annualRate, tenureMonths) {
  const emi = calculateEMI(principal, annualRate, tenureMonths);
  const monthlyRate = (annualRate || 0) / 12 / 100;
  const monthlySchedule = [];
  const yearlySchedule = [];

  let balance = principal;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;

  for (let month = 1; month <= tenureMonths; month++) {
    const interest = Math.round(balance * monthlyRate);
    let principalPaid = emi - interest;

    if (month === Math.floor(tenureMonths) || balance < principalPaid) {
      principalPaid = balance;
    }

    balance = Math.max(0, balance - principalPaid);
    totalInterestPaid += interest;
    totalPrincipalPaid += principalPaid;

    monthlySchedule.push({
      month,
      emi: principalPaid + interest,
      principal: principalPaid,
      interest,
      balance,
    });
  }

  // Aggregate into yearly intervals
  const totalYears = Math.ceil(tenureMonths / 12);
  for (let year = 1; year <= totalYears; year++) {
    const yearSlice = monthlySchedule.slice((year - 1) * 12, year * 12);
    if (yearSlice.length === 0) continue;

    const yearPrincipal = yearSlice.reduce((sum, item) => sum + item.principal, 0);
    const yearInterest = yearSlice.reduce((sum, item) => sum + item.interest, 0);
    const endBalance = yearSlice[yearSlice.length - 1].balance;

    yearlySchedule.push({
      year,
      principalPaid: yearPrincipal,
      interestPaid: yearInterest,
      totalPayment: yearPrincipal + yearInterest,
      closingBalance: endBalance,
    });
  }

  return {
    emi,
    principal,
    totalInterest: totalInterestPaid,
    totalPayable: principal + totalInterestPaid,
    tenureMonths,
    tenureYears: +(tenureMonths / 12).toFixed(1),
    monthlySchedule,
    yearlySchedule,
  };
}

/**
 * Calculate borrower eligibility based on Fixed Obligation to Income Ratio (FOIR)
 * Standard Indian banking norms: FOIR 40% - 65% depending on income slab
 * @param {number} monthlyIncome 
 * @param {number} existingEmi 
 * @param {number} tenureYears 
 * @param {number} annualRate 
 * @param {number} [customFoir] - Optional custom FOIR ratio (default dynamically assessed)
 */
export function calculateEligibility(monthlyIncome, existingEmi = 0, tenureYears = 20, annualRate = 8.5, customFoir = null) {
  const income = Math.max(0, Number(monthlyIncome) || 0);
  const currentEmi = Math.max(0, Number(existingEmi) || 0);
  const tenureMonths = (Number(tenureYears) || 20) * 12;
  const rate = Number(annualRate) || 8.5;

  // Determine FOIR based on income tier if not provided
  let foirPercentage = customFoir;
  if (foirPercentage === null) {
    if (income < 30000) foirPercentage = 0.40;
    else if (income < 75000) foirPercentage = 0.50;
    else if (income < 150000) foirPercentage = 0.60;
    else foirPercentage = 0.65;
  }

  const maxAllowedMonthlyEmi = income * foirPercentage;
  const availableEmiCapacity = Math.max(0, maxAllowedMonthlyEmi - currentEmi);

  // Derive maximum principal from available monthly EMI capacity
  // P = E * ((1 + r)^n - 1) / (r * (1 + r)^n)
  let maxLoanAmount = 0;
  if (availableEmiCapacity > 0) {
    const monthlyRate = rate / 12 / 100;
    const factor = Math.pow(1 + monthlyRate, tenureMonths);
    maxLoanAmount = (availableEmiCapacity * (factor - 1)) / (monthlyRate * factor);
  }

  maxLoanAmount = Math.round(maxLoanAmount / 10000) * 10000; // Round to nearest 10k

  return {
    monthlyIncome: income,
    existingEmi: currentEmi,
    foirPercentage: +(foirPercentage * 100).toFixed(0),
    maxAllowedMonthlyEmi: Math.round(maxAllowedMonthlyEmi),
    availableEmiCapacity: Math.round(availableEmiCapacity),
    maxEligibleLoanAmount: maxLoanAmount,
    assumedTenureYears: Number(tenureYears),
    assumedInterestRate: rate,
    estimatedMonthlyEmiForMaxLoan: calculateEMI(maxLoanAmount, rate, tenureMonths),
  };
}

/**
 * Generate unique Khushal Finance reference number: e.g. KF2026849301
 */
export function generateRefNumber() {
  const prefix = 'KF';
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${year}${random}`;
}

/**
 * Compare multiple loan tenures for decision making
 */
export function compareLoanTenures(principal, annualRate, tenures = [5, 10, 15, 20, 25, 30]) {
  return tenures.map((tenureYears) => {
    const months = tenureYears * 12;
    const emi = calculateEMI(principal, annualRate, months);
    const totalPayable = emi * months;
    const totalInterest = totalPayable - principal;

    return {
      tenureYears,
      tenureMonths: months,
      monthlyEmi: emi,
      totalInterest: Math.max(0, totalInterest),
      totalPayable: Math.max(principal, totalPayable),
    };
  });
}
