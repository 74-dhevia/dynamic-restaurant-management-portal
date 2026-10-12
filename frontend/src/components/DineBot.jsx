import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleChat, openChat, resetChat } from '../redux/slices/chatbotSlice';
import { useChatbot } from '../hooks/useChatbot';
import { addToCart } from '../redux/slices/cartSlice';
import { useToast } from '../contexts/ToastContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import SafeImage from './SafeImage';
import Icon from './Icon';

// 8 Quick Sensory Mood & Craving Prompts
const CHATBOT_MOOD_PROMPTS = [
  { id: 'late-night', label: '🌙 Late-Night', prompt: 'I want a late night biryani combo' },
  { id: 'gym-protein', label: '🏋️ High Protein', prompt: 'High protein gym meals with tandoori' },
  { id: 'rainy-crispy', label: '🌧️ Rainy Crispy', prompt: 'Hot crispy snacks and tea combo' },
  { id: 'budget-beast', label: '💰 Under ₹250', prompt: 'What can I eat under 250 budget?' },
  { id: 'squad-feast', label: '🎉 Squad Feast', prompt: 'Family party dinner combo for 3 people' },
  { id: 'guilt-free', label: '🥗 Clean Veg', prompt: 'Healthy low calorie vegetarian food' },
  { id: 'fiery-spice', label: '🔥 Fiery Spice', prompt: 'Spicy Chettinad pepper chukka dishes' },
  { id: 'sweet-therapy', label: '🍨 Sweet Tooth', prompt: 'Kovilpatti sweets halwa and desserts' },
];

