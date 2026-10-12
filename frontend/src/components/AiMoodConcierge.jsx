import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addToCart } from '../redux/slices/cartSlice';
import { useToast } from '../contexts/ToastContext';
import { useLoginModal } from '../contexts/LoginModalContext';
import { RESTAURANTS, FOODS } from '../data/mockData';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import SafeImage from './SafeImage';
import Icon from './Icon';
import './AiMoodConcierge.css';

// 8 Rich Curated Sensory Moods
export const CONCIERGE_MOODS = [
  {
    id: 'late-night',
    name: 'Late-Night Munchies',
    emoji: '🌙',
    tag: 'Savory & Heavy',
    accent: '#8b5cf6',
    desc: 'Deep cravings after dark — hot biryani, spicy chicken, and rich gravies.',
    keywords: ['biryani', 'chicken', 'fried', 'parotta', 'kothu', 'gravy', 'curry'],
    defaultBudget: 500,
  },
  {
    id: 'gym-protein',
    name: 'Gym & High Protein',
    emoji: '🏋️',
    tag: '40g+ Protein',
    accent: '#3b82f6',
    desc: 'Lean grilled cuts, tandoori starters, paneer tikka, and clean fuel.',
    keywords: ['tandoori', 'chicken', 'grilled', 'egg', 'paneer', 'tikka', 'fish'],
    defaultBudget: 500,
  },
  {
    id: 'rainy-crispy',
    name: 'Rainy Day Hot & Crispy',
    emoji: '🌧️',
    tag: 'Hot & Crunchy',
    accent: '#f59e0b',
    desc: 'Piping hot rasam, crispy vadai, pakoda, spicy pepper starters, and tea.',
    keywords: ['rasam', 'soup', 'vadai', 'crispy', 'fry', 'pepper', 'chai', 'tea', 'coffee'],
    defaultBudget: 350,
  },
  {
    id: 'budget-beast',
    name: 'Budget Beast (Under ₹250)',
    emoji: '💰',
    tag: 'Max Value',
    accent: '#10b981',
    desc: 'Super pocket-friendly, belly-filling thalis, dosas, and parottas.',
    keywords: ['meals', 'thali', 'dosa', 'idli', 'parotta', 'rice', 'sambar'],
    defaultBudget: 250,
  },
  {
    id: 'squad-feast',
    name: 'Squad Feast (3-4 People)',
    emoji: '🎉',
    tag: 'Sharable Platters',
    accent: '#ec4899',
    desc: 'Bucket biryanis, mixed starters, bread baskets, and drinks for the whole gang.',
    keywords: ['biriyani', 'biryani', 'bucket', 'platter', 'family', 'combo', 'chicken'],
    defaultBudget: 1000,
  },
  {
    id: 'guilt-free',
    name: 'Guilt-Free Clean Eats',
    emoji: '🥗',
    tag: 'Light & Fresh',
    accent: '#14b8a6',
    desc: 'Pure veg specialties, fresh curd rice, vegetable soups, and fruit juices.',
    keywords: ['veg', 'curd', 'salad', 'juice', 'soup', 'idli', 'millet'],
    defaultBudget: 350,
  },
  {
    id: 'fiery-spice',
    name: 'Fiery Chettinad Spice',
    emoji: '🔥',
    tag: 'Tear-Inducing Hot',
    accent: '#ef4444',
    desc: 'Real South Indian black pepper, chukka, fiery mutton gravies, and salna.',
    keywords: ['spicy', 'pepper', 'chukka', 'chettinad', 'salna', 'chilli', 'dry'],
    defaultBudget: 500,
  },
  {
    id: 'sweet-therapy',
    name: 'Sweet Tooth Therapy',
    emoji: '🍨',
    tag: 'Dessert Heaven',
    accent: '#d946ef',
    desc: 'Kovilpatti sweets, hot ghee halwa, falooda, milkshakes, and pastries.',
    keywords: ['halwa', 'sweet', 'ice cream', 'shake', 'dessert', 'falooda', 'gulab'],
    defaultBudget: 300,
  },
];

// Helper to open AI Concierge from anywhere in the app
export function openAiConcierge(options = {}) {
  window.dispatchEvent(new CustomEvent('open-zestro-concierge', { detail: options }));
}

