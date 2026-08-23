import Enquiry from '../models/Enquiry.js';
import ContactEnquiry from '../models/ContactEnquiry.js';

/**
 * Get Dashboard KPIs and Summary Statistics
 */
export async function getDashboardStats(req, res, next) {
  try {
    const [
      totalEnquiries,
      submittedCount,
      underReviewCount,
      approvedCount,
      rejectedCount,
      disbursedCount,
      totalContacts,
      newContacts,
      amountAggregate,
      approvedAggregate,
    ] = await Promise.all([
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: 'SUBMITTED' }),
      Enquiry.countDocuments({ status: 'UNDER_REVIEW' }),
      Enquiry.countDocuments({ status: 'APPROVED' }),
      Enquiry.countDocuments({ status: 'REJECTED' }),
      Enquiry.countDocuments({ status: 'DISBURSED' }),
      ContactEnquiry.countDocuments(),
      ContactEnquiry.countDocuments({ status: 'NEW' }),
      Enquiry.aggregate([{ $group: { _id: null, total: { $sum: '$loanAmount' } } }]),
      Enquiry.aggregate([
        { $match: { status: { $in: ['APPROVED', 'DISBURSED'] } } },
        { $group: { _id: null, total: { $sum: '$approvedAmount' } } },
      ]),
    ]);

    const pendingReview = submittedCount + underReviewCount;
    const approvalRate = totalEnquiries > 0
      ? +((approvedCount + disbursedCount) / totalEnquiries * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        totalEnquiries,
        pendingReview,
        approvedCount,
        rejectedCount,
        disbursedCount,
        totalContacts,
        newContacts,
        approvalRate,
        totalRequestedAmount: amountAggregate[0]?.total || 0,
        totalApprovedAmount: approvedAggregate[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Analytics Distribution and Trend Charts
 */
export async function getDashboardAnalytics(req, res, next) {
  try {
    const allEnquiries = await Enquiry.find().select(
      'loanType cibilScore riskCategory status loanAmount createdAt'
    );

    // 1. Distribution by Loan Type
    const loanTypeCounts = {};
    allEnquiries.forEach((e) => {
      loanTypeCounts[e.loanType] = (loanTypeCounts[e.loanType] || 0) + 1;
    });

    // 2. Distribution by Status
    const statusCounts = {};
    allEnquiries.forEach((e) => {
      statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
    });

    // 3. Distribution by CIBIL Score
    const cibilCounts = {};
    allEnquiries.forEach((e) => {
      cibilCounts[e.cibilScore] = (cibilCounts[e.cibilScore] || 0) + 1;
    });

    // 4. Distribution by Risk Category
    const riskCounts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    allEnquiries.forEach((e) => {
      if (e.riskCategory && riskCounts[e.riskCategory] !== undefined) {
        riskCounts[e.riskCategory]++;
      }
    });

    // 5. Recent 5 Applications
    const recentApplications = await Enquiry.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('refNumber firstName lastName loanType loanAmount status riskCategory createdAt');

    res.json({
      success: true,
      data: {
        byLoanType: Object.entries(loanTypeCounts).map(([type, count]) => ({ type, count })),
        byStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
        byCibil: Object.entries(cibilCounts).map(([score, count]) => ({ score, count })),
        byRisk: Object.entries(riskCounts).map(([category, count]) => ({ category, count })),
        recentApplications,
      },
    });
  } catch (error) {
    next(error);
  }
}
