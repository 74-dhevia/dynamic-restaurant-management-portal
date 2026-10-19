import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Bill from '../models/Bill.js';
import { sendOrderEventEmail } from '../services/emailService.js';
import { createNotification } from '../services/notificationService.js';
import { getBusinessDayBoundaries } from '../utils/dateUtils.js';

/**
 * @desc    Create a new customer order
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod, couponCode, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item',
      });
    }

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
    const deliveryFee = subtotal > 500 ? 0 : 30;
    const tax = Math.round(subtotal * 0.05);
    const discount = req.body.discount ? Number(req.body.discount) : 0;
    const totalAmount = Math.max(0, subtotal + deliveryFee + tax - discount);

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order = await Order.create({
      orderNumber,
      customerId: req.user._id,
      customerName: req.user.name,
      customerPhone: req.user.phone || '',
      customerEmail: req.user.email || '',
      deliveryAddress: deliveryAddress || {
        addressLine: 'Default Address',
        city: 'Kovilpatti',
        pincode: '628501',
      },
      items,
      subtotal,
      deliveryFee,
      tax,
      discount,
      couponCode,
      totalAmount,
      paymentMethod: paymentMethod || 'UPI',
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Completed',
      orderStatus: 'Placed',
      estimatedDeliveryTime: '30-40 mins',
      restaurantId: req.body.restaurantId || items[0]?.restaurantId || '6ac50ca5ea2b67bd7b4a00ed',
      notes,
    });

    // Automatically create a corresponding Bill record
    await Bill.create({
      billNumber: `BILL-${orderNumber}`,
      orderId: order._id,
      customerId: req.user._id,
      customerName: req.user.name,
      paymentMethod: order.paymentMethod,
      subtotal,
      tax,
      discount,
      grandTotal: totalAmount,
      paymentStatus: order.paymentStatus === 'Completed' ? 'Paid' : 'Pending',
    });

    // 1. Dispatch transactional order email
    sendOrderEventEmail({
      to: order.customerEmail || req.user.email,
      name: order.customerName || req.user.name,
      order,
      eventType: 'Placed',
    }).catch((mailErr) => console.warn('Order placed email note:', mailErr.message));

    // 2. Create Admin Notification in MongoDB (Part 1.3 requirement)
    createNotification({
      recipientRole: 'admin',
      title: 'New Order Placed',
      message: `New order #${order.orderNumber} placed by ${order.customerName} (₹${order.totalAmount}).`,
      type: 'order',
      eventType: 'order_placed',
      entityId: order.orderNumber,
      entityType: 'Order',
      actionUrl: `/admin/orders/${order.orderNumber}`,
      metadata: {
        orderNumber: order.orderNumber,
        amount: order.totalAmount,
        status: 'Placed',
        customerName: order.customerName,
        customerEmail: order.customerEmail,
      },
      idempotencyKey: `notif_admin_order_${order.orderNumber}_placed`,
    }).catch((err) => console.warn('Order admin notification note:', err.message));

    // 3. Create Customer Website Notification in MongoDB (Part 1.2 requirement)
    createNotification({
      recipient: order.customerId,
      recipientRole: 'customer',
      title: 'Order Placed Successfully',
      message: `Your order #${order.orderNumber} has been received and confirmed by the restaurant.`,
      type: 'order',
      eventType: 'order_placed',
      entityId: order.orderNumber,
      entityType: 'Order',
      actionUrl: `/orders/${order.orderNumber}`,
      metadata: {
        orderNumber: order.orderNumber,
        amount: order.totalAmount,
        status: 'Placed',
      },
      idempotencyKey: `notif_cust_order_${order.orderNumber}_placed`,
    }).catch((err) => console.warn('Order customer notification note:', err.message));

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to place order',
      error: error.message,
    });
  }
};

/**
 * @desc    Get logged in user orders
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single order details
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    let order;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id);
    } else {
      order = await Order.findOne({ orderNumber: id });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Role check: customer can only view own order
    if (req.user.role === 'customer' && String(order.customerId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to order details',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order details',
      error: error.message,
    });
  }
};

/**
 * @desc    Cancel order
 * @route   PATCH /api/orders/:id/cancel
 * @access  Private
 */
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { orderNumber: id };
    if (req.user.role === 'customer') {
      query.customerId = req.user._id;
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or unauthorized',
      });
    }

    if (['Delivered', 'Cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled as it is already ${order.orderStatus}`,
      });
    }

    order.orderStatus = 'Cancelled';
    order.notes = reason ? `Cancelled reason: ${reason}` : 'Cancelled by customer';
    const wasPaid = order.paymentStatus === 'Completed' || order.paymentStatus === 'Paid';
    if (wasPaid) {
      order.paymentStatus = 'Refunded';
    }
    await order.save();

    // 1. Transactional cancellation email
    sendOrderEventEmail({
      to: order.customerEmail || req.user.email,
      name: order.customerName || req.user.name,
      order,
      eventType: 'Cancelled',
    }).catch((mailErr) => console.warn('Order cancelled email note:', mailErr.message));

    // 2. Admin Notification in MongoDB
    createNotification({
      recipientRole: 'admin',
      title: 'Order Cancelled',
      message: `Order #${order.orderNumber} was cancelled (${reason || 'Customer action'}).`,
      type: 'order',
      eventType: 'order_cancelled',
      entityId: order.orderNumber,
      entityType: 'Order',
      actionUrl: `/admin/orders/${order.orderNumber}`,
      metadata: {
        orderNumber: order.orderNumber,
        amount: order.totalAmount,
        status: 'Cancelled',
        customerName: order.customerName,
      },
      idempotencyKey: `notif_admin_order_${order.orderNumber}_cancelled`,
    }).catch(() => {});

    // 3. Customer Notification in MongoDB
    createNotification({
      recipient: order.customerId,
      recipientRole: 'customer',
      title: 'Order Cancelled',
      message: `Your order #${order.orderNumber} has been cancelled.${wasPaid ? ' A refund has been issued to your payment method.' : ''}`,
      type: 'order',
      eventType: 'order_cancelled',
      entityId: order.orderNumber,
      entityType: 'Order',
      actionUrl: `/orders/${order.orderNumber}`,
      metadata: {
        orderNumber: order.orderNumber,
        amount: order.totalAmount,
        status: 'Cancelled',
      },
      idempotencyKey: `notif_cust_order_${order.orderNumber}_cancelled`,
    }).catch(() => {});

    // 4. If paid and refunded, trigger refund notifications
    if (wasPaid) {
      sendOrderEventEmail({
        to: order.customerEmail || req.user.email,
        name: order.customerName || req.user.name,
        order,
        eventType: 'Refunded',
      }).catch(() => {});

      createNotification({
        recipient: order.customerId,
        recipientRole: 'customer',
        title: 'Order Refund Processed',
        message: `Your refund of ₹${order.totalAmount} for Order #${order.orderNumber} has been completed.`,
        type: 'refund',
        eventType: 'order_refunded',
        entityId: order.orderNumber,
        actionUrl: `/orders/${order.orderNumber}`,
        metadata: { amount: order.totalAmount, orderNumber: order.orderNumber },
        idempotencyKey: `notif_cust_order_${order.orderNumber}_refunded`,
      }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message,
    });
  }
};

