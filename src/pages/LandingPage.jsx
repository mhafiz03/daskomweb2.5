import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingNavbar from '../components/Components/Praktikans/Layout/LandingNavbar';
import MainLanding from '../components/Components/Praktikans/Sections/MainLanding';
import LandingSosmed from '../components/Components/Praktikans/Sections/LandingSosmed';
import LandingFooter from '../components/Components/Praktikans/Layout/LandingFooter';
import AuthModal from '../components/Components/Praktikans/Modals/ModalAuth';
import AboutModal from '../components/Components/Praktikans/Modals/ModalAbout';
import ContactModal from '../components/Components/Praktikans/Modals/ModalContact';

export default function LandingPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [authModal, setAuthModal] = useState({ isOpen: false, type: null, mode: 'praktikan' });
    const [aboutModal, setAboutModal] = useState(false);
    const [contactModal, setContactModal] = useState(false);

    useEffect(() => {
        const path = location.pathname;
        const params = new URLSearchParams(location.search);
        const mode = params.get('mode') || 'praktikan';

        if (path === '/login') {
            setAuthModal({ isOpen: true, type: 'login', mode });
        } else if (path === '/register') {
            setAuthModal({ isOpen: true, type: 'register', mode });
        } else if (path === '/about') {
            setAboutModal(true);
            setContactModal(false);
        } else if (path === '/contact') {
            setContactModal(true);
            setAboutModal(false);
        } else {
            setAboutModal(false);
            setContactModal(false);
        }
    }, [location.pathname, location.search]);

    const openAuthModal = (type, mode = 'praktikan') => {
        setAuthModal({ isOpen: true, type, mode });
        navigate(`/${type}?mode=${mode}`, { replace: true });
    };

    const closeAuthModal = () => {
        setAuthModal({ isOpen: false, type: null, mode: authModal.mode });
        navigate('/', { replace: true });
    };

    const handleModeChange = (newMode) => {
        setAuthModal(prev => ({ ...prev, mode: newMode }));
        navigate(`/${authModal.type}?mode=${newMode}`, { replace: true });
    };

    const handleSwitchType = (newType) => {
        setAuthModal(prev => ({ ...prev, type: newType }));
        navigate(`/${newType}?mode=${authModal.mode}`, { replace: true });
    };

    const openAboutModal = () => {
        setAboutModal(true);
        navigate('/about', { replace: true });
    };
    const closeAboutModal = () => {
        setAboutModal(false);
        navigate('/', { replace: true });
    };
    const openContactModal = () => {
        setContactModal(true);
        navigate('/contact', { replace: true });
    };
    const closeContactModal = () => {
        setContactModal(false);
        navigate('/', { replace: true });
    };

    return (
        <>
            <Toaster />
            <LandingNavbar onAboutClick={openAboutModal} onContactClick={openContactModal} />
            <MainLanding onGetStartedClick={() => openAuthModal('login')} />
            <LandingSosmed />

            <AuthModal
                isOpen={authModal.isOpen}
                onClose={closeAuthModal}
                type={authModal.type}
                mode={authModal.mode}
                onModeChange={handleModeChange}
                onSwitchType={handleSwitchType}
            />

            <AboutModal
                isOpen={aboutModal}
                onClose={closeAboutModal}
            />

            <ContactModal
                isOpen={contactModal}
                onClose={closeContactModal}
            />
        </>
    );
}