export default function AiMoodConcierge() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { openLoginToOrderModal } = useLoginModal();

  const currentUser = useSelector(s => s.auth?.currentUser);
  const userLocation = useSelector(s => s.user?.location || 'Kovilpatti');
  const reduxRestaurants = useSelector(s => s.restaurant?.restaurants);
  const allRestaurants = reduxRestaurants && reduxRestaurants.length > 0 ? reduxRestaurants : RESTAURANTS;

  // Modal Open/Close State
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMoodId, setSelectedMoodId] = useState('late-night');
  const [dietFilter, setDietFilter] = useState('all'); // 'all' | 'veg' | 'non-veg'
  const [budgetFilter, setBudgetFilter] = useState('all'); // 'all' | 'under250' | 'under500'
  const [partySize, setPartySize] = useState('couple'); // 'solo' | 'couple' | 'gang'
  const [customQuery, setCustomQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [addedComboId, setAddedComboId] = useState(null);

  // Speech Recognition Hook
  const { listening, start: startListening, stop: stopListening, supported: speechSupported, transcript, setTranscript } = useSpeechRecognition();
  const lastTranscriptRef = useRef('');

  // Listen for global open events
  useEffect(() => {
    const handleOpen = (e) => {
      const detail = e?.detail || {};
      if (detail.mood) setSelectedMoodId(detail.mood);
      if (detail.prompt) setCustomQuery(detail.prompt);
      setIsOpen(true);
    };
    window.addEventListener('open-zestro-concierge', handleOpen);
    return () => window.removeEventListener('open-zestro-concierge', handleOpen);
  }, []);

  // Update query when voice transcript changes
  useEffect(() => {
    if (transcript && transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript;
      setCustomQuery(transcript);
      // Auto-detect mood from speech
      const lower = transcript.toLowerCase();
      const detected = CONCIERGE_MOODS.find(m => 
        lower.includes(m.name.toLowerCase()) || 
        m.keywords.some(k => lower.includes(k))
      );
      if (detected) {
        setSelectedMoodId(detected.id);
      }
    }
  }, [transcript]);

  // Voice Speech Synthesis response
  const speakText = useCallback((text) => {
    if (!soundEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore audio errors
    }
  }, [soundEnabled]);

  // Current active mood
  const currentMood = useMemo(() => {
    return CONCIERGE_MOODS.find(m => m.id === selectedMoodId) || CONCIERGE_MOODS[0];
  }, [selectedMoodId]);

  // Filter restaurants in current location
  const locationRestaurants = useMemo(() => {
    const locLower = (userLocation || 'Kovilpatti').toLowerCase();
    const matched = allRestaurants.filter(r => {
      const area = r.area || r.city || r.address?.city || r.address?.area;
      return !userLocation || userLocation === 'All' || (area && area.toLowerCase().includes(locLower));
    });
    return matched.length > 0 ? matched : allRestaurants;
  }, [allRestaurants, userLocation]);

  // Generate Dynamic AI Curated Combos
  const curatedCombos = useMemo(() => {
    const combos = [];
    const keywords = currentMood.keywords;

    // Pick 2-3 top restaurants in the area
    const candidateRests = locationRestaurants.slice(0, 5);

    candidateRests.forEach((restaurant, restIdx) => {
      const restKey = restaurant.id || restaurant._id;
      // Get food items from this restaurant
      let restFoods = FOODS.filter(f => f.restaurantId === restKey);
      if (restFoods.length === 0) {
        restFoods = FOODS.slice(0, 8); // fallback
      }

      // Apply diet filter
      if (dietFilter === 'veg') {
        restFoods = restFoods.filter(f => f.veg);
      } else if (dietFilter === 'non-veg') {
        restFoods = restFoods.filter(f => !f.veg);
      }

      // Match items by mood keywords or bestseller
      const matchedItems = restFoods.filter(f => {
        const text = `${f.name} ${f.description || ''} ${f.category || ''}`.toLowerCase();
        return keywords.some(k => text.includes(k)) || f.isBestseller;
      });

      // Target item count based on party size
      const targetCount = partySize === 'solo' ? 2 : partySize === 'gang' ? 4 : 3;

      let selectedDishes = matchedItems.slice(0, targetCount);
      // If not enough matched, top up with other dishes from same restaurant
      if (selectedDishes.length < targetCount) {
        const remaining = restFoods.filter(f => !selectedDishes.some(s => s.id === f.id));
        selectedDishes = [...selectedDishes, ...remaining.slice(0, targetCount - selectedDishes.length)];
      }

      if (selectedDishes.length >= 2) {
        const rawTotal = selectedDishes.reduce((sum, d) => sum + (d.price || 120), 0);
        // Apply budget filter check
        if (budgetFilter === 'under250' && rawTotal > 320) return;
        if (budgetFilter === 'under500' && rawTotal > 650) return;

        // Dynamic 18% to 22% AI Combo Savings
        const discountRate = 0.20;
        const comboPrice = Math.round(rawTotal * (1 - discountRate));
        const savings = rawTotal - comboPrice;

        // Calorie & Protein Estimate
        const totalCalories = selectedDishes.length * 280 + Math.floor(Math.random() * 80);
        const totalProtein = selectedDishes.some(d => !d.veg) ? 38 + Math.floor(Math.random() * 15) : 18 + Math.floor(Math.random() * 10);
        const spiceLevel = selectedDishes.some(d => d.spicy) ? 'Fiery Hot 🔥' : 'Balanced Mild ✨';

        combos.push({
          id: `combo-${currentMood.id}-${restKey}-${restIdx}`,
          title: `${currentMood.name} ${partySize === 'gang' ? 'Platter' : 'Combo'}`,
          restaurantId: restKey,
          restaurantName: restaurant.name,
          rating: restaurant.rating || '4.8',
          deliveryTime: restaurant.deliveryTimeMin || 25,
          dishes: selectedDishes,
          rawTotal,
          comboPrice,
          savings,
          calories: totalCalories,
          protein: totalProtein,
          spiceLevel,
          featured: restIdx === 0,
        });
      }
    });

    return combos.slice(0, 3);
  }, [currentMood, locationRestaurants, dietFilter, budgetFilter, partySize]);

  // Handle Adding entire combo to cart
  const handleAddComboToCart = (combo) => {
    if (!currentUser) {
      openLoginToOrderModal({
        id: combo.id,
        name: combo.title,
        price: combo.comboPrice,
        restaurantId: combo.restaurantId,
        restaurantName: combo.restaurantName,
      });
      showToast('🔒 Please sign in to add this AI combo pack to your cart!', 'info');
      return;
    }

    // Add each dish in the combo to cart
    combo.dishes.forEach((dish) => {
      dispatch(addToCart({
        foodId: dish.id,
        name: dish.name,
        price: dish.price,
        restaurantId: combo.restaurantId,
        restaurantName: combo.restaurantName,
        image: dish.image,
        qty: 1,
      }));
    });

    setAddedComboId(combo.id);
    showToast(`🎉 Added ${combo.title} (${combo.dishes.length} dishes) from ${combo.restaurantName} to cart! Saved ₹${combo.savings}!`, 'success');
    speakText(`Added ${combo.title} to your cart! You saved ${combo.savings} rupees.`);

    setTimeout(() => {
      setAddedComboId(null);
    }, 2500);
  };

  // Trigger speech response when mood changes
  const handleSelectMood = (mood) => {
    setSelectedMoodId(mood.id);
    speakText(`Curating ${mood.name} combos for ${userLocation}.`);
  };

  // Handle custom text submit
  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    const lower = customQuery.toLowerCase();
    const detected = CONCIERGE_MOODS.find(m => 
      lower.includes(m.name.toLowerCase()) || 
      m.keywords.some(k => lower.includes(k))
    );
    if (detected) {
      setSelectedMoodId(detected.id);
      speakText(`Found matching ${detected.name} recommendations!`);
    } else {
      speakText(`Searching for dishes matching ${customQuery}`);
    }
  };

  return (
    <>
      {/* =========================================================================
          FLOATING QUICK ACCESS TRIGGER (Visible on Customer Screens)
          ========================================================================= */}
      <div 
        className="zc-floating-trigger"
        onClick={() => setIsOpen(true)}
        title="Ask ZESTRO AI Voice & Mood Dining Concierge"
        id="zc-floating-launcher"
      >
        <div className="zc-trigger-orb">✨</div>
        <span>AI Concierge</span>
        <span className="zc-trigger-badge">VOICE</span>
      </div>

      {/* =========================================================================
          INTERACTIVE CONCIERGE MODAL OVERLAY
          ========================================================================= */}
      {isOpen && (
        <div className="zestro-concierge-backdrop" onClick={() => setIsOpen(false)}>
          <div 
            className="zestro-concierge-modal" 
            onClick={e => e.stopPropagation()}
            id="zestro-concierge-window"
          >
            {/* Header */}
            <div className="zc-header">
              <div className="zc-header-left">
                <div className="zc-ai-orb">🎙️</div>
                <div className="zc-header-title-box">
                  <h3>
                    ZESTRO AI Concierge
                    <span className="zc-ai-pill">VOICE &amp; MOOD</span>
                  </h3>
                  <p>Smart dining butler curating authentic restaurant combos in {userLocation}</p>
                </div>
              </div>

              <div className="zc-header-actions">
                <button
                  type="button"
                  className="zc-header-btn"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'Mute AI Voice Responses' : 'Enable AI Voice Responses'}
                >
                  {soundEnabled ? '🔊' : '🔇'}
                </button>
                <button
                  type="button"
                  className="zc-header-btn zc-close-btn"
                  onClick={() => setIsOpen(false)}
                  title="Close AI Concierge"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="zc-body">
              {/* Voice & Search Hero Area */}
              <div className="zc-voice-hero">
                <div className="zc-mic-btn-wrap">
                  <button
                    type="button"
                    className={`zc-mic-btn ${listening ? 'listening' : ''}`}
                    onClick={() => {
                      if (listening) {
                        stopListening();
                      } else {
                        if (speechSupported) {
                          startListening();
                        } else {
                          showToast('Voice recognition is not supported in this browser.', 'info');
                        }
                      }
                    }}
                    title={listening ? 'Listening... click to stop' : 'Click and speak your food craving'}
                  >
                    <Icon name="mic" size={32} color="#fff" />
                  </button>
                </div>

                {listening && (
                  <div className="zc-soundwave">
                    <div className="zc-soundwave-bar" />
                    <div className="zc-soundwave-bar" />
                    <div className="zc-soundwave-bar" />
                    <div className="zc-soundwave-bar" />
                    <div className="zc-soundwave-bar" />
                  </div>
                )}

                <p className="zc-prompt-status">
                  {listening ? (
                    <span>Listening... <span className="zc-prompt-highlight">{transcript || 'Say "Spicy biryani combo under 500"'}</span></span>
                  ) : customQuery ? (
                    <span>Recognized: <strong style={{ color: '#c084fc' }}>"{customQuery}"</strong></span>
                  ) : (
                    <span>Tap the microphone or choose your mood below for instant chef combos.</span>
                  )}
                </p>

                {/* Quick typed prompt bar */}
                <form className="zc-input-bar" onSubmit={handleCustomSubmit}>
                  <Icon name="search" size={16} color="rgba(255, 255, 255, 0.4)" />
                  <input
                    type="text"
                    placeholder="Or type craving (e.g. late night biryani, high protein dinner, tea combo)..."
                    value={customQuery}
                    onChange={e => setCustomQuery(e.target.value)}
                  />
                  <button type="submit" className="zc-input-submit">
                    <span>Curate</span>
                    <span>→</span>
                  </button>
                </form>
              </div>

              {/* 8 Curated Mood Chips */}
              <div>
                <div className="zc-section-head">
                  <h4>
                    <span>🎭</span>
                    <span>What's Your Vibe Right Now?</span>
                  </h4>
                  <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.45)' }}>
                    Active: <strong style={{ color: '#fff' }}>{currentMood.name}</strong>
                  </span>
                </div>

                <div className="zc-moods-grid">
                  {CONCIERGE_MOODS.map(mood => (
                    <div
                      key={mood.id}
                      className={`zc-mood-chip ${selectedMoodId === mood.id ? 'active' : ''}`}
                      style={{ '--chip-accent': mood.accent }}
                      onClick={() => handleSelectMood(mood)}
                    >
                      <div className="zc-mood-top">
                        <span className="zc-mood-emoji">{mood.emoji}</span>
                        <span className="zc-mood-tag">{mood.tag}</span>
                      </div>
                      <div className="zc-mood-name">{mood.name}</div>
                      <div className="zc-mood-desc">{mood.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Preferences Filter Ribbon */}
              <div className="zc-filter-ribbon">
                <div className="zc-filter-group">
                  <span className="zc-filter-label">Diet:</span>
                  <button
                    type="button"
                    className={`zc-pill-toggle ${dietFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setDietFilter('all')}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`zc-pill-toggle ${dietFilter === 'veg' ? 'active' : ''}`}
                    onClick={() => setDietFilter('veg')}
                  >
                    🥦 Pure Veg
                  </button>
                  <button
                    type="button"
                    className={`zc-pill-toggle ${dietFilter === 'non-veg' ? 'active' : ''}`}
                    onClick={() => setDietFilter('non-veg')}
                  >
                    🍗 Non-Veg
                  </button>
                </div>

                <div className="zc-filter-group" style={{ marginLeft: 'auto' }}>
                  <span className="zc-filter-label">Party:</span>
                  <button
                    type="button"
                    className={`zc-pill-toggle ${partySize === 'solo' ? 'active' : ''}`}
                    onClick={() => setPartySize('solo')}
                  >
                    Solo (1)
                  </button>
                  <button
                    type="button"
                    className={`zc-pill-toggle ${partySize === 'couple' ? 'active' : ''}`}
                    onClick={() => setPartySize('couple')}
                  >
                    Duo (2)
                  </button>
                  <button
                    type="button"
                    className={`zc-pill-toggle ${partySize === 'gang' ? 'active' : ''}`}
                    onClick={() => setPartySize('gang')}
                  >
                    Squad (3-4)
                  </button>
                </div>
              </div>

              {/* AI Curated Combos List */}
              <div>
                <div className="zc-section-head">
                  <h4>
                    <span>✨</span>
                    <span>AI Curated Combos for {currentMood.name}</span>
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 700 }}>
                    1-Click Instant Cart Bundles
                  </span>
                </div>

                <div className="zc-combos-container">
                  {curatedCombos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.5)' }}>
                      No combos found matching this filter in {userLocation}. Try switching diet or budget!
                    </div>
                  ) : (
                    curatedCombos.map(combo => (
                      <div
                        key={combo.id}
                        className={`zc-combo-card ${combo.featured ? 'featured' : ''}`}
                      >
                        <div className="zc-combo-top">
                          <div className="zc-combo-title-wrap">
                            <div className="zc-combo-badge-row">
                              {combo.featured && (
                                <span className="zc-tag-pill chef">★ CHEF SIGNATURE</span>
                              )}
                              <span className="zc-tag-pill save">SAVE ₹{combo.savings}</span>
                            </div>
                            <h3 className="zc-combo-name">{combo.title}</h3>
                            <div className="zc-combo-rest">
                              <span>from <strong>{combo.restaurantName}</strong></span>
                              <span className="zc-combo-rating">★ {combo.rating}</span>
                              <span>• {combo.deliveryTime} mins delivery</span>
                            </div>
                          </div>

                          <div className="zc-combo-meta-badges">
                            <span className="zc-meta-chip">⚡ {combo.protein}g Protein</span>
                            <span className="zc-meta-chip">🔥 {combo.spiceLevel}</span>
                            <span className="zc-meta-chip">🥗 ~{combo.calories} kcal</span>
                          </div>
                        </div>

                        {/* Food Items Mini Grid */}
                        <div className="zc-combo-items-row">
                          {combo.dishes.map(dish => (
                            <div key={dish.id} className="zc-food-item-mini">
                              <SafeImage
                                src={dish.image?.src || dish.image}
                                alt={dish.name}
                                className="zc-food-mini-img"
                              />
                              <div className="zc-food-mini-info">
                                <div className="zc-food-mini-name">{dish.name}</div>
                                <div className="zc-food-mini-details">
                                  <span>{dish.veg ? '🥦 Veg' : '🍗 Non-Veg'}</span>
                                  <span className="zc-food-mini-price">₹{dish.price}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Combo Footer */}
                        <div className="zc-combo-footer">
                          <div className="zc-combo-price-box">
                            <span className="zc-price-strike">₹{combo.rawTotal}</span>
                            <span className="zc-price-current">₹{combo.comboPrice}</span>
                            <span className="zc-price-save-text">
                              (Instant 20% Bundle Discount)
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              type="button"
                              className={`zc-add-combo-btn ${addedComboId === combo.id ? 'added' : ''}`}
                              onClick={() => handleAddComboToCart(combo)}
                            >
                              {addedComboId === combo.id ? (
                                <>
                                  <span>✓</span>
                                  <span>Added to Cart!</span>
                                </>
                              ) : (
                                <>
                                  <span>⚡</span>
                                  <span>Add Entire Combo to Cart</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              className="zc-pill-toggle"
                              style={{ padding: '0 16px', borderRadius: '12px' }}
                              onClick={() => {
                                setIsOpen(false);
                                navigate('/cart');
                              }}
                            >
                              View Cart →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
