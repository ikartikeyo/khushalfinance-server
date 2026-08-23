import { calculateEMI } from './financeService.js';

/**
 * Perform automated risk assessment and underwriting scoring
 * @param {Object} data - Application data
 * @returns {Object} Risk assessment metrics
 */
export function assessLoanRisk(data) {
  let score = 50; // Base score
  const flags = [];

  const income = Number(data.monthlyIncome) || 0;
  const existingEmi = Number(data.existingEmi) || 0;
  const loanAmount = Number(data.loanAmount) || 0;
  const tenureYears = Number(data.tenure) || 5;
  const estimatedNewEmi = calculateEMI(loanAmount, 10.5, tenureYears * 12);

  // 1. CIBIL Score Evaluation (Weight: 35)
  switch (data.cibilScore) {
    case '750+':
      score += 35;
      break;
    case '700-750':
      score += 25;
      break;
    case '650-700':
      score += 10;
      break;
    case '600-650':
      score -= 10;
      flags.push('Average credit score');
      break;
    case '<600':
      score -= 25;
      flags.push('High credit risk (CIBIL below 600)');
      break;
    case 'NA':
    default:
      score += 5;
      flags.push('New to credit (No prior credit history)');
      break;
  }

  // 2. Fixed Obligation to Income Ratio (FOIR) (Weight: 25)
  const totalEmi = existingEmi + estimatedNewEmi;
  const foir = income > 0 ? (totalEmi / income) * 100 : 100;

  if (foir <= 35) {
    score += 15;
  } else if (foir <= 50) {
    score += 5;
  } else if (foir <= 65) {
    score -= 10;
    flags.push('Elevated debt obligation ratio');
  } else {
    score -= 25;
    flags.push('Critical debt burden (FOIR > 65%)');
  }

  // 3. Employment & Experience (Weight: 15)
  if (data.employmentType === 'Salaried') {
    score += 10;
  } else if (data.employmentType === 'Business Owner' || data.employmentType === 'Self-Employed') {
    score += 5;
  }

  if (data.experience === '5+ Years') {
    score += 5;
  } else if (data.experience === '< 1 Year') {
    score -= 5;
    flags.push('Work experience less than 1 year');
  }

  // Clamp score between 0 and 100
  const finalScore = Math.max(5, Math.min(100, Math.round(score)));

  let riskCategory = 'MEDIUM';
  let priority = 'NORMAL';
  let recommendation = 'Manual Underwriter Review';

  if (finalScore >= 75) {
    riskCategory = 'LOW';
    priority = 'HIGH';
    recommendation = 'Eligible for Fast-Track Pre-Approval';
  } else if (finalScore <= 40) {
    riskCategory = 'HIGH';
    priority = 'URGENT';
    recommendation = 'Requires Additional Collateral or Co-Applicant Verification';
  }

  return {
    riskScore: finalScore,
    riskCategory,
    priority,
    foir: +foir.toFixed(1),
    estimatedEmi: estimatedNewEmi,
    recommendation,
    flags,
  };
}
