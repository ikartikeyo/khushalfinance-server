import { body, validationResult } from 'express-validator';

/**
 * Common middleware to evaluate validation results
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check your inputs.',
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
}

/**
 * Validation rules for Loan Enquiry Form (Multi-Step matching frontend)
 */
export const validateEnquiry = [
  // Step 1: Personal Info
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('dob')
    .notEmpty()
    .withMessage('Date of birth is required')
    .custom((value) => {
      const dob = new Date(value);
      if (isNaN(dob.getTime())) {
        throw new Error('Please enter a valid date of birth');
      }
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 21) {
        throw new Error('Applicant must be at least 21 years old to apply for a loan');
      }
      return true;
    }),
  body('gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('pan')
    .trim()
    .toUpperCase()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Valid 10-character PAN is required (e.g. ABCDE1234F)'),
  body('mobile')
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Valid 10-digit Indian mobile number is required'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required'),
  body('employmentType')
    .notEmpty()
    .withMessage('Employment type is required')
    .isIn(['Salaried', 'Self-Employed', 'Business Owner'])
    .withMessage('Invalid employment type'),

  // Step 2: Loan Details
  body('loanType')
    .notEmpty()
    .withMessage('Loan type is required'),
  body('loanAmount')
    .isNumeric()
    .withMessage('Loan amount must be a number')
    .custom((val) => val >= 10000 && val <= 100000000)
    .withMessage('Loan amount must be between ₹10,000 and ₹10 Crore'),
  body('tenure')
    .isInt({ min: 1, max: 30 })
    .withMessage('Tenure must be between 1 and 30 years'),
  body('purpose')
    .trim()
    .notEmpty()
    .withMessage('Purpose of loan is required')
    .isLength({ min: 5 })
    .withMessage('Purpose must be at least 5 characters'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Residential address is required'),

  // Step 3: Financial Info
  body('monthlyIncome')
    .isNumeric()
    .withMessage('Monthly income must be a number')
    .custom((val) => val >= 10000)
    .withMessage('Monthly income must be at least ₹10,000'),
  body('existingEmi')
    .optional()
    .isNumeric()
    .withMessage('Existing EMI must be a number'),
  body('cibilScore')
    .notEmpty()
    .withMessage('CIBIL score tier is required'),
  body('employer')
    .trim()
    .notEmpty()
    .withMessage('Employer / Company name is required'),
  body('experience')
    .notEmpty()
    .withMessage('Work experience is required'),
  body('consent')
    .custom((val) => val === true || val === 'true')
    .withMessage('You must agree to credit retrieval and terms'),

  handleValidationErrors,
];

/**
 * Validation rules for Contact / Quick Enquiry
 */
export const validateContact = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('mobile')
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Valid 10-digit Indian mobile number is required'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Valid email format is required'),
  body('loanAmount')
    .optional({ checkFalsy: true })
    .isNumeric()
    .withMessage('Loan amount must be a number'),
  body('tenure')
    .optional({ checkFalsy: true })
    .isNumeric()
    .withMessage('Tenure must be a number'),
  handleValidationErrors,
];

/**
 * Validation rules for Auth Login
 */
export const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Username or email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

/**
 * Validation rules for Registering Staff
 */
export const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'LOAN_OFFICER', 'UNDERWRITER', 'VIEWER'])
    .withMessage('Invalid role'),
  handleValidationErrors,
];

/**
 * Validation rules for Status Updates
 */
export const validateStatusUpdate = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn([
      'SUBMITTED',
      'UNDER_REVIEW',
      'DOCUMENT_VERIFICATION',
      'IN_PRINCIPLE_APPROVED',
      'APPROVED',
      'REJECTED',
      'DISBURSED',
    ])
    .withMessage('Invalid status code'),
  body('remarks')
    .optional()
    .trim(),
  handleValidationErrors,
];

/**
 * Validation rules for EMI and Eligibility Calculator Endpoints
 */
export const validateEmiCalculation = [
  body('principal')
    .isNumeric()
    .withMessage('Principal must be a positive number')
    .custom((v) => v > 0)
    .withMessage('Principal must be greater than 0'),
  body('rate')
    .isNumeric()
    .withMessage('Interest rate must be a number')
    .custom((v) => v > 0)
    .withMessage('Rate must be greater than 0'),
  body('tenureYears')
    .optional()
    .isNumeric()
    .withMessage('Tenure years must be a number'),
  body('tenureMonths')
    .optional()
    .isNumeric()
    .withMessage('Tenure months must be a number'),
  handleValidationErrors,
];

export const validateEligibility = [
  body('monthlyIncome')
    .isNumeric()
    .withMessage('Monthly income must be a positive number')
    .custom((v) => v > 0)
    .withMessage('Monthly income must be greater than 0'),
  body('existingEmi')
    .optional()
    .isNumeric()
    .withMessage('Existing EMI must be a number'),
  body('tenureYears')
    .optional()
    .isNumeric()
    .withMessage('Tenure years must be a number'),
  body('annualRate')
    .optional()
    .isNumeric()
    .withMessage('Annual interest rate must be a number'),
  handleValidationErrors,
];
