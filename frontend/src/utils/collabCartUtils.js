/**
 * ZESTRO CollabCart & Multi-Person Bill Split Utility
 * Real-time state synchronization using BroadcastChannel & localStorage
 */

const CHANNEL_NAME = 'zestro_collab_cart_sync';

// Create or get broadcast channel (graceful fallback if unsupported)
function getChannel() {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      return new BroadcastChannel(CHANNEL_NAME);
    } catch {
      return null;
    }
  }
  return null;
}

// Generate human-friendly 4-digit room code like ZEST-8492
export function generateRoomCode() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `ZEST-${num}`;
}

// Generate 4-digit security handshake OTP for delivery
export function generateDeliveryOTP() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// Active room local cache
const ROOM_STORAGE_KEY = 'zestro_active_collab_room';

export function getActiveRoom() {
  try {
    const raw = localStorage.getItem(ROOM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveActiveRoom(room) {
  try {
    if (!room) {
      localStorage.removeItem(ROOM_STORAGE_KEY);
    } else {
      localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(room));
    }
    // Also broadcast to other tabs
    const ch = getChannel();
    if (ch) {
      ch.postMessage({ type: 'ROOM_STATE_UPDATED', room });
    }
  } catch {
    // ignore
  }
}

// Broadcast an action to peer tabs (ADD_ITEM, REMOVE_ITEM, UPDATE_QTY, CLEAR, SYNC_REQUEST)
export function broadcastCollabAction(action) {
  const ch = getChannel();
  if (ch) {
    try {
      ch.postMessage(action);
    } catch {
      // ignore
    }
  }
}

// Subscribe to peer tab events
export function subscribeToCollabActions(callback) {
  const ch = getChannel();
  if (!ch) return () => {};

  const handler = (event) => {
    if (event?.data) {
      callback(event.data);
    }
  };

  ch.addEventListener('message', handler);
  return () => {
    ch.removeEventListener('message', handler);
    try { ch.close(); } catch {}
  };
}

// Calculate individual shares for each participant
export function calculateBillSplit(items, participants, options = { mode: 'item-wise' }) {
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = Math.round(totalAmount * 0.05);
  const delivery = totalAmount >= 300 ? 0 : 35;
  const grandTotal = totalAmount + tax + delivery;

  const validParticipants = participants && participants.length > 0
    ? participants
    : [{ id: 'p1', name: 'Host (You)', isHost: true }];

  if (options.mode === 'equal') {
    // Equal split
    const perPerson = Math.round(grandTotal / validParticipants.length);
    return validParticipants.map((p, idx) => {
      // Adjust last person by remainder
      const isLast = idx === validParticipants.length - 1;
      const amount = isLast ? grandTotal - (perPerson * (validParticipants.length - 1)) : perPerson;
      return {
        participantId: p.id,
        name: p.name,
        isHost: !!p.isHost,
        itemsCount: items.length,
        items: items,
        amount,
        paid: false,
      };
    });
  }

  // Item-wise split: tally what each person added
  const participantMap = {};
  validParticipants.forEach(p => {
    participantMap[p.name.toLowerCase()] = {
      participantId: p.id,
      name: p.name,
      isHost: !!p.isHost,
      items: [],
      itemsSubtotal: 0,
      paid: false,
    };
  });

  const defaultKey = validParticipants[0].name.toLowerCase();

  items.forEach(item => {
    const ownerName = (item.addedBy || validParticipants[0].name).toLowerCase();
    const target = participantMap[ownerName] || participantMap[defaultKey];
    target.items.push(item);
    target.itemsSubtotal += (item.price * item.qty);
  });

  // Distribute tax and delivery proportionally
  return Object.values(participantMap).map(p => {
    const ratio = totalAmount > 0 ? (p.itemsSubtotal / totalAmount) : (1 / validParticipants.length);
    const personTax = Math.round(tax * ratio);
    const personDelivery = Math.round(delivery * ratio);
    const personTotal = p.itemsSubtotal + personTax + personDelivery;

    return {
      participantId: p.participantId,
      name: p.name,
      isHost: p.isHost,
      itemsCount: p.items.reduce((acc, it) => acc + it.qty, 0),
      items: p.items,
      subtotal: p.itemsSubtotal,
      tax: personTax,
      delivery: personDelivery,
      amount: personTotal,
      paid: false,
    };
  });
}

// Helper to generate UPI Payment QR code image URL (uses quick QR server with offline fallback)
export function getUpiQrCodeUrl(amount, payeeName = 'ZESTRO Dining', payeeVpa = 'zestro.orders@okaxis') {
  const upiUrl = `upi://pay?pa=${encodeURIComponent(payeeVpa)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=ZESTRO%20Food%20Split`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}&bgcolor=ffffff&color=1e1e2d&margin=2`;
}
