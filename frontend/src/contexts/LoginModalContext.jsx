import React, { createContext, useContext, useState, useCallback } from 'react';
import LoginToOrderModal from '../components/LoginToOrderModal';

const LoginModalContext = createContext(null);

export function LoginModalProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    foodItem: null,
  });

  const openLoginToOrderModal = useCallback((foodItem = null) => {
    setModalState({
      isOpen: true,
      foodItem,
    });
  }, []);

  const closeLoginToOrderModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <LoginModalContext.Provider value={{ openLoginToOrderModal, closeLoginToOrderModal }}>
      {children}
      <LoginToOrderModal
        isOpen={modalState.isOpen}
        onClose={closeLoginToOrderModal}
        foodItem={modalState.foodItem}
      />
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  const context = useContext(LoginModalContext);
  if (!context) {
    return {
      openLoginToOrderModal: () => {},
      closeLoginToOrderModal: () => {},
    };
  }
  return context;
}
