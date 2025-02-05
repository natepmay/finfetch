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
    if (isOpen) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <dialog ref={modalRef} onCancel={onClose}>
      {children}
      <button onClick={onClose}>Close</button>
    </dialog>,
    document.body
  );
}
