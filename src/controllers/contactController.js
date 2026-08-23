import ContactEnquiry from '../models/ContactEnquiry.js';
import { notifyContactEnquiry } from '../services/notificationService.js';

/**
 * Submit Quick Contact Enquiry
 */
export async function createContact(req, res, next) {
  try {
    const { fullName, mobile, email, loanType, loanAmount, tenure, address } = req.body;

    const contact = await ContactEnquiry.create({
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      email: email ? email.trim().toLowerCase() : null,
      loanType: loanType || null,
      loanAmount: loanAmount ? Number(loanAmount) : null,
      tenure: tenure ? Number(tenure) : null,
      address: address ? address.trim() : null,
      status: 'NEW',
    });

    // Notify customer & admin in background
    notifyContactEnquiry(contact).catch((err) =>
      console.error('Quick enquiry email notification failed:', err.message)
    );

    res.status(201).json({
      success: true,
      message: 'Thank you! Your enquiry has been received. Our team will contact you shortly.',
      data: contact,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List Contact Enquiries (Staff/Admin)
 */
export async function getContacts(req, res, next) {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (search) {
      const q = search.trim();
      filter.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { mobile: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { loanType: { $regex: q, $options: 'i' } },
      ];
    }

    const [total, contacts] = await Promise.all([
      ContactEnquiry.countDocuments(filter),
      ContactEnquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(take),
    ]);

    res.json({
      success: true,
      data: contacts,
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
 * Update Contact Enquiry Status or Follow-up Notes
 */
export async function updateContactStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const updated = await ContactEnquiry.findByIdAndUpdate(
      id,
      {
        ...(status && { status }),
        ...(notes && { notes }),
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Contact enquiry updated',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete Contact Enquiry
 */
export async function deleteContact(req, res, next) {
  try {
    const { id } = req.params;
    await ContactEnquiry.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Contact enquiry deleted',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk Delete Contact Enquiries
 */
export async function bulkDeleteContacts(req, res, next) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No contact enquiry IDs provided for bulk deletion.',
      });
    }

    const result = await ContactEnquiry.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} contact enquiries.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
}

