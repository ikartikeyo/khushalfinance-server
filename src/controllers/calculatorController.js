import {
  calculateEMI,
  generateAmortizationSchedule,
  calculateEligibility,
  compareLoanTenures,
} from '../services/financeService.js';

/**
 * Calculate EMI and Amortization Schedule
 */
export function calculateEmiEndpoint(req, res) {
  const { principal, rate, tenureYears, tenureMonths } = req.body;

  const p = Number(principal);
  const r = Number(rate);
  const months = tenureMonths ? Number(tenureMonths) : Number(tenureYears) * 12;

  const result = generateAmortizationSchedule(p, r, months);

  res.json({
    success: true,
    data: result,
  });
}

/**
 * Calculate Borrowing Eligibility based on Income and FOIR
 */
export function calculateEligibilityEndpoint(req, res) {
  const { monthlyIncome, existingEmi, tenureYears, annualRate, customFoir } = req.body;

  const result = calculateEligibility(
    Number(monthlyIncome),
    Number(existingEmi) || 0,
    Number(tenureYears) || 20,
    Number(annualRate) || 8.5,
    customFoir ? Number(customFoir) / 100 : null
  );

  res.json({
    success: true,
    data: result,
  });
}

/**
 * Compare Multiple Tenures
 */
export function compareLoanTenuresEndpoint(req, res) {
  const { principal, rate, tenures } = req.body;

  const p = Number(principal) || 1000000;
  const r = Number(rate) || 8.5;
  const tList = Array.isArray(tenures) && tenures.length ? tenures : [5, 10, 15, 20, 25, 30];

  const comparisons = compareLoanTenures(p, r, tList);

  res.json({
    success: true,
    data: comparisons,
  });
}
