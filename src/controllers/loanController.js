import LoanProduct from '../models/LoanProduct.js';

/**
 * Get all active loan products
 */
export async function getLoanProducts(req, res, next) {
  try {
    const { all } = req.query;
    const filter = all === 'true' ? {} : { isActive: true };

    const loans = await LoanProduct.find(filter).sort({ interestRate: 1 });

    res.json({
      success: true,
      data: loans,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single loan product by slug or ID
 */
export async function getLoanProductBySlug(req, res, next) {
  try {
    const { identifier } = req.params;

    const loan = await LoanProduct.findOne({
      $or: [{ slug: identifier.toLowerCase() }, { _id: identifier.match(/^[0-9a-fA-F]{24}$/) ? identifier : null }],
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan product not found',
      });
    }

    res.json({
      success: true,
      data: loan,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create new loan product (Admin only)
 */
export async function createLoanProduct(req, res, next) {
  try {
    const loan = await LoanProduct.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Loan product created successfully',
      data: loan,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update loan product details or interest rates (Admin only)
 */
export async function updateLoanProduct(req, res, next) {
  try {
    const { id } = req.params;

    const updated = await LoanProduct.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Loan product updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete / Deactivate Loan Product (Admin only)
 */
export async function deleteLoanProduct(req, res, next) {
  try {
    const { id } = req.params;
    await LoanProduct.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Loan product deleted',
    });
  } catch (error) {
    next(error);
  }
}
