import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { parseVoiceCommand } from '../services/aiApiService';
import { addToCart } from '../redux/slices/cartSlice';
import { useToast } from '../contexts/ToastContext';
import Icon from './Icon';

export default function VoiceOrderingModal({ isOpen, onClose, defaultFoods = [] }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const reduxFoods = useSelector(s => s.food?.foods || []);
  const availableFoods = defaultFoods.length > 0 ? defaultFoods : reduxFoods;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Check Web Speech Recognition support
  const SpeechRecognition = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;
  const isSpeechSupported = !!SpeechRecognition;

  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setTranscript('');
      setParsedResult(null);
      setIsEditing(false);
      return;
    }

    if (isSpeechSupported) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event) => {
          const current = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
          setTranscript(current);
        };

        recognition.onerror = (event) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
        setIsListening(false);
      }
    }
  }, [isOpen, isSpeechSupported]);

  // When transcript updates, run NLP parser
  useEffect(() => {
    if (transcript.trim()) {
      const result = parseVoiceCommand(transcript, availableFoods);
      setParsedResult(result);
    }
  }, [transcript, availableFoods]);

  if (!isOpen) return null;

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setTranscript(manualInput);
    const result = parseVoiceCommand(manualInput, availableFoods);
    setParsedResult(result);
  };

  const handleAddParsedToCart = () => {
    if (!parsedResult || !parsedResult.items || !parsedResult.items.length) return;

    parsedResult.items.forEach(item => {
      dispatch(addToCart({
        foodId: item.food.id,
        name: item.food.name,
        price: item.food.price,
        restaurantId: item.food.restaurantId,
        restaurantName: item.food.restaurantName,
        image: item.food.image,
        qty: item.qty,
      }));
    });

    showToast(`Added ${parsedResult.items.length} voice-ordered item(s) to cart! 🎉`, 'success');
    onClose();
    navigate('/cart');
  };

  const toggleMic = () => {
    if (!isSpeechSupported) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setParsedResult(null);
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 300,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        maxWidth: 500,
        width: '100%',
        padding: 24,
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: isListening ? 'rgba(232, 84, 42, 0.15)' : 'var(--bg)',
            border: '2px solid var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            animation: isListening ? 'pulse 1.4s infinite' : 'none',
          }}>
            🎙️
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18 }}>Voice Food Ordering</h3>
            <span style={{ fontSize: 11.5, color: 'var(--accent)', fontWeight: 700 }}>
              Demo Voice Parser (Backend NLP-Ready)
            </span>
          </div>
        </div>

        {/* Listening State Card */}
        <div style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 18,
          textAlign: 'center',
          margin: '14px 0',
        }}>
          {isListening ? (
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)', marginBottom: 6 }}>
                🎙️ Listening...
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                Try saying: <em>"I want one Chicken Biryani and one Lime Soda"</em> or <em>"Add two Plain Parottas"</em>
              </p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                {isSpeechSupported ? 'Tap microphone or type command below:' : 'Voice ordering is not supported in this browser.'}
              </div>
              {isSpeechSupported && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={toggleMic}
                  style={{ borderRadius: 20, padding: '6px 16px' }}
                >
                  🎙️ Start Listening
                </button>
              )}
            </div>
          )}

          {transcript && (
            <div style={{
              marginTop: 14,
              padding: '10px 12px',
              background: 'var(--bg-elevated)',
              borderRadius: 8,
              border: '1px solid var(--border)',
              fontSize: 13.5,
              fontWeight: 600,
              fontStyle: 'italic',
            }}>
              "{transcript}"
            </div>
          )}
        </div>

        {/* Manual text fallback */}
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Or type e.g. 1 Chicken Biryani and 1 Lime Soda..."
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: 13,
            }}
          />
          <button type="submit" className="btn btn-secondary btn-sm">Parse</button>
        </form>

        {/* Parsed Result Section */}
        {parsedResult && parsedResult.items && parsedResult.items.length > 0 && (
          <div style={{
            background: 'color-mix(in srgb, var(--success) 8%, var(--bg-elevated))',
            border: '1.5px solid var(--success)',
            borderRadius: 14,
            padding: 14,
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--success)', marginBottom: 8 }}>
              ✨ I Understood:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {parsedResult.items.map(it => (
                <div key={it.food.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700 }}>
                  <span>{it.name} × {it.qty}</span>
                  <span>₹{it.total}</span>
                </div>
              ))}
            </div>

            <div style={{
              borderTop: '1px dashed var(--border)',
              marginTop: 10,
              paddingTop: 8,
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 800,
              fontSize: 14,
            }}>
              <span>Estimated Total:</span>
              <span className="price">₹{parsedResult.estimatedTotal}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {parsedResult && parsedResult.items && parsedResult.items.length > 0 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddParsedToCart}
            >
              Add {parsedResult.items.length} item(s) to Cart (₹{parsedResult.estimatedTotal})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