/**
 * @desc    Admin / Manager: Get all orders with optional date & status filters
 * @route   GET /api/orders
 * @access  Admin / Manager
 */
export const getAllOrders = async (req, res) => {
  try {
    const filter = {};
    const { date, status, restaurantId } = req.query;

    if (date === 'today') {
      const timeZone = process.env.BUSINESS_TIMEZONE || 'Asia/Kolkata';
      const { startOfToday, startOfTomorrow } = getBusinessDayBoundaries(new Date(), timeZone);
      filter.createdAt = { $gte: startOfToday, $lt: startOfTomorrow };
    }

    if (status && status !== 'all') {
      filter.orderStatus = status;
    }

    if (restaurantId && restaurantId !== 'all') {
      if (mongoose.Types.ObjectId.isValid(restaurantId)) {
        filter.$or = [
          { restaurantId: String(restaurantId) },
          { restaurantId: new mongoose.Types.ObjectId(restaurantId) },
        ];
      } else {
        filter.restaurantId = restaurantId;
      }
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all orders',
      error: error.message,
    });
  }
};

/**
 * @desc    Admin / Chef / Delivery: Update order status
 * @route   PATCH /api/orders/:id/status
 * @access  Admin / Chef / Delivery
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const {
      status,
      deliveryPartner,
      qualityCheck,
      kitchenStatus,
      estimatedPrepMinutes,
      estimatedReadyTime,
      actualReadyTime,
      incident,
    } = req.body;
    const validStatuses = ['Placed', 'Confirmed', 'Preparing', 'Ready', 'OutForDelivery', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values: ${validStatuses.join(', ')}`,
      });
    }

    // Role-based validation if user is a chef
    if (req.user && req.user.role === 'chef') {
      const allowedChefStatuses = ['Preparing', 'Ready'];
      if (!allowedChefStatuses.includes(status)) {
        return res.status(403).json({
          success: false,
          message: 'Chefs are authorized to transition orders to Preparing or Ready stages only.',
        });
      }

      if (status === 'Ready' && (!qualityCheck || !qualityCheck.verified)) {
        return res.status(400).json({
          success: false,
          message: 'Food quality checkpoint verification is mandatory before marking order as Ready.',
        });
      }
    }

    const updateFields = { orderStatus: status };
    if (deliveryPartner) updateFields.deliveryPartner = deliveryPartner;
    if (status === 'Delivered') updateFields.paymentStatus = 'Completed';
    if (status === 'Ready') {
      updateFields.actualReadyTime = actualReadyTime || new Date();
      updateFields.kitchenStatus = 'Ready';
    } else if (status === 'Preparing') {
      updateFields.kitchenStatus = 'Preparing';
    }
    if (kitchenStatus) updateFields.kitchenStatus = kitchenStatus;
    if (qualityCheck) updateFields.qualityCheck = qualityCheck;
    if (estimatedPrepMinutes) updateFields.estimatedPrepMinutes = estimatedPrepMinutes;
    if (estimatedReadyTime) updateFields.estimatedReadyTime = estimatedReadyTime;
    if (incident) updateFields.incident = incident;

    const orderId = req.params.id;
    const query = orderId.match(/^[0-9a-fA-F]{24}$/) ? { _id: orderId } : { orderNumber: orderId };
    const order = await Order.findOneAndUpdate(query, updateFields, { new: true });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // 1. Transactional email for milestones
    const emailEvents = ['Confirmed', 'OutForDelivery', 'Delivered', 'Cancelled'];
    if (emailEvents.includes(status)) {
      sendOrderEventEmail({
        to: order.customerEmail,
        name: order.customerName,
        order,
        eventType: status,
      }).catch((mailErr) => console.warn(`Order ${status} email note:`, mailErr.message));
    }

    // 2. Customer website notifications for each status update (Part 1.2 requirement)
    const statusMessages = {
      Confirmed: `Your order #${order.orderNumber} has been confirmed by the restaurant.`,
      Preparing: `The kitchen has started preparing your order #${order.orderNumber}.`,
      Ready: `Your order #${order.orderNumber} is prepared and ready!`,
      OutForDelivery: `Your order #${order.orderNumber} is out for delivery with our delivery partner.`,
      Delivered: `Your order #${order.orderNumber} has been delivered. Enjoy your meal!`,
      Cancelled: `Your order #${order.orderNumber} has been cancelled.`,
    };

    if (statusMessages[status]) {
      createNotification({
        recipient: order.customerId,
        recipientRole: 'customer',
        title: `Order ${status === 'OutForDelivery' ? 'Out for Delivery' : status}`,
        message: statusMessages[status],
        type: 'order',
        eventType: `order_${status.toLowerCase()}`,
        entityId: order.orderNumber,
        entityType: 'Order',
        actionUrl: `/orders/${order.orderNumber}`,
        metadata: {
          orderNumber: order.orderNumber,
          status,
          amount: order.totalAmount,
        },
        idempotencyKey: `notif_cust_order_${order.orderNumber}_${status}`,
      }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message,
    });
  }
};

/**
 * @desc    Process order refund
 * @route   PATCH /api/orders/:id/refund
 * @access  Private (Admin only)
 */
