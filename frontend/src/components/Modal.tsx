import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export function Modal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      modalRef.current?.close();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <dialog
      ref={modalRef}
      onCancel={onClose}
      className="modal fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 backdrop:bg-black/50 p-8 shadow-lg rounded-lg"
    >
      {children}
    </dialog>,
    document.body
  );
}
