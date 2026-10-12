import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';

export default function Feedback() {
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const { showToast } = useToast();

  const submit = (e) => {
    e.preventDefault();
    setSent(true);
    showToast('Thank you for your feedback!', 'success');
  };

  return (
    <div>
      <h1>💬 Feedback</h1>
      {sent ? (
        <div className="empty-state"><span className="emoji">🙏</span>Thanks for helping us improve ZESTRO!</div>
      ) : (
        <form className="card" style={{ padding: 18, maxWidth: 420 }} onSubmit={submit}>
          <div className="input-group">
            <label>Your feedback</label>
            <textarea required value={text} onChange={e => setText(e.target.value)}
              style={{ width: '100%', minHeight: 100, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
          </div>
          <button className="btn btn-primary btn-block" type="submit">Submit Feedback</button>
        </form>
      )}
    </div>
  );
}
