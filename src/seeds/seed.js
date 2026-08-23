import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import User from '../models/User.js';
import LoanProduct from '../models/LoanProduct.js';
import Enquiry from '../models/Enquiry.js';
import ContactEnquiry from '../models/ContactEnquiry.js';
import AuditLog from '../models/AuditLog.js';

async function seed() {
  try {
    console.log('🌱 Connecting to MongoDB for seeding...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');

    // 1. Clean existing records
    await AuditLog.deleteMany();
    await Enquiry.deleteMany();
    await ContactEnquiry.deleteMany();
    await LoanProduct.deleteMany();
    await User.deleteMany();

    // 2. Create Single Admin User
    const adminPassword = await bcrypt.hash('Xeroxme123', 10);

    const adminUser = await User.create({
      name: 'Khushal Finance Admin',
      email: 'khushalfinance12@gmail.com',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+91 95795 70773',
      isActive: true,
    });

    console.log(`👤 Seeded Single Admin Account: ${adminUser.email} (Password: Xeroxme123)`);

    // 3. Seed Master Loan Products
    const loanProducts = [
      {
        slug: 'home',
        type: 'Home Loan',
        icon: 'Home',
        tagline: 'Turn your dream home into reality',
        interestRate: 8.5,
        minAmount: 500000,
        maxAmount: 50000000,
        maxAmountLabel: '₹5 Crore',
        minTenure: 1,
        maxTenure: 30,
        tenureLabel: '30 Years',
        processingFee: '0.5%',
        color: 'blue',
        features: [
          'Balance Transfer available',
          'No prepayment penalty',
          'Doorstep service',
          'Top-up loan facility',
          'Online account management',
        ],
        eligibility: 'Salaried / Self-employed, Age 21–70',
        documents: ['Aadhaar', 'PAN', 'Income proof', 'Property documents'],
      },
      {
        slug: 'car',
        type: 'Car Loan',
        icon: 'Car',
        tagline: 'Drive home your dream car today',
        interestRate: 7.99,
        minAmount: 100000,
        maxAmount: 7500000,
        maxAmountLabel: '₹75 Lakh',
        minTenure: 1,
        maxTenure: 7,
        tenureLabel: '7 Years',
        processingFee: '1%',
        color: 'purple',
        features: [
          'Up to 100% on-road financing',
          'New & used cars',
          '24-hour approval',
          'Flexible EMI options',
          'Insurance bundling',
        ],
        eligibility: 'Salaried / Self-employed, Age 21–65',
        documents: ['Aadhaar', 'PAN', 'Income proof', 'Quotation'],
      },
      {
        slug: 'personal',
        type: 'Personal Loan',
        icon: 'User',
        tagline: 'Instant funds for every need',
        interestRate: 10.99,
        minAmount: 50000,
        maxAmount: 4000000,
        maxAmountLabel: '₹40 Lakh',
        minTenure: 1,
        maxTenure: 5,
        tenureLabel: '5 Years',
        processingFee: '2%',
        color: 'emerald',
        features: [
          'Paperless digital process',
          'No collateral required',
          'Disbursal in 24 hours',
          'Flexible repayment',
          'Part-payment allowed',
        ],
        eligibility: 'Salaried, Age 21–60, Min ₹25,000/month income',
        documents: ['Aadhaar', 'PAN', 'Salary slips', 'Bank statement'],
      },
      {
        slug: 'business',
        type: 'Business Loan',
        icon: 'Briefcase',
        tagline: 'Fuel your business ambitions',
        interestRate: 11.5,
        minAmount: 200000,
        maxAmount: 20000000,
        maxAmountLabel: '₹2 Crore',
        minTenure: 1,
        maxTenure: 10,
        tenureLabel: '10 Years',
        processingFee: '1.5%',
        color: 'orange',
        features: [
          'Collateral-free up to ₹50L',
          'MSME priority processing',
          'Overdraft facility',
          'Working capital loans',
          'Machinery finance',
        ],
        eligibility: 'Business age ≥ 2 years, ITR filing required',
        documents: ['Aadhaar', 'PAN', 'GST certificate', 'ITR 2 years', 'Bank statement'],
      },
      {
        slug: 'education',
        type: 'Education Loan',
        icon: 'GraduationCap',
        tagline: 'Invest in your brightest future',
        interestRate: 9.5,
        minAmount: 100000,
        maxAmount: 15000000,
        maxAmountLabel: '₹1.5 Crore',
        minTenure: 1,
        maxTenure: 15,
        tenureLabel: '15 Years',
        processingFee: '0%',
        color: 'cyan',
        features: [
          'Zero processing fee',
          'Moratorium period available',
          'Covers tuition + living costs',
          'Abroad education covered',
          'Tax benefit under 80E',
        ],
        eligibility: 'Indian student, admission confirmed, co-applicant parent',
        documents: ['Aadhaar', 'PAN', 'Admission letter', 'Mark sheets', 'Co-applicant docs'],
      },
    ];

    await LoanProduct.insertMany(loanProducts);
    console.log(`📦 Seeded ${loanProducts.length} loan products.`);

    // 4. Seed Detailed Sample Loan Enquiries
    const sampleEnquiries = [
      {
        refNumber: 'KF2026100101',
        firstName: 'Rajesh',
        lastName: 'Kumar',
        dob: '1990-05-15',
        gender: 'male',
        pan: 'ABCDE1234F',
        mobile: '9876543210',
        email: 'rajesh.kumar@example.com',
        employmentType: 'Salaried',
        loanType: 'Home Loan',
        loanAmount: 4500000,
        tenure: 20,
        purpose: 'Purchasing 3BHK flat in Kochi',
        address: 'Flat 4B, Silver Heights, Kakkanad, Kochi, Kerala - 682030',
        monthlyIncome: 95000,
        existingEmi: 12000,
        cibilScore: '750+',
        employer: 'Infosys Ltd',
        experience: '5+ Years',
        consent: true,
        status: 'APPROVED',
        priority: 'HIGH',
        riskScore: 85,
        riskCategory: 'LOW',
        foir: 45.2,
        calculatedEmi: 39049,
        approvedAmount: 4500000,
        approvedRate: 8.5,
        approvedTenure: 20,
        internalRemarks: 'Strong credit history, high stability profile.',
        statusHistory: [
          { fromStatus: 'DOCUMENT_VERIFICATION', toStatus: 'APPROVED', remarks: 'Sanction approved at 8.5% p.a.', changedByName: 'Admin' },
          { fromStatus: 'UNDER_REVIEW', toStatus: 'DOCUMENT_VERIFICATION', remarks: 'Application data verified', changedByName: 'Admin' },
          { fromStatus: 'SUBMITTED', toStatus: 'UNDER_REVIEW', remarks: 'Moved to review queue', changedByName: 'Admin' },
          { fromStatus: 'INITIAL', toStatus: 'SUBMITTED', remarks: 'Submitted via web enquiry portal' },
        ],
      },
      {
        refNumber: 'KF2026100102',
        firstName: 'Ananya',
        lastName: 'Iyer',
        dob: '1994-08-22',
        gender: 'female',
        pan: 'BNMPI9876G',
        mobile: '9845012345',
        email: 'ananya.iyer@example.com',
        employmentType: 'Salaried',
        loanType: 'Car Loan',
        loanAmount: 1200000,
        tenure: 5,
        purpose: 'Electric Vehicle Purchase (Tata Nexon EV)',
        address: '12/4, Anna Nagar 2nd Street, Chennai - 600040',
        monthlyIncome: 65000,
        existingEmi: 0,
        cibilScore: '700-750',
        employer: 'Tata Consultancy Services',
        experience: '3–5 Years',
        consent: true,
        status: 'IN_PRINCIPLE_APPROVED',
        priority: 'NORMAL',
        riskScore: 78,
        riskCategory: 'LOW',
        foir: 37.4,
        calculatedEmi: 24328,
        internalRemarks: 'Car dealer quote matched with eligible income.',
        statusHistory: [
          { fromStatus: 'SUBMITTED', toStatus: 'IN_PRINCIPLE_APPROVED', remarks: 'Pre-approved in principle', changedByName: 'Admin' },
          { fromStatus: 'INITIAL', toStatus: 'SUBMITTED', remarks: 'Submitted via web portal' },
        ],
      },
      {
        refNumber: 'KF2026100103',
        firstName: 'Suresh',
        lastName: 'Menon',
        dob: '1982-11-10',
        gender: 'male',
        pan: 'PQRSK4567L',
        mobile: '9447123456',
        email: 'suresh.menon@example.com',
        employmentType: 'Business Owner',
        loanType: 'Business Loan',
        loanAmount: 2500000,
        tenure: 7,
        purpose: 'Working capital and retail store expansion',
        address: '34, Commercial Street, Kozhikode, Kerala - 673001',
        monthlyIncome: 140000,
        existingEmi: 25000,
        cibilScore: '650-700',
        employer: 'Menon Traders & Spices',
        experience: '5+ Years',
        consent: true,
        status: 'UNDER_REVIEW',
        priority: 'NORMAL',
        riskScore: 65,
        riskCategory: 'MEDIUM',
        foir: 48.0,
        calculatedEmi: 43419,
        internalRemarks: 'Checked business turnover details.',
        statusHistory: [
          { fromStatus: 'SUBMITTED', toStatus: 'UNDER_REVIEW', remarks: 'Underwriting verification in progress', changedByName: 'Admin' },
          { fromStatus: 'INITIAL', toStatus: 'SUBMITTED', remarks: 'Submitted via web portal' },
        ],
      },
    ];

    await Enquiry.insertMany(sampleEnquiries);
    console.log(`📋 Seeded ${sampleEnquiries.length} detailed loan applications.`);

    // 5. Seed Quick Contacts
    const sampleContacts = [
      {
        fullName: 'Priya Nambiar',
        mobile: '9847112233',
        email: 'priya.nambiar@example.com',
        loanType: 'Personal Loan',
        loanAmount: 500000,
        tenure: 3,
        address: 'Edappally, Kochi',
        status: 'NEW',
        notes: 'Customer looking for emergency medical funds.',
      },
      {
        fullName: 'Vikram Patel',
        mobile: '9822334455',
        email: 'vikram.patel@example.com',
        loanType: 'Home Loan',
        loanAmount: 7500000,
        tenure: 25,
        address: 'Trivandrum',
        status: 'CONTACTED',
        notes: 'Called customer; discussed rate options.',
      },
    ];

    await ContactEnquiry.insertMany(sampleContacts);
    console.log(`📞 Seeded ${sampleContacts.length} quick contact enquiries.`);

    console.log('\n🎉 MongoDB database seeded successfully for single admin user!');
  } catch (error) {
    console.error('❌ MongoDB Seeding Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
