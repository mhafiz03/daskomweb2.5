import React from 'react';
import Modal from '../Modals/Modal';
import ButtonAuth from './ButtonAuth';

export default function ButtonOption({ openModal, order, mode, onSwitchToRegister, onSwitchToLogin }) {
    const navigateToPage = (targetPage) => {
        window.location.href = targetPage;
    };

    return (
        <>
            <ButtonAuth 
                order={order} 
                mode={mode} 
                navigateToPage={navigateToPage}
                onSwitchToRegister={onSwitchToRegister}
                onSwitchToLogin={onSwitchToLogin}
            />
            <Modal isOpen={openModal} onClose={() => openModal(false)} width="w-[350px]" />
        </>
    );
}
