import { submit } from "@/lib/http";
import { destroy as logoutPraktikan } from "@/lib/routes/auth/loginPraktikan";
import ModalCloseButton from "@/Components/Common/ModalCloseButton";

export default function ModalLogout({ onClose, onConfirm }) {
    const handleConfirm = () => {
        if (onConfirm) {
            submit(logoutPraktikan(), {
                data: {},
                onSuccess: () => {
                    // Redirect the user to the login page after a successful logout
                    window.location.href = '/';
                },
                onError: (error) => {
                    // Handle any errors during logout
                    console.error('Logout failed:', error);
                    alert('Something went wrong. Please try again.');
                },
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-softGray p-6 rounded shadow-lg w-1/4 relative">
                {/* Close Button */}
                <ModalCloseButton
                    onClick={onClose}
                    ariaLabel="Tutup konfirmasi logout"
                    className="absolute right-2 top-2"
                />

                <h2 className="text-xl font-bold text-center mt-8 mb-5 text-black">Apakah Kamu Yakin?</h2>

                {/* Yes and No Buttons */}
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        onClick={handleConfirm}
                        className="w-1/3 p-2 bg-deepForestGreen text-white font-semibold rounded hover:bg-darkGreen"
                    >
                        Ya
                    </button>
                    <button
                        onClick={onClose}
                        className="w-1/3 p-2 bg-softRed text-white font-semibold rounded hover:bg-rustyRed"
                    >
                        Tidak
                    </button>
                </div>
            </div>
        </div>
    );
}