export default function DineBot() {
  const { isOpen, messages } = useSelector(s => s.chatbot);
  const currentUser = useSelector(s => s.auth?.currentUser);
  const dispatch = useDispatch();
  const { sendMessage } = useChatbot();
  const [input, setInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const endRef = useRef(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Voice Speech Recognition Hook
  const { listening, start: startVoice, stop: stopVoice, supported: speechSupported, transcript, setTranscript } = useSpeechRecognition();
  const lastTranscriptRef = useRef('');

  // Scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Listen to global open events from Navbar / Home / Menu
  useEffect(() => {
    const handleGlobalOpen = (e) => {
      const detail = e?.detail || {};
      dispatch(openChat());
      if (detail.prompt) {
        sendMessage(detail.prompt);
      } else if (detail.mood) {
        const found = CHATBOT_MOOD_PROMPTS.find(m => m.id === detail.mood);
        if (found) sendMessage(found.prompt);
      }
    };
    window.addEventListener('open-zestro-concierge', handleGlobalOpen);
    return () => window.removeEventListener('open-zestro-concierge', handleGlobalOpen);
  }, [dispatch, sendMessage]);

  // Voice input handling
  useEffect(() => {
    if (transcript && transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript;
      setInput(transcript);
    }
  }, [transcript]);

  // Voice speech synthesis reply
  const speakResponse = useCallback((text) => {
    if (!soundEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      // Clean emoji and take first 2 sentences for pleasant audio
      const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
      const firstSentence = cleanText.split('.')[0] || cleanText;
      const utterance = new SpeechSynthesisUtterance(firstSentence);
      utterance.rate = 1.05;
      utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  // Speak bot response when new bot message arrives
  useEffect(() => {
    if (messages.length > 1) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.from === 'bot' && lastMsg.text) {
        speakResponse(lastMsg.text);
      }
    }
  }, [messages, speakResponse]);

  const handleSend = (e) => {
    e?.preventDefault?.();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
    setTranscript('');
    lastTranscriptRef.current = '';
    if (listening) stopVoice();
  };

  const handleMicToggle = () => {
    if (listening) {
      stopVoice();
      if (input.trim()) {
        handleSend();
      }
    } else {
      if (speechSupported) {
        setInput('');
        setTranscript('');
        lastTranscriptRef.current = '';
        startVoice();
      } else {
        showToast('Voice speech recognition is not supported in this browser.', 'info');
      }
    }
  };

  const handleQuickPrompt = (promptText) => {
    sendMessage(promptText);
  };

  const handleAddToCart = (food) => {
    if (!currentUser) {
      showToast('Please sign in to add items to your cart', 'info');
      navigate('/login');
      return;
    }
    dispatch(addToCart({
      foodId: food.id,
      name: food.name,
      price: food.price,
      restaurantId: food.restaurantId,
      restaurantName: food.restaurantName,
      image: food.image,
      qty: 1,
    }));
    showToast(`Added ${food.name} to cart! 🎉`, 'success');
  };

  const handleActionClick = (action) => {
    if (action.action === 'NAVIGATE') {
      navigate(action.url);
      dispatch(toggleChat());
    } else if (action.action === 'ADD_COMBO_TO_CART' && Array.isArray(action.data)) {
      if (!currentUser) {
        showToast('Please sign in to add items to your cart', 'info');
        navigate('/login');
        return;
      }
      action.data.forEach(item => {
        dispatch(addToCart({
          foodId: item.id,
          name: item.name,
          price: item.price,
          restaurantId: item.restaurantId,
          restaurantName: item.restaurantName,
          image: item.image,
          qty: 1,
        }));
      });
      showToast(`Added combo (${action.data.length} dishes) to cart! Saved instant discount 🎉`, 'success');
      navigate('/cart');
      dispatch(toggleChat());
    }
  };

  return (
    <>
      {/* =========================================================================
          RIGHT-SIDE BOTTOM LAUNCHER: Cute Glowing Voice AI Assistant Avatar
          ========================================================================= */}
      <div
        className="chatbot-launcher-container"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {!isOpen && (
          <div
            onClick={() => dispatch(toggleChat())}
            style={{
              background: 'rgba(20, 20, 30, 0.92)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: 20,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span>🎙️</span>
            <span>Ask AI</span>
          </div>
        )}

        <button
          className="chatbot-launcher"
          onClick={() => dispatch(toggleChat())}
          aria-label="Open ZESTRO Voice AI Assistant"
          title="Open ZESTRO Voice & Mood AI Assistant"
          id="btn-voice-ai-launcher"
          style={{
            width: 54,
            height: 54,
            borderRadius: '50%',
            background: isOpen
              ? '#1e1e2d'
              : 'linear-gradient(135deg, #e8542a 0%, #a855f7 50%, #3b82f6 100%)',
            border: isOpen ? '1px solid rgba(255,255,255,0.2)' : 'none',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(232, 84, 42, 0.45), 0 0 20px rgba(168, 85, 247, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            cursor: 'pointer',
            transition: 'all 0.25s ease',
          }}
        >
          {isOpen ? '✕' : '🤖'}
        </button>
      </div>

      {/* =========================================================================
          RIGHT-SIDE BOTTOM SMALL CHATBOT WINDOW
          ========================================================================= */}
      {isOpen && (
        <div
          className="chatbot-window card"
          id="zestro-voice-ai-window"
          style={{
            position: 'fixed',
            bottom: 86,
            right: 24,
            width: 390,
            maxWidth: 'calc(100vw - 32px)',
            height: 550,
            maxHeight: 'calc(100vh - 120px)',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(168, 85, 247, 0.2)',
            zIndex: 9999,
            background: 'radial-gradient(120% 120% at 50% 0%, #1e1e2e 0%, #14141e 100%)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(232, 84, 42, 0.95), rgba(168, 85, 247, 0.95))',
              color: '#fff',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}
              >
                🎙️
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>ZESTRO AI Butler</span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      background: 'rgba(255,255,255,0.25)',
                      padding: '2px 6px',
                      borderRadius: 10,
                      textTransform: 'uppercase',
                    }}
                  >
                    VOICE
                  </span>
                </div>
                <div style={{ fontSize: 11, opacity: 0.9, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#4ade80' }}>●</span> Speak or ask for tailored combos
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute AI Voice' : 'Enable AI Voice'}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#fff',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                }}
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>

              <button
                type="button"
                onClick={() => dispatch(resetChat())}
                title="Clear Chat"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#fff',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                }}
              >
                ↺
              </button>

              <button
                type="button"
                onClick={() => dispatch(toggleChat())}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#fff',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Sensory Mood Chips Carousel */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '8px 10px',
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {CHATBOT_MOOD_PROMPTS.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleQuickPrompt(m.prompt)}
                style={{
                  flexShrink: 0,
                  fontSize: 11.5,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 14,
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  background: 'rgba(168, 85, 247, 0.1)',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s ease',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div
            className="chatbot-messages"
            style={{
              flex: 1,
              padding: 14,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              scrollbarWidth: 'thin',
            }}
          >
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
                <div
                  className={`chat-bubble ${m.from}`}
                  style={{
                    maxWidth: '88%',
                    padding: '10px 14px',
                    borderRadius: m.from === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    fontSize: 13,
                    lineHeight: 1.45,
                    background: m.from === 'user'
                      ? 'linear-gradient(135deg, #e8542a, #f97316)'
                      : 'rgba(255, 255, 255, 0.08)',
                    border: m.from === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                  }}
                >
                  {m.text}
                </div>

                {/* Rich AI Combo Card if returned */}
                {m.combo && (
                  <div
                    style={{
                      width: '100%',
                      marginTop: 8,
                      background: 'linear-gradient(145deg, rgba(35, 30, 50, 0.9), rgba(20, 20, 30, 0.95))',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      borderRadius: 16,
                      padding: 12,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
                        ★ AI CHEF COMBO
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 800, background: '#22c55e', color: '#fff', padding: '2px 6px', borderRadius: 6 }}>
                        SAVE ₹{m.combo.savings}
                      </span>
                    </div>

                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#fff' }}>
                      {m.combo.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                      from <strong>{m.combo.restaurantName}</strong>
                    </div>

                    {/* Mini Macro row */}
                    <div style={{ display: 'flex', gap: 6, margin: '8px 0', fontSize: 10.5 }}>
                      <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 6, color: '#e2e8f0' }}>
                        ⚡ {m.combo.protein}g Protein
                      </span>
                      <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 6, color: '#e2e8f0' }}>
                        {m.combo.spiceLevel}
                      </span>
                    </div>

                    {/* Dishes list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '6px 0' }}>
                      {m.combo.dishes.map(d => (
                        <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#e2e8f0' }}>
                          <span style={{ color: '#a855f7' }}>•</span>
                          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</span>
                          <span style={{ color: 'rgba(255,255,255,0.5)' }}>₹{d.price}</span>
                        </div>
                      ))}
                    </div>

                    {/* Price and Add button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8, marginTop: 6 }}>
                      <div>
                        <span style={{ fontSize: 11, textDecoration: 'line-through', color: 'rgba(255,255,255,0.4)', marginRight: 6 }}>
                          ₹{m.combo.rawTotal}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: '#4ade80' }}>
                          ₹{m.combo.comboPrice}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleActionClick({ action: 'ADD_COMBO_TO_CART', data: m.combo.dishes })}
                        style={{
                          background: 'linear-gradient(135deg, #e8542a, #a855f7)',
                          border: 'none',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: 11.5,
                          padding: '6px 14px',
                          borderRadius: 10,
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(232, 84, 42, 0.35)',
                        }}
                      >
                        ⚡ Add Combo to Cart
                      </button>
                    </div>
                  </div>
                )}

                {/* Render Individual Food Items if returned without combo */}
                {!m.combo && m.items && m.items.length > 0 && (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    {m.items.map(item => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 10,
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          fontSize: 12,
                        }}
                      >
                        <div>
                          <strong style={{ color: '#fff' }}>{item.name}</strong> • <span style={{ color: '#4ade80', fontWeight: 700 }}>₹{item.price}</span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ padding: '2px 8px', fontSize: 11, borderRadius: 6 }}
                          onClick={() => handleAddToCart(item)}
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                {m.actions && m.actions.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {m.actions.map((act, actIdx) => (
                      <button
                        key={actIdx}
                        type="button"
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '5px 12px',
                          borderRadius: 12,
                          background: 'rgba(168, 85, 247, 0.15)',
                          border: '1px solid rgba(168, 85, 247, 0.35)',
                          color: '#c084fc',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleActionClick(act)}
                      >
                        {act.label} →
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Voice Listening Wave Indicator */}
          {listening && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                borderTop: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 11.5,
                color: '#fca5a5',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ animation: 'zcMicListenPulse 1s infinite' }}>🎙️</span>
                <span>Listening... speak now</span>
              </div>
              <button
                type="button"
                onClick={handleMicToggle}
                style={{ background: 'none', border: 'none', color: '#fca5a5', fontWeight: 700, cursor: 'pointer', fontSize: 11 }}
              >
                Done ✓
              </button>
            </div>
          )}

          {/* Input & Voice Area */}
          <form
            className="chatbot-input"
            onSubmit={handleSend}
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(20, 20, 30, 0.8)',
            }}
          >
            {/* Glowing Voice Microphone Button */}
            <button
              type="button"
              onClick={handleMicToggle}
              title={listening ? 'Stop listening' : 'Click to speak craving'}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: 'none',
                background: listening
                  ? 'linear-gradient(135deg, #ef4444, #f97316)'
                  : 'linear-gradient(135deg, #e8542a, #a855f7)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                flexShrink: 0,
                boxShadow: listening ? '0 0 15px rgba(239, 68, 68, 0.6)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon name="mic" size={18} color="#fff" />
            </button>

            <input
              placeholder={listening ? 'Listening to your voice...' : 'Speak or type craving (e.g. biryani under 400)...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 20,
                padding: '8px 14px',
                color: '#fff',
                fontSize: 12.5,
                outline: 'none',
              }}
            />

            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #e8542a, #a855f7)',
                border: 'none',
                color: '#fff',
                fontWeight: 800,
                fontSize: 12,
                padding: '8px 14px',
                borderRadius: 20,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
