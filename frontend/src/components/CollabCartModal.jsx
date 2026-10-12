import React, { useState, useMemo } from 'react';
import { 
  generateRoomCode, 
  saveActiveRoom, 
  broadcastCollabAction, 
  calculateBillSplit, 
  getUpiQrCodeUrl,
  generateDeliveryOTP 
} from '../utils/collabCartUtils';
import { useToast } from '../contexts/ToastContext';
import SafeImage from './SafeImage';
import Icon from './Icon';
import './CollabCartModal.css';

export default function CollabCartModal({
  isOpen,
  onClose,
  mode = 'split', // 'start' | 'join' | 'split'
  room = null,
  cartItems = [],
  onRoomUpdated,
}) {
  const { showToast } = useToast();

  // Host creation state
  const [hostName, setHostName] = useState('Host');
  // Join state
  const [joinPin, setJoinPin] = useState('');
  const [guestName, setGuestName] = useState('');

  // Bill split settings
  const [splitMode, setSplitMode] = useState('item-wise'); // 'item-wise' | 'equal'
  const [paidStatus, setPaidStatus] = useState({});

  // Generated OTP for delivery handshake
  const deliveryOTP = useMemo(() => room?.deliveryOTP || generateDeliveryOTP(), [room]);

  if (!isOpen) return null;

  // Handle Starting a new Group Room
  const handleStartRoom = (e) => {
    e?.preventDefault?.();
    const finalHostName = hostName.trim() || 'Host';
    const roomCode = generateRoomCode();
    const newRoom = {
      code: roomCode,
      createdAt: new Date().toISOString(),
      hostName: finalHostName,
      deliveryOTP,
      participants: [
        { id: `p-${Date.now()}`, name: finalHostName, isHost: true }
      ],
    };

    saveActiveRoom(newRoom);
    if (onRoomUpdated) onRoomUpdated(newRoom);
    broadcastCollabAction({ type: 'ROOM_CREATED', room: newRoom });

    showToast(`🎉 Group Feast Room ${roomCode} created! Share PIN with friends.`, 'success');
    onClose();
  };

  // Handle Joining an existing room
  const handleJoinRoom = (e) => {
    e?.preventDefault?.();
    const pin = joinPin.trim().toUpperCase();
    const name = guestName.trim() || 'Friend';

    if (!pin) {
      showToast('Please enter the 4-digit Room PIN', 'error');
      return;
    }

    // Format if just numbers e.g. "8492" -> "ZEST-8492"
    const formattedCode = pin.startsWith('ZEST-') ? pin : `ZEST-${pin}`;

    const updatedRoom = {
      code: formattedCode,
      hostName: room?.hostName || 'Host',
      deliveryOTP,
      participants: [
        ...(room?.participants || [{ id: 'p1', name: 'Host', isHost: true }]),
        { id: `p-${Date.now()}`, name, isHost: false }
      ],
    };

    // Remove duplicates
    const uniqueParticipants = Array.from(
      new Map(updatedRoom.participants.map(p => [p.name.toLowerCase(), p])).values()
    );
    updatedRoom.participants = uniqueParticipants;

    saveActiveRoom(updatedRoom);
    if (onRoomUpdated) onRoomUpdated(updatedRoom);
    broadcastCollabAction({ type: 'PEER_JOINED', participant: name, room: updatedRoom });

    showToast(`🟢 Joined Group Room ${formattedCode} as ${name}!`, 'success');
    onClose();
  };

  // Compute Bill Split Breakdown
  const splitBreakdown = calculateBillSplit(
    cartItems,
    room?.participants || [{ id: 'p1', name: 'You (Host)', isHost: true }],
    { mode: splitMode }
  );

  const copyRoomCode = () => {
    if (!room?.code) return;
    navigator.clipboard?.writeText?.(room.code);
    showToast(`Copied Room Code "${room.code}" to clipboard! 📋`, 'info');
  };

  const copyShareLink = () => {
    if (!room?.code) return;
    const url = `${window.location.origin}/cart?room=${room.code}`;
    navigator.clipboard?.writeText?.(url);
    showToast(`Copied invite link: ${url}`, 'info');
  };

  const togglePaid = (id) => {
    setPaidStatus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="collab-modal-backdrop" onClick={onClose}>
      <div className="collab-modal-box" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="collab-header">
          <div className="collab-title-row">
            <div className="collab-icon-orb">
              {mode === 'split' ? '🧾' : '🎉'}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                {mode === 'start' && 'Start CollabCart Group Feast'}
                {mode === 'join' && 'Join Group Feast Room'}
                {mode === 'split' && 'Smart Multi-Person Bill Split & UPI'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                {mode === 'split' ? 'Item-wise auto-tally & live scannable UPI QR codes' : 'Real-time multi-peer cart synchronization across tabs'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#fff',
              width: 32,
              height: 32,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="collab-body">
          {/* =========================================================================
              MODE 1: START ROOM
              ========================================================================= */}
          {mode === 'start' && (
            <form onSubmit={handleStartRoom} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#e2e8f0' }}>
                  Your Host Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dheiv (Host)"
                  value={hostName}
                  onChange={e => setHostName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                  }}
                  autoFocus
                />
              </div>

              <div style={{ background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: 14, padding: 14, fontSize: 12.5, color: '#d8b4fe' }}>
                💡 <strong>How it works for your exam demo:</strong> Starting this room creates a unique PIN. You can open a second browser window / incognito tab, enter this PIN, and show both windows adding dishes to the cart simultaneously in real time!
              </div>

              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #e8542a, #a855f7)',
                  border: 'none',
                  color: '#fff',
                  padding: '12px 20px',
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  marginTop: 6,
                  boxShadow: '0 4px 16px rgba(232, 84, 42, 0.35)',
                }}
              >
                🚀 Generate Room &amp; Start Group Feast
              </button>
            </form>
          )}

          {/* =========================================================================
              MODE 2: JOIN ROOM
              ========================================================================= */}
          {mode === 'join' && (
            <form onSubmit={handleJoinRoom} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#e2e8f0' }}>
                  Enter 4-Digit Room PIN or Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 8492 or ZEST-8492"
                  value={joinPin}
                  onChange={e => setJoinPin(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#c084fc',
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: 2,
                    outline: 'none',
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#e2e8f0' }}>
                  Your Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arun / Priya"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #e8542a, #a855f7)',
                  border: 'none',
                  color: '#fff',
                  padding: '12px 20px',
                  borderRadius: 14,
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  marginTop: 6,
                  boxShadow: '0 4px 16px rgba(232, 84, 42, 0.35)',
                }}
              >
                🔗 Connect to Live Room
              </button>
            </form>
          )}

          {/* =========================================================================
              MODE 3: SMART BILL SPLIT & UPI QR CODES
              ========================================================================= */}
          {mode === 'split' && (
            <>
              {/* Room details banner if connected */}
              {room && (
                <div className="collab-pin-banner">
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#c084fc' }}>
                      🟢 ACTIVE COLLABCART ROOM
                    </div>
                    <div className="collab-pin-value" style={{ marginTop: 4 }}>
                      {room.code}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={copyRoomCode}
                      style={{ fontSize: 12 }}
                    >
                      Copy PIN 📋
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={copyShareLink}
                      style={{ fontSize: 12 }}
                    >
                      Invite Link 🔗
                    </button>
                  </div>
                </div>
              )}

              {/* Split Mode Switcher Tabs */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8, textTransform: 'uppercase' }}>
                  Split Calculation Mode
                </div>
                <div className="collab-split-tabs">
                  <button
                    type="button"
                    className={`collab-split-tab-btn ${splitMode === 'item-wise' ? 'active' : ''}`}
                    onClick={() => setSplitMode('item-wise')}
                  >
                    📦 Item-Wise (Pay for what you ordered)
                  </button>
                  <button
                    type="button"
                    className={`collab-split-tab-btn ${splitMode === 'equal' ? 'active' : ''}`}
                    onClick={() => setSplitMode('equal')}
                  >
                    ➗ Equal Split (Divide evenly)
                  </button>
                </div>
              </div>

              {/* Individual Split Person Cards */}
              <div className="collab-split-grid">
                {splitBreakdown.map((person) => {
                  const isPaid = !!paidStatus[person.participantId];
                  const qrUrl = getUpiQrCodeUrl(person.amount, 'ZESTRO Dining', 'zestro.orders@okaxis');

                  return (
                    <div
                      key={person.participantId}
                      className={`collab-person-card ${isPaid ? 'paid' : ''}`}
                    >
                      <div className="collab-person-top">
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{person.isHost ? '👑' : '👤'}</span>
                            <span>{person.name}</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                            {person.itemsCount} dishes included
                          </div>
                        </div>

                        <div className="collab-person-amount">
                          ₹{person.amount}
                        </div>
                      </div>

                      {/* Items breakdown list */}
                      <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 8, fontSize: 11.5, maxHeight: 90, overflowY: 'auto' }}>
                        {person.items && person.items.length > 0 ? (
                          person.items.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0', color: 'rgba(255,255,255,0.75)' }}>
                              <span>• {it.name} (x{it.qty})</span>
                              <span>₹{it.price * it.qty}</span>
                            </div>
                          ))
                        ) : (
                          <div style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                            No individual items allocated
                          </div>
                        )}
                      </div>

                      {/* Dynamic UPI QR Code */}
                      <div className="collab-qr-box">
                        <img
                          src={qrUrl}
                          alt={`UPI QR for ${person.name}`}
                          className="collab-qr-img"
                        />
                        <div className="collab-qr-label">
                          Scan to Pay ₹{person.amount} via UPI
                        </div>
                        <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>
                          GPay • PhonePe • Paytm
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => togglePaid(person.participantId)}
                          style={{
                            flex: 1,
                            padding: '7px 10px',
                            borderRadius: 10,
                            border: isPaid ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.15)',
                            background: isPaid ? '#22c55e' : 'rgba(255,255,255,0.06)',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: 11.5,
                            cursor: 'pointer',
                          }}
                        >
                          {isPaid ? '✓ Marked as Paid' : 'Mark Paid'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const upiLink = `upi://pay?pa=zestro.orders@okaxis&pn=ZESTRO%20Dining&am=${person.amount}&cu=INR`;
                            navigator.clipboard?.writeText?.(upiLink);
                            showToast(`Copied UPI Payment Link for ${person.name}! 💸`, 'info');
                          }}
                          style={{
                            padding: '7px 12px',
                            borderRadius: 10,
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'rgba(255,255,255,0.06)',
                            color: '#c084fc',
                            fontWeight: 700,
                            fontSize: 11.5,
                            cursor: 'pointer',
                          }}
                          title="Copy UPI Direct Payment Link"
                        >
                          Copy UPI
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 4-Digit Handshake OTP Verification Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(16, 185, 129, 0.08))',
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                  borderRadius: 16,
                  padding: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#4ade80', textTransform: 'uppercase' }}>
                    🛡️ SECURE DELIVERY HANDSHAKE OTP
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                    Share this 4-digit OTP with your delivery partner to prevent wrong-delivery fraud
                  </div>
                </div>

                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 22,
                    fontWeight: 900,
                    color: '#4ade80',
                    background: 'rgba(0,0,0,0.4)',
                    padding: '4px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                    letterSpacing: 4,
                  }}
                >
                  {deliveryOTP}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
