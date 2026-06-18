// src/context/ModalContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import Modal from "../components/Modal/Modal";

const ModalContext = createContext({
  openModal: () => {},
  closeModal: () => {},
});

export function ModalProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [modalProps, setModalProps] = useState({});
  const modalRef = useRef({});

  const openModal = useCallback((props = {}) => {
    // props pode ter: title, children (ou content), buttons, onClose
    modalRef.current = props;
    setModalProps(props);
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    // chama o onClose que o usuário pode ter passado (opcional)
    try {
      modalRef.current?.onClose?.();
    } finally {
      modalRef.current = {};
    }
  }, []);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}

      <Modal
        open={open}
        title={modalProps.title}
        onClose={closeModal}
        buttons={modalProps.buttons}
      >
        {/* suporta tanto modalProps.children quanto modalProps.content */}
        {modalProps.children ?? modalProps.content ?? null}
      </Modal>
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}
