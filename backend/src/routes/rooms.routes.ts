import { Router } from 'express';
import * as realTimeRoomsController from '../controllers/realTimeRooms.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// All room routes require authentication
router.use(authenticateToken);

// Get rooms with real-time status - Space owners only
router.get(
  '/real-time',
  authorizeRoles('SPACE'),
  realTimeRoomsController.getRoomsRealTime
);

// Update room status - Space owners only
router.patch(
  '/:roomId/status',
  authorizeRoles('SPACE'),
  realTimeRoomsController.updateRoomStatus
);

// Room bookings - Professionals and Space owners
router.post(
  '/bookings',
  authorizeRoles('PROFESSIONAL', 'SPACE'),
  realTimeRoomsController.createRoomBooking
);

router.delete(
  '/bookings/:bookingId',
  authorizeRoles('PROFESSIONAL', 'SPACE'),
  realTimeRoomsController.cancelRoomBooking
);

// Get room schedule
router.get(
  '/:roomId/schedule',
  authorizeRoles('PROFESSIONAL', 'SPACE'),
  realTimeRoomsController.getRoomSchedule
);

// Space analytics - Space owners only
router.get(
  '/analytics',
  authorizeRoles('SPACE'),
  realTimeRoomsController.getSpaceAnalytics
);

// IoT simulation endpoint (for demo/testing)
router.post(
  '/iot/trigger',
  authorizeRoles('SPACE'),
  realTimeRoomsController.simulateIoTTrigger
);

export default router;
