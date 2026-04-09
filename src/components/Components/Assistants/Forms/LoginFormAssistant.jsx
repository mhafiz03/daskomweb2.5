import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import eyeClose from '../../../../assets/form/eyeClose.png';
import eyeOpen from '../../../../assets/form/eyeOpen.png';
import ButtonOption from '../../Praktikans/Buttons/ButtonOption';
import Modal from '../../Praktikans/Modals/Modal';
import ModalForgotPass from '../Modals/ModalForgotPass';
import { login } from '@/lib/auth';
import { useQueryClient } from '@tanstack/react-query';

export default function LoginFormAssistant({ mode, onSwitchToRegister }) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [values, setValues] = useState({
        kode: '',
        password: '',
    });

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const togglePasswordVisibility = () => {
        setPasswordVisible((prevState) => !prevState);
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    function handleChange(e) {
        const key = e.target.id;
        const value = e.target.value;
        setValues((values) => ({
            ...values,
            [key]: value,
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            const user = await login({
                identifier: values.kode,
                password: values.password,
                userType: 'asisten',
            });
            queryClient.setQueryData(['session'], user);
            toast.success('Login successful!');
            navigate('/assistant', { replace: true });
        } catch (error) {
            toast.error(error?.message ?? 'Login failed! Please check your credentials.');
        }
    }

    return (
        <div className="w-1/2 my-10 px-10">
            <h1 className="font-bold text-3xl text-depth-primary text-center">
                WELCOME!
            </h1>
            <p className="font-bold text-lg text-depth-secondary text-center">
                Please login to start practicum.
            </p>
            <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
                <input
                    className="bg-depth-card py-2 px-4 mt-10 rounded-depth-md border border-depth placeholder-depth-secondary w-full focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:border-transparent transition-all uppercase shadow-depth-sm"
                    type="text"
                    id="kode"
                    value={values.kode}
                    onChange={handleChange}
                    name="kode"
                    placeholder="B0T"
                    maxLength={3}
                />

                <div className="relative">
                    <input
                        className="bg-depth-card py-2 px-4 mt-1 w-full rounded-depth-md border border-depth placeholder-depth-secondary focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:border-transparent transition-all shadow-depth-sm"
                        type={passwordVisible ? 'text' : 'password'}
                        id="password"
                        value={values.password}
                        onChange={handleChange}
                        name="password"
                        placeholder="Password"
                    />
                    <img
                        className="w-4 cursor-pointer absolute top-[55%] right-3 transform -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
                        src={passwordVisible ? eyeOpen : eyeClose}
                        alt="Toggle Password Visibility"
                        onClick={togglePasswordVisibility}
                    />
                </div>
                <ButtonOption order="login" mode={mode} onSwitchToRegister={onSwitchToRegister} />
            </form>
            <div className="relative my-1 text-right">
                <p
                    className="inline-block relative text-sm text-depth-primary font-semibold cursor-pointer group hover:opacity-80 transition-opacity"
                    onClick={openModal}
                >
                    Forgot Password?
                    <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[var(--depth-color-primary)] transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
                </p>
            </div>

            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={closeModal} width="w-[370px]">
                    <ModalForgotPass />
                </Modal>
            )}
        </div>
    );
}
