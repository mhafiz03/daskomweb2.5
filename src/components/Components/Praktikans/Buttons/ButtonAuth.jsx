import { useState } from 'react';
import Modal from '../Modals/Modal';
import ModalRegist from '../Modals/ModalRegist';

const Separator = () => (
    <div className="grid grid-cols-3 items-center">
        <hr className="border-depth" />
        <p className="text-center text-sm text-depth-secondary">OR</p>
        <hr className="border-depth" />
    </div>
);

export default function ButtonAuth({ order, mode, onSwitchToRegister, onSwitchToLogin }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleSwitchToRegister = (e) => {
        e.preventDefault();
        if (onSwitchToRegister) {
            onSwitchToRegister();
        }
    };

    const handleSwitchToLogin = (e) => {
        e.preventDefault();
        if (onSwitchToLogin) {
            onSwitchToLogin();
        }
    };

    return order === 'login' ? (
        <>
            <button className="w-full mt-2 mb-1 py-2 px-4 bg-[var(--depth-color-primary)] text-lg text-white font-bold rounded-depth-md shadow-depth-md hover:shadow-depth-lg hover:-translate-y-0.5 transition-all duration-300"
            type='submit'>
                Masuk
            </button>
            <Separator />
            <button 
                onClick={handleSwitchToRegister}
                type="button"
                className="w-full mt-1 py-2 px-4 bg-depth-interactive border border-depth text-lg text-depth-primary font-bold rounded-depth-md shadow-depth-sm hover:shadow-depth-md hover:-translate-y-0.5 transition-all duration-300 mb-3"
            >
                Daftar
            </button>
        </>
    ) : (
        <>
            <button
                className="w-full mt-2 mb-1 py-2 px-4 bg-[var(--depth-color-primary)] text-lg text-white font-bold rounded-depth-md shadow-depth-md hover:shadow-depth-lg hover:-translate-y-0.5 transition-all duration-300"
                type='submit'
            >
                Daftar
            </button>
            <Separator />
            <button 
                onClick={handleSwitchToLogin}
                type="button"
                className="w-full mt-1 py-2 px-4 bg-depth-interactive border border-depth text-lg text-depth-primary font-bold rounded-depth-md shadow-depth-sm hover:shadow-depth-md hover:-translate-y-0.5 transition-all duration-300 mb-3"
            >
                Masuk
            </button>
            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={closeModal} width="w-[370px]">
                    <ModalRegist />
                </Modal>
            )}
        </>
    );
}
