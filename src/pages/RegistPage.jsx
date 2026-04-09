import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast, { Toaster } from "react-hot-toast";
import RegistFormPraktikan from '../components/Components/Praktikans/Forms/RegistFormPraktikan';
import RegistFormAssistant from '../components/Components/Assistants/Forms/RegistFormAssistant';
import Vector from '../components/Components/Praktikans/Sections/Vector';

export default function RegistPage() {
    const location = useLocation();
    const [mode, setMode] = useState('praktikan');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const currentMode = params.get('mode') || 'praktikan';
        setMode(currentMode);
    }, [location.search]);

    return (
        <>
            <div className="bg-depth-background min-h-screen flex items-center justify-center p-4">
                <Toaster />
                <div className="bg-depth-card flex rounded-depth-lg shadow-depth-lg max-w-4xl w-full p-5 border border-depth">
                    {mode === 'praktikan' ? (
                        <RegistFormPraktikan mode={mode} />
                    ) : (
                        <RegistFormAssistant mode={mode} />
                    )}
                    <Vector />
                </div>
            </div>
        </>
    );
}
