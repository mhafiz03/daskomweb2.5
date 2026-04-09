import React from 'react';

export default function ModalRegist() {
    const handleLoginClick = () => {
        window.location.href = '/login';
    };

    return (
        <div className="flex flex-col items-center justify-center p-6">
            <h1 className="mt-4 text-xl font-bold text-depth-primary">Akun Berhasil Ditambahkan!</h1>
            <button
                className="w-[270px] mt-6 py-2 px-4 bg-[var(--depth-color-primary)] text-lg text-white font-bold rounded-depth-md shadow-depth-md hover:shadow-depth-lg hover:-translate-y-0.5 transition-all duration-300 mb-3"
                onClick={handleLoginClick}
            >
                Masuk
            </button>
        </div>
    );
}