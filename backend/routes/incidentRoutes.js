import express from 'express';
import {
  createIncident,
  getIncidents,
  updateIncidentStatus,
} from '../controllers/incidentController.js';

const router = express.Router();

router.post('/', createIncident);
router.get('/', getIncidents);
router.patch('/:id/status', updateIncidentStatus);

export default router;
