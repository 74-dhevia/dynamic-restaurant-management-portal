import mongoose from 'mongoose';
import Incident from '../models/Incident.js';
import Order from '../models/Order.js';
import { createNotification } from '../services/notificationService.js';

// Seed initial incidents cache so kitchen always has active operational data even during db reconnects
const memIncidents = [
  {
    incidentId: 'INC-802',
    incidentType: 'Kitchen Delay',
    severity: 'High',
    description: 'Primary exhaust ventilation malfunction in main kitchen wok line. Preparing orders and hot table bookings delayed.',
    restaurantId: 'r2',
    restaurantName: 'Dindigul Thalappakatti',
    chefId: 'chef_1',
    chefName: 'Chef Murugesan P.',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&auto=format&fit=crop&q=80',
    affectedOrders: ['ZST-1024', 'ZST-1025'],
    reportedAt: new Date(Date.now() - 1800000).toISOString(),
    status: 'open',
    adminNotes: '',
    resolvedAt: null,
  },
  {
    incidentId: 'INC-701',
    incidentType: 'Equipment Failure',
    severity: 'Medium',
    description: 'Tandoor furnace secondary blower valve inspection required. Preparing orders slightly delayed by 10 minutes.',
    restaurantId: 'r2',
    restaurantName: 'Dindigul Thalappakatti',
    chefId: 'chef_1',
    chefName: 'Chef Murugesan P.',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&auto=format&fit=crop&q=80',
    affectedOrders: ['ZST-1025'],
    reportedAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'resolved',
    adminNotes: 'Maintenance team serviced valve. Kitchen resumed normal operations.',
    resolvedAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

/**
 * @desc    Create a new Kitchen Incident
 * @route   POST /api/incidents
 * @access  Chef / Staff / Admin
 */
export const createIncident = async (req, res) => {
  try {
    const {
      incidentType,
      severity = 'High',
      description,
      restaurantId = 'r2',
      restaurantName = 'Dindigul Thalappakatti',
      chefId = 'chef_1',
      chefName = 'Station Chef',
      affectedOrders = [],
      image,
    } = req.body;

    if (!incidentType || !description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Incident type and description are required',
      });
    }

    const incidentId = `INC-${Date.now()}`;
    const incidentData = {
      incidentId,
      incidentType,
      severity,
      description: description.trim(),
      restaurantId,
      restaurantName,
      chefId,
      chefName,
      affectedOrders,
      image: image || null,
      status: 'open',
      reportedAt: new Date().toISOString(),
      adminNotes: '',
      resolvedAt: null,
    };

    // Store in memory first
    memIncidents.unshift(incidentData);

    // If MongoDB is connected, persist to Atlas
    if (mongoose.connection.readyState === 1) {
      try {
        await Incident.create(incidentData);

        if (affectedOrders && affectedOrders.length > 0) {
          await Order.updateMany(
            {
              $or: [
                { orderNumber: { $in: affectedOrders } },
                { _id: { $in: affectedOrders.filter(id => id.match(/^[0-9a-fA-F]{24}$/)) } },
              ],
            },
            {
              $set: {
                kitchenStatus: 'Delayed',
                incident: {
                  reported: true,
                  incidentId,
                  incidentType,
                  severity,
                  message: description.trim(),
                  reportedAt: new Date(),
                  reportedBy: chefName,
                  paused: severity === 'Critical' || severity === 'High',
                },
              },
            }
          ).maxTimeMS(2000);
        }
      } catch (dbErr) {
        console.warn('MongoDB incident persist notice (cached in memory):', dbErr.message);
      }
    }

    // Create Admin Notification for kitchen incident (Part 1.3 requirement)
    createNotification({
      recipientRole: 'admin',
      title: `Kitchen Incident: ${incidentType} (${severity})`,
      message: `${chefName} reported an incident at ${restaurantName}: ${description.trim()}`,
      type: 'incident',
      eventType: 'incident_reported',
      entityId: incidentId,
      entityType: 'Incident',
      actionUrl: '/admin/kitchen',
      metadata: {
        incidentId,
        incidentType,
        severity,
        restaurantName,
        chefName,
      },
      idempotencyKey: `notif_admin_incident_${incidentId}`,
    }).catch((notifErr) => console.warn('Incident notification note:', notifErr.message));

    res.status(201).json({
      success: true,
      message: 'Kitchen incident recorded successfully',
      data: incidentData,
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record kitchen incident',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all kitchen incidents
 * @route   GET /api/incidents
 * @access  Public / Staff / Admin
 */
export const getIncidents = async (req, res) => {
  try {
    const { restaurantId } = req.query;

    if (mongoose.connection.readyState === 1) {
      try {
        const filter = {};
        if (restaurantId) filter.restaurantId = restaurantId;
        const incidents = await Incident.find(filter).sort({ reportedAt: -1 }).maxTimeMS(2000);
        if (incidents && incidents.length > 0) {
          return res.status(200).json({
            success: true,
            count: incidents.length,
            data: incidents,
          });
        }
      } catch (dbErr) {
        console.warn('MongoDB incident fetch notice (serving memory cache):', dbErr.message);
      }
    }

    // Serve memory cache
    const filtered = restaurantId
      ? memIncidents.filter(i => i.restaurantId === restaurantId)
      : memIncidents;

    res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incidents',
      error: error.message,
    });
  }
};

/**
 * @desc    Update incident resolution status
 * @route   PATCH /api/incidents/:id/status
 * @access  Staff / Admin / Chef
 */
export const updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNote } = req.body;

    const validStatuses = ['open', 'investigating', 'in_progress', 'resolved'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values: ${validStatuses.join(', ')}`,
      });
    }

    // Update memory cache
    const memIdx = memIncidents.findIndex(i => i.incidentId === id || i._id === id || i.id === id);
    if (memIdx !== -1) {
      if (status) memIncidents[memIdx].status = status;
      if (resolutionNote) memIncidents[memIdx].adminNotes = resolutionNote;
      if (status === 'resolved') memIncidents[memIdx].resolvedAt = new Date().toISOString();
    }

    let updatedDoc = memIdx !== -1 ? memIncidents[memIdx] : null;

    if (mongoose.connection.readyState === 1) {
      try {
        const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { incidentId: id };
        const updateFields = {};
        if (status) updateFields.status = status;
        if (resolutionNote) updateFields.adminNotes = resolutionNote;
        if (status === 'resolved') updateFields.resolvedAt = new Date();

        const doc = await Incident.findOneAndUpdate(query, updateFields, { new: true }).maxTimeMS(2000);
        if (doc) updatedDoc = doc;
      } catch (dbErr) {
        console.warn('MongoDB incident update notice (cached in memory):', dbErr.message);
      }
    }

    if (!updatedDoc) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Incident status updated to ${status || updatedDoc.status}`,
      data: updatedDoc,
    });
  } catch (error) {
    console.error('Error updating incident:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update incident',
      error: error.message,
    });
  }
};

export default {
  createIncident,
  getIncidents,
  updateIncidentStatus,
};