export const processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { orderNumber: id };
    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.paymentStatus = 'Refunded';
    await order.save();

    // Dispatch refund email
    sendOrderEventEmail({
      to: order.customerEmail,
      name: order.customerName,
      order,
      eventType: 'Refunded',
    }).catch(() => {});

    // Customer Notification
    createNotification({
      recipient: order.customerId,
      recipientRole: 'customer',
      title: 'Refund Processed',
      message: `Your refund of ₹${order.totalAmount} for Order #${order.orderNumber} has been processed successfully.`,
      type: 'refund',
      eventType: 'order_refunded',
      entityId: order.orderNumber,
      entityType: 'Order',
      actionUrl: `/orders/${order.orderNumber}`,
      metadata: { amount: order.totalAmount, orderNumber: order.orderNumber },
      idempotencyKey: `notif_cust_order_${order.orderNumber}_refunded`,
    }).catch(() => {});

    // Admin Notification
    createNotification({
      recipientRole: 'admin',
      title: 'Refund Completed',
      message: `Refund of ₹${order.totalAmount} completed for Order #${order.orderNumber}.`,
      type: 'refund',
      eventType: 'refund_completed',
      entityId: order.orderNumber,
      entityType: 'Order',
      actionUrl: `/admin/orders/${order.orderNumber}`,
      metadata: { amount: order.totalAmount, orderNumber: order.orderNumber },
      idempotencyKey: `notif_admin_order_${order.orderNumber}_refunded`,
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: `Refund completed for order #${order.orderNumber}`,
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Chef / Staff: Record food quality check and mark ready
 * @route   PATCH /api/orders/:id/quality-check
 * @access  Private (Chef / Admin)
 */
export const updateOrderQualityCheck = async (req, res) => {
  try {
    const { id } = req.params;
    const { qualityCheck } = req.body;

    if (!qualityCheck || !qualityCheck.verified) {
      return res.status(400).json({
        success: false,
        message: 'Valid qualityCheck verification object is required',
      });
    }

    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { orderNumber: id };

    const order = await Order.findOneAndUpdate(
      query,
      {
        qualityCheck: {
          ...qualityCheck,
          verifiedAt: qualityCheck.verifiedAt || new Date(),
          verifiedBy: qualityCheck.verifiedBy || req.user?.name || 'Station Chef',
        },
        orderStatus: 'Ready',
        kitchenStatus: 'Ready',
        actualReadyTime: new Date(),
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Customer Notification
    createNotification({
      recipient: order.customerId,
      recipientRole: 'customer',
      title: 'Order Ready',
      message: `Your order #${order.orderNumber} has passed kitchen quality checks and is ready!`,
      type: 'order',
      eventType: 'order_ready',
      entityId: order.orderNumber,
      entityType: 'Order',
      actionUrl: `/orders/${order.orderNumber}`,
      metadata: { orderNumber: order.orderNumber, status: 'Ready' },
      idempotencyKey: `notif_cust_order_${order.orderNumber}_Ready`,
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Quality check verified and order marked as Ready',
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to record quality check',
      error: error.message,
    });
  }
};

export default {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  processRefund,
  updateOrderQualityCheck,
};
