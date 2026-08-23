import Enquiry from '../models/Enquiry.js';
import AuditLog from '../models/AuditLog.js';
import { generateRefNumber, calculateEMI } from '../services/financeService.js';
import { assessLoanRisk } from '../services/riskService.js';
import { notifyApplicationReceived, notifyStatusChange } from '../services/notificationService.js';

/**
 * Submit New Loan Application (Public Endpoint)
 */
export async function createEnquiry(req, res, next) {
  try {
    const data = req.body;
    const refNumber = generateRefNumber();

    // Automated risk assessment & calculation
    const riskAssessment = assessLoanRisk(data);
    const loanAmount = Number(data.loanAmount);
    const tenureYears = Number(data.tenure);
    const calculatedEmi = calculateEMI(loanAmount, 9.5, tenureYears * 12);

    const enquiry = await Enquiry.create({
      refNumber,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      dob: data.dob,
      gender: data.gender,
      pan: data.pan.trim().toUpperCase(),
      mobile: data.mobile.trim(),
      email: data.email.trim().toLowerCase(),
      employmentType: data.employmentType,

      loanType: data.loanType,
      loanAmount,
      tenure: tenureYears,
      purpose: data.purpose.trim(),
      address: data.address.trim(),

      monthlyIncome: Number(data.monthlyIncome),
      existingEmi: Number(data.existingEmi) || 0,
      cibilScore: data.cibilScore,
      employer: data.employer.trim(),
      experience: data.experience,
      consent: Boolean(data.consent),

      status: 'SUBMITTED',
      priority: riskAssessment.priority,
      riskScore: riskAssessment.riskScore,
      riskCategory: riskAssessment.riskCategory,
      foir: riskAssessment.foir,
      calculatedEmi,

      statusHistory: [
        {
          fromStatus: 'INITIAL',
          toStatus: 'SUBMITTED',
          remarks: `Application submitted via web portal. Automated Risk Category: ${riskAssessment.riskCategory}`,
          createdAt: new Date(),
        },
      ],
    });

    // Send acknowledgment email in background
    notifyApplicationReceived(enquiry).catch((err) =>
      console.error('Notification dispatch failed:', err.message)
    );

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully!',
      refNumber: enquiry.refNumber,
      enquiryId: enquiry._id,
      data: {
        refNumber: enquiry.refNumber,
        loanType: enquiry.loanType,
        loanAmount: enquiry.loanAmount,
        status: enquiry.status,
        calculatedEmi: enquiry.calculatedEmi,
        createdAt: enquiry.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List Enquiries with Pagination, Search, and Filters (Staff/Admin)
 */
export async function getEnquiries(req, res, next) {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      loanType,
      cibilScore,
      search,
      priority,
      assignedToId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (loanType && loanType !== 'ALL') {
      filter.loanType = { $regex: loanType, $options: 'i' };
    }

    if (cibilScore && cibilScore !== 'ALL') {
      filter.cibilScore = cibilScore;
    }

    if (priority && priority !== 'ALL') {
      filter.priority = priority;
    }

    if (assignedToId) {
      filter.assignedTo = assignedToId;
    }

    if (search) {
      const q = search.trim();
      filter.$or = [
        { refNumber: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { mobile: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { pan: { $regex: q, $options: 'i' } },
      ];
    }

    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [total, enquiries] = await Promise.all([
      Enquiry.countDocuments(filter),
      Enquiry.find(filter)
        .populate('assignedTo', 'name email role phone')
        .sort(sortOption)
        .skip(skip)
        .limit(take),
    ]);

    res.json({
      success: true,
      data: enquiries,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Enquiry Details by ID or Reference Number
 */
export async function getEnquiryByIdOrRef(req, res, next) {
  try {
    const { identifier } = req.params;

    const query = identifier.startsWith('KF') || identifier.startsWith('JB')
      ? { refNumber: identifier.toUpperCase() }
      : { _id: identifier };

    const enquiry = await Enquiry.findOne(query).populate('assignedTo', 'name email phone role');

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: `Application not found for identifier: ${identifier}`,
      });
    }

    res.json({
      success: true,
      enquiry,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Public Application Tracking Endpoint
 */
export async function trackEnquiryPublic(req, res, next) {
  try {
    const { refNumber } = req.params;
    const { mobile } = req.query;

    const filter = { refNumber: refNumber.trim().toUpperCase() };
    if (mobile) {
      filter.mobile = { $regex: `${mobile.trim()}$` };
    }

    const enquiry = await Enquiry.findOne(filter).select(
      'refNumber firstName lastName loanType loanAmount tenure status calculatedEmi createdAt updatedAt statusHistory'
    );

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'No loan application found with this reference number. Please verify and try again.',
      });
    }

    res.json({
      success: true,
      tracking: enquiry,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Enquiry Status (Staff/Admin)
 */
export async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, remarks, approvedAmount, approvedRate, approvedTenure, rejectionReason } = req.body;

    const existing = await Enquiry.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const fromStatus = existing.status;

    existing.status = status;
    if (remarks) existing.internalRemarks = remarks;
    if (rejectionReason) existing.rejectionReason = rejectionReason;
    if (approvedAmount) existing.approvedAmount = Number(approvedAmount);
    if (approvedRate) existing.approvedRate = Number(approvedRate);
    if (approvedTenure) existing.approvedTenure = Number(approvedTenure);

    existing.statusHistory.unshift({
      fromStatus,
      toStatus: status,
      remarks: remarks || `Status updated from ${fromStatus} to ${status}`,
      changedBy: req.user?._id || null,
      changedByName: req.user?.name || 'Staff',
      createdAt: new Date(),
    });

    const updated = await existing.save();

    // Notify customer
    notifyStatusChange(updated, status, remarks).catch((e) =>
      console.error('Status notification failed:', e.message)
    );

    // Audit log
    await AuditLog.create({
      userId: req.user?._id,
      action: 'STATUS_UPDATE',
      resource: 'ENQUIRY',
      resourceId: id,
      details: { fromStatus, toStatus: status, remarks },
      ipAddress: req.ip,
    }).catch((e) => console.error('Audit log failed:', e.message));

    res.json({
      success: true,
      message: `Application status updated to ${status}`,
      enquiry: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Assign Enquiry to Staff Member
 */
export async function assignOfficer(req, res, next) {
  try {
    const { id } = req.params;
    const { assignedToId } = req.body;

    const updated = await Enquiry.findByIdAndUpdate(
      id,
      { assignedTo: assignedToId },
      { new: true }
    ).populate('assignedTo', 'name email role');

    res.json({
      success: true,
      message: 'Enquiry assigned successfully',
      enquiry: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Add Internal Notes/Remarks
 */
export async function addNotes(req, res, next) {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    const timestamp = new Date().toLocaleString('en-IN');
    const author = req.user ? req.user.name : 'Officer';
    const appendedNote = enquiry.internalRemarks
      ? `${enquiry.internalRemarks}\n\n[${timestamp} - ${author}]: ${note}`
      : `[${timestamp} - ${author}]: ${note}`;

    enquiry.internalRemarks = appendedNote;
    await enquiry.save();

    res.json({
      success: true,
      message: 'Note added successfully',
      internalRemarks: enquiry.internalRemarks,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Export Enquiries to CSV
 */
export async function exportCsv(req, res, next) {
  try {
    const enquiries = await Enquiry.find().populate('assignedTo', 'name').sort({ createdAt: -1 });

    const headers = [
      'Reference Number',
      'First Name',
      'Last Name',
      'Mobile',
      'Email',
      'PAN',
      'Loan Type',
      'Loan Amount',
      'Tenure (Years)',
      'Monthly Income',
      'CIBIL Score',
      'Employment Type',
      'Status',
      'Priority',
      'Risk Category',
      'Assigned Officer',
      'Created At',
    ];

    const rows = enquiries.map((e) => [
      e.refNumber,
      `"${e.firstName}"`,
      `"${e.lastName}"`,
      e.mobile,
      e.email,
      e.pan,
      `"${e.loanType}"`,
      e.loanAmount,
      e.tenure,
      e.monthlyIncome,
      e.cibilScore,
      `"${e.employmentType}"`,
      e.status,
      e.priority,
      e.riskCategory || 'N/A',
      `"${e.assignedTo?.name || 'Unassigned'}"`,
      new Date(e.createdAt).toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=khushal-enquiries-${Date.now()}.csv`
    );
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete Single Enquiry
 */
export async function deleteEnquiry(req, res, next) {
  try {
    const { id } = req.params;
    await Enquiry.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Enquiry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk Delete Enquiries (Admin)
 */
export async function bulkDeleteEnquiries(req, res, next) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No enquiry IDs provided for deletion',
      });
    }

    const result = await Enquiry.deleteMany({
      _id: { $in: ids },
    });

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} enquiry records`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
}
