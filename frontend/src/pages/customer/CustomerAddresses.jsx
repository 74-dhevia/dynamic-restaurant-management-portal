import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../../redux/slices/authSlice';
import { useToast } from '../../contexts/ToastContext';
import Icon from '../../components/Icon';

export default function CustomerAddresses() {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const currentUser = useSelector(s => s.auth?.currentUser);

  const initialAddresses = currentUser?.addresses && currentUser.addresses.length > 0
    ? currentUser.addresses
    : [
        { id: 'addr_1', label: 'Home', address: '12B Green Valley, 100ft Road, Indiranagar, Bengaluru - 560038', deliveryInstructions: 'Ring doorbell and leave at door' },
        { id: 'addr_2', label: 'Work', address: 'Prestige Tech Cloud, 4th Floor, Whitefield, Bengaluru - 560066', deliveryInstructions: 'Drop at Tower B Reception desk' },
      ];

  const [addresses, setAddresses] = useState(initialAddresses);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [label, setLabel] = useState('Home');
  const [addressText, setAddressText] = useState('');
  const [instructions, setInstructions] = useState('');

  const handleOpenAdd = () => {
    setEditId(null);
    setLabel('Home');
    setAddressText('');
    setInstructions('');
    setIsEditing(true);
  };

  const handleOpenEdit = (addr) => {
    setEditId(addr.id);
    setLabel(addr.label || 'Home');
    setAddressText(addr.address || '');
    setInstructions(addr.deliveryInstructions || '');
    setIsEditing(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!addressText.trim()) {
      showToast('Please enter address details', 'error');
      return;
    }

    let updated;
    if (editId) {
      updated = addresses.map(a => a.id === editId ? {
        ...a,
        label,
        address: addressText.trim(),
        deliveryInstructions: instructions.trim(),
      } : a);
      showToast('Address updated successfully', 'success');
    } else {
      const newAddr = {
        id: `addr_${Date.now()}`,
        label,
        address: addressText.trim(),
        deliveryInstructions: instructions.trim(),
      };
      updated = [newAddr, ...addresses];
      showToast('New address added', 'success');
    }

    setAddresses(updated);
    dispatch(updateProfile({ addresses: updated }));
    setIsEditing(false);
  };

  const handleDelete = (id) => {
    if (addresses.length <= 1) {
      showToast('You must keep at least one delivery address', 'info');
      return;
    }
    const filtered = addresses.filter(a => a.id !== id);
    setAddresses(filtered);
    dispatch(updateProfile({ addresses: filtered }));
    showToast('Address deleted', 'info');
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="location" size={26} color="var(--accent)" />
            <span>Saved Addresses &amp; Delivery Instructions</span>
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
            Manage delivery locations, door instructions, and gate access protocols.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleOpenAdd}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
        >
          <Icon name="plus" size={16} color="#fff" />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Edit / Add Modal Form */}
      {isEditing && (
        <form onSubmit={handleSave} className="card" style={{ padding: 22, marginBottom: 24, border: '1px solid var(--accent)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800 }}>
            {editId ? 'Edit Address' : 'Add New Delivery Address'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                Address Type / Label
              </label>
              <select
                value={label}
                onChange={e => setLabel(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)' }}
              >
                <option value="Home">Home</option>
                <option value="Work">Work / Office</option>
                <option value="Partner / Family">Partner / Family</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Complete Address (Flat/House No, Building, Street, Area, Pincode)
            </label>
            <textarea
              rows={3}
              value={addressText}
              onChange={e => setAddressText(e.target.value)}
              placeholder="e.g. 12B Green Valley, 100ft Road, Indiranagar, Bengaluru - 560038"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Delivery Instructions (Optional)
            </label>
            <input
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="e.g. Ring bell twice, leave at security gate, call on arrival"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ fontWeight: 700 }}
            >
              Save Address
            </button>
          </div>
        </form>
      )}

      {/* Address List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
        {addresses.map((a, idx) => (
          <div key={a.id || idx} className="card" style={{ padding: 18, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: 14,
                  fontSize: 12,
                  fontWeight: 800,
                  background: a.label === 'Home' ? 'color-mix(in srgb, var(--accent) 15%, var(--bg))' : 'color-mix(in srgb, #3b82f6 15%, var(--bg))',
                  color: a.label === 'Home' ? 'var(--accent)' : '#3b82f6',
                }}>
                  {a.label || 'Home'}
                </span>
                {idx === 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)' }}>
                    ✓ Default
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => handleOpenEdit(a)}
                  title="Edit Address"
                  style={{ width: 32, height: 32, padding: 0 }}
                >
                  <Icon name="edit" size={15} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => handleDelete(a.id)}
                  title="Delete Address"
                  style={{ width: 32, height: 32, padding: 0, color: 'var(--danger)' }}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </div>

            <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text)' }}>
              {a.address}
            </div>

            {a.deliveryInstructions && (
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', background: 'var(--bg)', padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="delivery" size={15} color="var(--accent)" />
                <span>{a.deliveryInstructions}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
