// Table Booking & Conflict Validation Service for ZESTRO Table Booking Operations Center

export const DEFAULT_TABLES = [
  { id: 'T-01', number: 'T-01', capacity: 4, location: 'Garden Patio', seatingType: 'Outdoor', baseStatus: 'Available' },
  { id: 'T-02', number: 'T-02', capacity: 2, location: 'Main Dining Hall', seatingType: 'Indoor', baseStatus: 'Available' },
  { id: 'T-03', number: 'T-03', capacity: 2, location: 'Courtyard View', seatingType: 'Indoor', baseStatus: 'Available' },
  { id: 'T-04', number: 'T-04', capacity: 4, location: 'Window View', seatingType: 'Window', baseStatus: 'Cleaning' },
  { id: 'T-05', number: 'T-05', capacity: 6, location: 'Family Section', seatingType: 'Family', baseStatus: 'Available' },
  { id: 'T-06', number: 'T-06', capacity: 6, location: 'Family Cabin', seatingType: 'Indoor', baseStatus: 'Maintenance' },
  { id: 'T-07', number: 'T-07', capacity: 4, location: 'Corner Lounge', seatingType: 'Indoor', baseStatus: 'Available' },
  { id: 'T-08', number: 'T-08', capacity: 8, location: 'Banquet Alcove', seatingType: 'Family', baseStatus: 'Available' },
  { id: 'T-09', number: 'T-09', capacity: 2, location: 'Terrace View', seatingType: 'Outdoor', baseStatus: 'Available' },
  { id: 'T-10', number: 'T-10', capacity: 4, location: 'Veranda', seatingType: 'Outdoor', baseStatus: 'Available' },
  { id: 'T-11', number: 'T-11', capacity: 2, location: 'Bar Counter Area', seatingType: 'Indoor', baseStatus: 'Available' },
  { id: 'T-12', number: 'T-12', capacity: 4, location: 'Window Booth', seatingType: 'Window', baseStatus: 'Available' },
];

/**
 * Validates whether a table is already booked for the specified restaurant, date and time slot.
 * Requirement 15: Restaurant + Date + Time + Table
 */
export function checkTableConflict({ bookings = [], restaurantId, date, time, tableNumber, currentBookingId }) {
  if (!tableNumber || !date || !time) return { hasConflict: false };

  const conflictingBooking = bookings.find(b => {
    if (b.id === currentBookingId) return false;
    if (['Cancelled', 'Completed', 'No Show'].includes(b.status)) return false;

    // Match table identity
    const matchesTable = (b.tableNumber === tableNumber || b.tableId === tableNumber);
    if (!matchesTable) return false;

    // Match restaurant (if specified)
    if (restaurantId && b.restaurantId && b.restaurantId !== restaurantId) {
      return false;
    }

    // Match Date (normalize YYYY-MM-DD or strings)
    const bDate = (b.date || '').trim();
    const reqDate = (date || '').trim();
    if (bDate && reqDate && bDate !== reqDate) {
      return false;
    }

    // Match Time Slot
    const bTime = (b.time || '').trim().toUpperCase();
    const reqTime = (time || '').trim().toUpperCase();
    if (bTime && reqTime && bTime !== reqTime) {
      return false;
    }

    return true;
  });

  if (conflictingBooking) {
    return {
      hasConflict: true,
      errorMessage: 'This table is already reserved for this time.',
      conflictingBooking,
    };
  }

  return { hasConflict: false };
}

/**
 * Returns suggestions of available alternative tables for the same slot.
 */
export function getAvailableAlternativeTables({ tables = DEFAULT_TABLES, bookings = [], restaurantId, date, time, currentBookingId, requiredGuests = 2 }) {
  return tables.filter(t => {
    if (t.baseStatus === 'Maintenance') return false;

    const conflict = checkTableConflict({
      bookings,
      restaurantId,
      date,
      time,
      tableNumber: t.number,
      currentBookingId,
    });

    return !conflict.hasConflict && t.capacity >= requiredGuests;
  });
}

/**
 * Computes live operational table statuses: Available, Reserved, Occupied, Cleaning, Maintenance
 * Requirement 14:
 * T-01 Available
 * T-02 Reserved
 * T-03 Occupied
 * T-04 Cleaning
 * T-05 Maintenance
 */
export function computeLiveTableStatusMatrix({ tables = DEFAULT_TABLES, bookings = [], restaurantId, date = '2026-09-26' }) {
  return tables.map(table => {
    if (table.baseStatus === 'Maintenance') {
      return { ...table, currentStatus: 'Maintenance', activeBooking: null };
    }
    if (table.baseStatus === 'Cleaning') {
      return { ...table, currentStatus: 'Cleaning', activeBooking: null };
    }

    // Check active bookings on this table for this restaurant & date
    const tableBookings = bookings.filter(b => {
      if (['Cancelled', 'Completed', 'No Show'].includes(b.status)) return false;
      const matchesTable = (b.tableNumber === table.number || b.tableId === table.number);
      if (!matchesTable) return false;
      if (restaurantId && b.restaurantId && b.restaurantId !== restaurantId) return false;
      if (date && b.date && b.date !== date) return false;
      return true;
    });

    if (tableBookings.length === 0) {
      return { ...table, currentStatus: 'Available', activeBooking: null };
    }

    // If dining or customer arrived, status is Occupied
    const occupiedBooking = tableBookings.find(b => b.status === 'Dining' || b.status === 'Customer Arrived');
    if (occupiedBooking) {
      return { ...table, currentStatus: 'Occupied', activeBooking: occupiedBooking };
    }

    // If table ready, status is Cleaning or Reserved
    const readyBooking = tableBookings.find(b => b.status === 'Table Ready');
    if (readyBooking) {
      return { ...table, currentStatus: 'Reserved', activeBooking: readyBooking };
    }

    // If confirmed or requested, status is Reserved
    const reservedBooking = tableBookings.find(b => b.status === 'Confirmed' || b.status === 'Requested');
    if (reservedBooking) {
      return { ...table, currentStatus: 'Reserved', activeBooking: reservedBooking };
    }

    return { ...table, currentStatus: 'Available', activeBooking: null };
  });
}
