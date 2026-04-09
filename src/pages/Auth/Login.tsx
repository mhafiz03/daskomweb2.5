import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { login, type UserType } from "../../lib/auth";

export default function LoginPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [userType, setUserType] = useState<UserType>("praktikan");
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const user = await login({ identifier, password, userType });
            queryClient.setQueryData(["session"], user);
            navigate(user.userType === "asisten" ? "/assistant" : "/praktikan", { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
                <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">
                    Daskom LMS
                </h1>

                {/* User type selector */}
                <div className="mb-6 flex rounded-lg border overflow-hidden">
                    {(["praktikan", "asisten"] as UserType[]).map(t => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => { setUserType(t); setIdentifier(""); }}
                            className={`flex-1 py-2 text-sm font-medium transition-colors ${
                                userType === t
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            {t === "praktikan" ? "Praktikan" : "Asisten"}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {userType === "praktikan" ? "NIM" : "Kode Asisten"}
                        </label>
                        <input
                            type="text"
                            value={identifier}
                            onChange={e => setIdentifier(e.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={userType === "praktikan" ? "Enter NIM" : "Enter kode"}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? "Signing in…" : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
