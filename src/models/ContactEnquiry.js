import mongoose from 'mongoose';

const contactEnquirySchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    loanType: { type: String },
    loanAmount: { type: Number },
    tenure: { type: Number },
    address: { type: String },
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'],
      default: 'NEW',
    },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

export const ContactEnquiry = mongoose.model('ContactEnquiry', contactEnquirySchema);
export default ContactEnquiry;
