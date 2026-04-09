import { useEffect } from 'react';
import AboutDescription from '@/Components/Praktikans/Sections/AboutDescription';
import Vector from '@/Components/Praktikans/Sections/Vector';


export default function AboutModal({ isOpen, onClose }) {
    useEffect(() => {
        const previousTitle = document.title;
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.title = 'About Us - Daskom Laboratory';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
            document.title = previousTitle;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div 
                className={`relative bg-depth-card rounded-depth-lg shadow-depth-lg max-w-4xl w-full border border-depth transition-all duration-300 ease-out ${
                    isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                }`}
                style={{ maxHeight: '90vh' }}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-depth-full bg-depth-interactive border border-depth shadow-depth-sm hover:shadow-depth-md hover:bg-red-500/10 hover:border-red-500/60 transition-all group"
                >
                    <svg 
                        className="w-5 h-5 text-depth-secondary group-hover:text-red-400 transition-colors" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Content */}
                <div className="flex items-center p-5 overflow-y-auto" style={{ maxHeight: '90vh' }}>
                    <AboutDescription />
                    <Vector />
                </div>
            </div>
        </div>
    );
}
