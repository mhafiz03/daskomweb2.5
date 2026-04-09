import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import eyeClose from '../../../../assets/form/eyeClose.png';
import eyeOpen from '../../../../assets/form/eyeOpen.png';
import ButtonOption from '../Buttons/ButtonOption';
import { useKelasQueryGuess } from '@/hooks/useKelasQuery';
import { api } from '@/lib/api';

const DK_OPTIONS = ["DK1", "DK2"];

export default function RegistFormPraktikan({ mode, onSwitchToLogin }) {
    const navigate = useNavigate();

    const [values, setValues] = useState({
        email: '',
        nama: '',
        nim: '',
        kelas_id: '',
        alamat: '',
        nomor_telepon: '',
        password: '',
        dk: DK_OPTIONS[0],
    });
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [localErrors, setLocalErrors] = useState({});

    const {
        data: kelas = [],
        isLoading: kelasLoading,
        isError: kelasError,
        error: kelasQueryError,
    } = useKelasQueryGuess({
        onError: (err) => {
            toast.error(err.message ?? 'Whoops terjadi kesalahan');
        },
    });

    const togglePasswordVisibility = () => {
        setPasswordVisible((prevState) => !prevState);
    };

    const handleChange = (e) => {
        const key = e.target.id;
        const value = e.target.value;
        setValues((prevValues) => ({
            ...prevValues,
            [key]: value,
        }));
    };

    const validateFields = () => {
        const newErrors = {};

        if (!values.email.trim()) newErrors.email = 'Email is required.';
        if (!values.nama.trim()) newErrors.nama = 'Nama Lengkap is required.';
        if (!values.nim.trim()) newErrors.nim = 'NIM is required.';
        if (!values.kelas_id.trim()) newErrors.kelas_id = 'Kelas is required.';
        if (!values.alamat.trim()) newErrors.alamat = 'Alamat is required.';
        if (!values.nomor_telepon.trim()) newErrors.nomor_telepon = 'No. Telepon is required.';
        if (!values.password.trim()) newErrors.password = 'Password is required.';
        else if (values.password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
        if (!values.dk.trim()) newErrors.dk = 'DK is required.';

        setLocalErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validateFields()) {
            try {
                await api.post("/api/auth/register/praktikan", {
                    email: values.email,
                    nama: values.nama,
                    nim: values.nim,
                    kelasId: values.kelas_id,
                    alamat: values.alamat,
                    nomorTelepon: values.nomor_telepon,
                    password: values.password,
                    dk: values.dk,
                });
                toast.success('Registration finished!');
                setTimeout(() => {
                    if (typeof onSwitchToLogin === "function") {
                        onSwitchToLogin();
                    } else {
                        navigate('/login?mode=praktikan');
                    }
                }, 1500);
            } catch (error) {
                toast.error(error?.response?.data?.error ?? error?.message ?? 'An unexpected error occurred. Please try again.');
            }
        }
    };


    return (
        <div className="w-1/2 my-1 px-10">
            <p className="font-bold text-lg text-depth-secondary text-center">Let's Get Started..</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                    className="bg-depth-card py-2 px-4 mt-3 rounded-depth-md border border-depth placeholder-depth-secondary focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:border-transparent transition-all shadow-depth-sm"
                    type="email"
                    id="email"
                    placeholder="Email"
                    value={values.email}
                    onChange={handleChange}
                />
                {localErrors.email && <p className="text-red-400 text-sm -mt-2">{localErrors.email}</p>}
                <input
                    className="bg-depth-card py-2 px-4 rounded-depth-md border border-depth placeholder-depth-secondary focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:border-transparent transition-all shadow-depth-sm"
                    type="text"
                    id="nama"
                    placeholder="Nama Lengkap"
                    value={values.nama}
                    onChange={handleChange}
                />
                {localErrors.nama && <p className="text-red-400 text-sm -mt-2">{localErrors.nama}</p>}
                <input
                    className="bg-depth-card py-2 px-4 rounded-depth-md border border-depth placeholder-depth-secondary focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:border-transparent transition-all shadow-depth-sm"
                    type="text"
                    id="nim"
                    placeholder="NIM"
                    value={values.nim}
                    onChange={handleChange}
                />
                {localErrors.nim && <p className="text-red-400 text-sm -mt-2">{localErrors.nim}</p>}

                <select
                    className="bg-depth-card py-2 px-4 rounded-depth-md border border-depth placeholder-depth-secondary text-depth-primary focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:border-transparent transition-all shadow-depth-sm w-full"
                    id="kelas_id"
                    value={values.kelas_id}
                    onChange={handleChange}
                >
                    <option value="" disabled>
                        Pilih Kelas
                    </option>
                    {kelasLoading && <option value="" disabled>Memuat kelas...</option>}
                    {kelasError && (
                        <option value="" disabled>
                            {kelasQueryError?.message ?? 'Gagal memuat kelas'}
                        </option>
                    )}
                    {!kelasLoading && !kelasError && kelas
                        .filter((k) => !k.kelas.startsWith("TOT"))
                        .map((k) => (
                            <option key={k.id} value={k.id}>
                                {k.kelas}
                            </option>
                        ))}
                </select>
                {localErrors.kelas_id && <p className="text-red-400 text-sm -mt-2">{localErrors.kelas_id}</p>}
                <div className="flex flex-col">
                    <select
                        className="bg-depth-card py-2 px-4 rounded-depth-md border border-depth text-depth-primary focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:border-transparent transition-all shadow-depth-sm"
                        id="dk"
                        value={values.dk}
                        onChange={handleChange}
                    >
                        {DK_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                    {localErrors.dk && <p className="text-red-400 text-sm mt-1">{localErrors.dk}</p>}
                </div>
                <input
                    className="bg-depth-card py-2 px-4 rounded-depth-md border border-depth placeholder-depth-secondary focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:border-transparent transition-all shadow-depth-sm"
                    type="text"
                    id="alamat"
                    placeholder="Alamat"
                    value={values.alamat}
                    onChange={handleChange}
                />
                {localErrors.alamat && <p className="text-red-400 text-sm -mt-2">{localErrors.alamat}</p>}
                <input
                    className="bg-depth-card py-2 px-4 rounded-depth-md border border-depth placeholder-depth-secondary focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:border-transparent transition-all shadow-depth-sm"
                    type="tel"
                    id="nomor_telepon"
                    placeholder="No. Telepon"
                    value={values.nomor_telepon}
                    onChange={handleChange}
                />
                {localErrors.nomor_telepon && <p className="text-red-400 text-sm -mt-2">{localErrors.nomor_telepon}</p>}
                <div className="relative">
                    <input
                        className="bg-depth-card py-2 px-4 mb-3 w-full rounded-depth-md border border-depth placeholder-depth-secondary focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:border-transparent transition-all shadow-depth-sm"
                        type={passwordVisible ? 'text' : 'password'}
                        id="password"
                        placeholder="Password"
                        value={values.password}
                        onChange={handleChange}
                    />
                    <img
                        className="w-4 cursor-pointer absolute top-[30%] right-3 transform -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
                        src={passwordVisible ? eyeOpen : eyeClose}
                        alt="Toggle Password Visibility"
                        onClick={togglePasswordVisibility}
                    />
                    {localErrors.password && <p className="text-red-400 text-sm -mt-2">{localErrors.password}</p>}
                </div>
                <ButtonOption order="register" mode="praktikan" onSwitchToLogin={onSwitchToLogin} />
            </form>
        </div>
    );
}
