import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import eyeClose from '../../../../assets/form/eyeClose.png';
import eyeOpen from '../../../../assets/form/eyeOpen.png';
import ButtonOption from '../../Praktikans/Buttons/ButtonOption';
import { api } from '@/lib/api';
import { useRolesQuery } from '@/hooks/useRolesQuery';

export default function RegistFormAssistant({ mode, onSwitchToLogin }) {
    const navigate = useNavigate();
    
    const [values, setValues] = useState({
        nama: '',
        deskripsi: '',
        nomor_telepon: '',
        id_line: '',
        instagram: '',
        role_id: '',
        kode: '',
        password: '',
    });

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [localErrors, setLocalErrors] = useState({});

    const {
        data: roles = [],
        isLoading: rolesLoading,
        isError: rolesError,
        error: rolesQueryError,
    } = useRolesQuery({
        onError: (err) => {
            toast.error(err.message ?? 'Whoops terjadi kesalahan');
        },
    });

    const togglePasswordVisibility = () => {
        setPasswordVisible((prevState) => !prevState);
    };

    const handleChange = (e) => {

        const key = e.target.id;
        let value = e.target.value;

        // Convert specific fields to uppercase
        if (key === "kode") {
            value = value.toUpperCase();
        }
        setValues((prevValues) => ({
            ...prevValues,
            [key]: value,
        }));
    };

    const validateFields = () => {
        const newErrors = {};

        if (!values.nama.trim()) newErrors.nama = 'Nama is required.';
        if (!values.deskripsi.trim()) newErrors.deskripsi = 'Deskripsi is required.';
        if (!values.nomor_telepon.trim()) newErrors.nomor_telepon = 'Nomor Telepon is required.';
        if (!values.id_line.trim()) newErrors.id_line = 'ID Line is required.';
        if (!values.instagram.trim()) newErrors.instagram = 'Instagram is required.';
        if (!values.kode.trim()) newErrors.kode = 'Kode Asisten is required.';
        if (!values.password.trim()) newErrors.password = 'Password is required.';

        setLocalErrors(newErrors);

        // Return true if there are no errors
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validateFields()) {
            try {
                const selectedRole = roles.find((role) => String(role.id) === String(values.role_id));
                await api.post("/api/auth/register/asisten", {
                    nama: values.nama,
                    deskripsi: values.deskripsi,
                    nomorTelepon: values.nomor_telepon,
                    idLine: values.id_line,
                    instagram: values.instagram,
                    kode: values.kode,
                    password: values.password,
                    asistenRole: selectedRole?.name ?? values.role_id,
                });
                toast.success('Registration finished!');
                setTimeout(() => {
                    if (typeof onSwitchToLogin === "function") {
                        onSwitchToLogin();
                    } else {
                        navigate('/login?mode=assistant');
                    }
                }, 500);
            } catch (error) {
                const message = error?.response?.data?.error ?? error?.message ?? 'An unexpected error occurred. Please try again.';
                toast.error(message);
            }
        }
    };
    
    return (
        <div className="w-1/2 my-10 px-10">
            <h1 className="font-bold text-3xl text-depth-primary text-center">
                REGISTER
            </h1>
            <p className="font-bold text-lg text-depth-secondary text-center">Let's create your account!</p>
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                <div>
                    <input
                        className={`bg-depth-card py-2 px-4 mt-4 rounded-depth-md border ${
                            localErrors.nama ? 'border-red-500' : 'border-depth'
                        } placeholder-depth-secondary w-full focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:border-transparent transition-all shadow-depth-sm`}
                        type="text"
                        id="nama"
                        value={values.nama}
                        onChange={handleChange}
                        placeholder="Nama Lengkap"
                    />
                    {localErrors.nama && <p className="text-red-400 text-sm mt-1">{localErrors.nama}</p>}
                    
                </div>
                <div>
                    <input
                        className={`bg-depth-card py-2 px-4 rounded-depth-md border ${
                            localErrors.deskripsi ? 'border-red-500' : 'border-depth'
                        } placeholder-depth-secondary w-full focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:border-transparent transition-all shadow-depth-sm`}
                        type="text"
                        id="deskripsi"
                        value={values.deskripsi}
                        onChange={handleChange}
                        placeholder="Deskripsi"
                    />
                    {localErrors.deskripsi && <p className="text-red-400 text-sm mt-1">{localErrors.deskripsi}</p>}
                </div>
                <div>
                    <input
                        className={`bg-depth-card py-2 px-4 rounded-depth-md border ${
                            localErrors.nomor_telepon ? 'border-red-500' : 'border-depth'
                        } placeholder-depth-secondary w-full focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:border-transparent transition-all shadow-depth-sm`}
                        type="tel"
                        id="nomor_telepon"
                        value={values.nomor_telepon}
                        onChange={handleChange}
                        placeholder="No. Telepon"
                    />
                    {localErrors.nomor_telepon && <p className="text-red-400 text-sm mt-1">{localErrors.nomor_telepon}</p>}
                </div>
                <div>
                    <input
                        className={`bg-depth-card py-2 px-4 rounded-depth-md border ${
                            localErrors.id_line ? 'border-red-500' : 'border-depth'
                        } placeholder-depth-secondary w-full focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:border-transparent transition-all shadow-depth-sm`}
                        type="text"
                        id="id_line"
                        value={values.id_line}
                        onChange={handleChange}
                        placeholder="ID Line"
                    />
                    {localErrors.id_line && <p className="text-red-400 text-sm mt-1">{localErrors.id_line}</p>}
                </div>
                <div>
                    <input
                        className={`bg-depth-card py-2 px-4 rounded-depth-md border ${
                            localErrors.instagram ? 'border-red-500' : 'border-depth'
                        } placeholder-depth-secondary w-full focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:border-transparent transition-all shadow-depth-sm`}
                        type="text"
                        id="instagram"
                        value={values.instagram}
                        onChange={handleChange}
                        placeholder="Instagram"
                    />
                    {localErrors.instagram && <p className="text-red-400 text-sm mt-1">{localErrors.instagram}</p>}
                </div>
                <div>
                    <select
                        className="bg-depth-card py-2 px-4 rounded-depth-md border border-depth placeholder-depth-secondary text-depth-primary w-full focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:border-transparent transition-all shadow-depth-sm"
                        id="role_id"
                        value={values.role_id}
                        onChange={handleChange}
                    >
                        <option value="" disabled>
                            Pilih Role
                        </option>
                        {rolesLoading && <option value="" disabled>Memuat role...</option>}
                        {rolesError && (
                            <option value="" disabled>
                                {rolesQueryError?.message ?? "Gagal memuat role"}
                            </option>
                        )}
                        {!rolesLoading && !rolesError &&
                            roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.name}
                                </option>
                            ))}
                    </select>
                </div>
                <div>
                    <input
                        className={`bg-depth-card py-2 px-4 rounded-depth-md border ${
                            localErrors.kode ? 'border-red-500' : 'border-depth'
                        } placeholder-depth-secondary w-full focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:border-transparent transition-all shadow-depth-sm uppercase`}
                        type="text"
                        id="kode"
                        value={values.kode}
                        onChange={handleChange}
                        placeholder="Kode Asisten"
                        maxLength={3}
                    />
                    {localErrors.kode && <p className="text-red-400 text-sm mt-1">{localErrors.kode}</p>}
                </div>
                <div className="relative">
                    <input
                        className={`bg-depth-card py-2 px-4 rounded-depth-md border ${
                            localErrors.password ? 'border-red-500' : 'border-depth'
                        } placeholder-depth-secondary w-full focus:outline-none focus:ring-2 focus:ring-[var(--depth-color-primary)] focus:border-transparent transition-all shadow-depth-sm`}
                        type={passwordVisible ? 'text' : 'password'}
                        id="password"
                        value={values.password}
                        onChange={handleChange}
                        placeholder="Password"
                    />
                    <img
                        className="w-4 cursor-pointer absolute top-[50%] right-3 transform -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
                        src={passwordVisible ? eyeOpen : eyeClose}
                        alt="Toggle Password Visibility"
                        onClick={togglePasswordVisibility}
                    />
                </div>
                <div>
                    {localErrors.password && <p className="text-red-400 text-sm mt-1">{localErrors.password}</p>}

                </div>
                <ButtonOption order="register" mode={mode} onSwitchToLogin={onSwitchToLogin}/>
            </form>
        </div>
    );
}
