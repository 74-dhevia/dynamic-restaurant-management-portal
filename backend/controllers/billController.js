import Bill from '../models/Bill.js';

/**
 * @desc    Get bills of logged-in user
 * @route   GET /api/bills/my-bills
 * @access  Private
 */
export const getMyBills = async (req, res) => {
  try {
    const bills = await Bill.find({ customerId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: bills.length,
      data: bills,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bills',
      error: error.message,
    });
  }
};

/**
 * @desc    Get bill by order ID
 * @route   GET /api/bills/order/:orderId
 * @access  Private
 */
export const getBillByOrder = async (req, res) => {
  try {
    const bill = await Bill.findOne({ orderId: req.params.orderId });
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'No bill found for this order',
      });
    }

    res.status(200).json({
      success: true,
      data: bill,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bill',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single bill by ID
 * @route   GET /api/bills/:id
 * @access  Private
 */
export const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
    }

    res.status(200).json({
      success: true,
      data: bill,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bill details',
      error: error.message,
    });
  }
};

/**
 * @desc    Admin: Get all billing records
 * @route   GET /api/bills
 * @access  Admin
 */
export const getAllBills = async (req, res) => {
  try {
    const bills = await Bill.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: bills.length,
      data: bills,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bills',
      error: error.message,
    });
  }
};

export default {
  getMyBills,
  getBillByOrder,
  getBillById,
  getAllBills,
};
