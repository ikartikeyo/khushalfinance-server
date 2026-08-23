import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema(
  {
    fromStatus: { type: String, default: 'INITIAL' },
    toStatus: { type: String, required: true },
    remarks: { type: String },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedByName: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const enquirySchema = new mongoose.Schema(
  {
    refNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    // Step 1: Personal Info
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dob: { type: String, required: true },
    gender: { type: String, required: true, enum: ['male', 'female', 'other'] },
    pan: { type: String, required: true, trim: true, uppercase: true },
    mobile: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    employmentType: {
      type: String,
      required: true,
      enum: ['Salaried', 'Self-Employed', 'Business Owner'],
    },

    // Step 2: Loan Details
    loanType: { type: String, required: true, index: true },
    loanAmount: { type: Number, required: true },
    tenure: { type: Number, required: true },
    purpose: { type: String, required: true },
    address: { type: String, required: true },

    // Step 3: Financial Info
    monthlyIncome: { type: Number, required: true },
    existingEmi: { type: Number, default: 0 },
    cibilScore: { type: String, required: true },
    employer: { type: String, required: true },
    experience: { type: String, required: true },
    consent: { type: Boolean, default: true },

    // Processing & Underwriting
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'UNDER_REVIEW',
        'DOCUMENT_VERIFICATION',
        'IN_PRINCIPLE_APPROVED',
        'APPROVED',
        'REJECTED',
        'DISBURSED',
      ],
      default: 'SUBMITTED',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL',
    },
    riskScore: { type: Number },
    riskCategory: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] },
    foir: { type: Number },
    calculatedEmi: { type: Number },
    eligibleMaxAmount: { type: Number },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    internalRemarks: { type: String },
    rejectionReason: { type: String },

    approvedAmount: { type: Number },
    approvedRate: { type: Number },
    approvedTenure: { type: Number },

    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Virtual for full name
enquirySchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

export const Enquiry = mongoose.model('Enquiry', enquirySchema);
export default Enquiry;
