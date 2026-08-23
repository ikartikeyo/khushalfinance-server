import mongoose from 'mongoose';

const loanProductSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: 'Home',
    },
    tagline: {
      type: String,
      trim: true,
    },
    interestRate: {
      type: Number,
      required: true,
    },
    minAmount: {
      type: Number,
      default: 50000,
    },
    maxAmount: {
      type: Number,
      required: true,
    },
    maxAmountLabel: {
      type: String,
      required: true,
    },
    minTenure: {
      type: Number,
      default: 1,
    },
    maxTenure: {
      type: Number,
      default: 30,
    },
    tenureLabel: {
      type: String,
      required: true,
    },
    processingFee: {
      type: String,
      default: '0.5%',
    },
    color: {
      type: String,
      default: 'blue',
    },
    features: {
      type: [String],
      default: [],
    },
    eligibility: {
      type: String,
    },
    documents: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const LoanProduct = mongoose.model('LoanProduct', loanProductSchema);
export default LoanProduct;
