import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
    },
    incidentType: {
      type: String,
      required: true,
      enum: [
        'Equipment Failure',
        'Ingredient Shortage',
        'Kitchen Delay',
        'Fire or Safety Incident',
        'Power Failure',
        'Staff Accident',
        'Food Preparation Problem',
        'Kitchen Temporarily Closed',
        'Other',
      ],
    },
    severity: {
      type: String,
      required: true,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'High',
    },
    description: {
      type: String,
      required: true,
    },
    restaurantId: {
      type: String,
      required: true,
      default: 'r2',
    },
    restaurantName: {
      type: String,
      required: true,
      default: 'Dindigul Thalappakatti',
    },
    chefId: {
      type: String,
      default: 'chef_1',
    },
    chefName: {
      type: String,
      default: 'Chef Murugesan P.',
    },
    image: String,
    affectedOrders: [String],
    status: {
      type: String,
      enum: ['open', 'investigating', 'in_progress', 'resolved'],
      default: 'open',
    },
    adminNotes: String,
    reportedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.Incident || mongoose.model('Incident', incidentSchema);
