import React from 'react';
import ReactDOM from 'react-dom';
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

export default function Modal({ isOpen, onClose, children, width = 'w-full' }) {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className={`relative bg-softGray rounded-lg p-6 ${width} max-w-5xl mx-4 sm:mx-8`}>
                <ModalCloseButton
                    onClick={onClose}
                    ariaLabel="Tutup modal"
                    className="absolute right-2 top-2"
                />
                <div>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
