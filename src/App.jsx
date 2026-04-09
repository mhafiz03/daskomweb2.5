import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSession, hasPermission } from "./lib/auth";
import LandingPage from "./pages/LandingPage";
import AuditLogs from "./pages/Assistants/AuditLogs";
import HistoryPraktikum from "./pages/Assistants/HistoryPraktikum";
import LeaderboardRanking from "./pages/Assistants/LeaderboardRanking";
import LihatTP from "./pages/Assistants/LihatTP";
import ManagePraktikan from "./pages/Assistants/ManagePraktikan";
import ManageRole from "./pages/Assistants/ManageRole";
import ModulePraktikum from "./pages/Assistants/ModulePraktikum";
import NilaiPraktikan from "./pages/Assistants/NilaiPraktikan";
import PelanggaranAssistant from "./pages/Assistants/PelanggaranAssistant";
import PlottingAssistant from "./pages/Assistants/PlottingAssistant";
import PollingAssistant from "./pages/Assistants/PollingAssistant";
import ProfileAssistant from "./pages/Assistants/ProfileAssistant";
import ResultLaporan from "./pages/Assistants/ResultLaporan";
import ResultLihatTP from "./pages/Assistants/ResultLihatTP";
import SetPraktikan from "./pages/Assistants/SetPraktikan";
import SoalPraktikum from "./pages/Assistants/SoalPraktikum";
import StartPraktikum from "./pages/Assistants/StartPraktikum";
import ComplaintsPage from "./pages/Praktikan/ComplaintsPage";
import ContactAssistant from "./pages/Praktikan/ContactAssistant";
import ModulesPage from "./pages/Praktikan/ModulesPage";
import PollingPage from "./pages/Praktikan/PollingPage";
import PraktikumPage from "./pages/Praktikan/PraktikumPage";
import ProfilePraktikan from "./pages/Praktikan/ProfilePraktikan";
import ScorePraktikan from "./pages/Praktikan/ScorePraktikan";
import TugasPendahuluanPage from "./pages/Praktikan/TugasPendahuluanPage";

function LoadingScreen() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-depth-gradient text-depth-primary">
            <div className="rounded-depth-lg border border-depth bg-depth-card px-6 py-4 shadow-depth-md">
                Loading...
            </div>
        </div>
    );
}

function UnauthorizedPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-depth-gradient px-6 text-depth-primary">
            <div className="max-w-md rounded-depth-lg border border-depth bg-depth-card px-8 py-6 text-center shadow-depth-md">
                <h1 className="text-2xl font-bold text-red-500">403 - Unauthorized</h1>
                <p className="mt-2 text-depth-secondary">You do not have permission to view this page.</p>
            </div>
        </div>
    );
}

function defaultRouteFor(user) {
    return user?.userType === "asisten" ? "/assistant" : "/praktikan";
}

function ProtectedRoute({ user, allowedUserType, permission, children }) {
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.userType !== allowedUserType) {
        return <Navigate to={defaultRouteFor(user)} replace />;
    }

    if (permission && !hasPermission(user, permission)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
}

function AuthRouter() {
    const { data: sessionUser, isLoading } = useQuery({
        queryKey: ["session"],
        queryFn: getSession,
        staleTime: 60_000,
    });
    const user = sessionUser ?? null;

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <Routes>
            <Route
                path="/"
                element={user ? <Navigate to={defaultRouteFor(user)} replace /> : <LandingPage />}
            />
            <Route
                path="/login"
                element={user ? <Navigate to={defaultRouteFor(user)} replace /> : <LandingPage />}
            />
            <Route
                path="/register"
                element={user ? <Navigate to={defaultRouteFor(user)} replace /> : <LandingPage />}
            />
            <Route
                path="/contact"
                element={user ? <Navigate to={defaultRouteFor(user)} replace /> : <LandingPage />}
            />
            <Route
                path="/about"
                element={user ? <Navigate to={defaultRouteFor(user)} replace /> : <LandingPage />}
            />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route
                path="/dashboard"
                element={user ? <Navigate to={defaultRouteFor(user)} replace /> : <Navigate to="/login" replace />}
            />

            <Route path="/assistant" element={<ProtectedRoute user={user} allowedUserType="asisten" permission="manage-profile"><ProfileAssistant /></ProtectedRoute>} />
            <Route path="/start-praktikum" element={<ProtectedRoute user={user} allowedUserType="asisten" permission="see-history"><StartPraktikum /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute user={user} allowedUserType="asisten" permission="see-history"><HistoryPraktikum /></ProtectedRoute>} />
            <Route path="/nilai-praktikan" element={<ProtectedRoute user={user} allowedUserType="asisten" permission="nilai-praktikan"><NilaiPraktikan /></ProtectedRoute>} />
            <Route path="/lihat-tp" element={<ProtectedRoute user={user} allowedUserType="asisten" permission="check-tugas-pendahuluan"><LihatTP /></ProtectedRoute>} />
            <Route path="/jawaban-tp" element={<ProtectedRoute user={user} allowedUserType="asisten" permission="check-tugas-pendahuluan"><ResultLihatTP /></ProtectedRoute>} />
            <Route path="/soal" element={<ProtectedRoute user={user} allowedUserType="asisten" permission="see-soal"><SoalPraktikum /></ProtectedRoute>} />
            <Route path="/modul" element={<ProtectedRoute user={user} allowedUserType="asisten" permission="manage-modul"><ModulePraktikum /></ProtectedRoute>} />
            <Route path="/plottingan" element={<ProtectedRoute user={user} allowedUserType="asisten" permission="see-plot"><PlottingAssistant /></ProtectedRoute>} />
            <Route path="/leaderboard-ranking" element={<ProtectedRoute user={user} allowedUserType="asisten" permission="nilai-praktikan"><LeaderboardRanking /></ProtectedRoute>} />
            <Route path="/polling" element={<ProtectedRoute user={user} allowedUserType="asisten" permission="see-polling"><PollingAssistant /></ProtectedRoute>} />
            <Route path="/pelanggaran" element={<ProtectedRoute user={user} allowedUserType="asisten" permission="see-pelanggaran"><PelanggaranAssistant /></ProtectedRoute>} />
            <Route path="/manage-role" element={<ProtectedRoute user={user} allowedUserType="asisten" permission="manage-role"><ManageRole /></ProtectedRoute>} />
            <Route path="/set-praktikan" element={<ProtectedRoute user={user} allowedUserType="asisten" permission="set-praktikan"><SetPraktikan /></ProtectedRoute>} />
            <Route path="/manage-praktikan" element={<ProtectedRoute user={user} allowedUserType="asisten" permission="praktikan-regist"><ManagePraktikan /></ProtectedRoute>} />
            <Route path="/audit-logs" element={<ProtectedRoute user={user} allowedUserType="asisten" permission="manage-role"><AuditLogs /></ProtectedRoute>} />
            <Route path="/laporan-praktikum" element={<ProtectedRoute user={user} allowedUserType="asisten" permission="laporan-praktikum"><ResultLaporan /></ProtectedRoute>} />
            <Route path="/list-laporan" element={<ProtectedRoute user={user} allowedUserType="asisten" permission="laporan-praktikum"><ResultLaporan /></ProtectedRoute>} />

            <Route path="/praktikan" element={<ProtectedRoute user={user} allowedUserType="praktikan"><ProfilePraktikan /></ProtectedRoute>} />
            <Route path="/praktikum" element={<ProtectedRoute user={user} allowedUserType="praktikan" permission="praktikum-lms"><PraktikumPage /></ProtectedRoute>} />
            <Route path="/praktikan-modul" element={<ProtectedRoute user={user} allowedUserType="praktikan" permission="lihat-modul"><ModulesPage /></ProtectedRoute>} />
            <Route path="/tugas-pendahuluan" element={<ProtectedRoute user={user} allowedUserType="praktikan" permission="praktikum-lms"><TugasPendahuluanPage /></ProtectedRoute>} />
            <Route path="/score-praktikan" element={<ProtectedRoute user={user} allowedUserType="praktikan" permission="lihat-nilai"><ScorePraktikan /></ProtectedRoute>} />
            <Route path="/contact-assistant" element={<ProtectedRoute user={user} allowedUserType="praktikan" permission="lihat-asisten"><ContactAssistant /></ProtectedRoute>} />
            <Route path="/polling-assistant" element={<ProtectedRoute user={user} allowedUserType="praktikan" permission="isi-polling"><PollingPage /></ProtectedRoute>} />
            <Route path="/complaints" element={<ProtectedRoute user={user} allowedUserType="praktikan" permission="lihat-nilai"><ComplaintsPage /></ProtectedRoute>} />

            <Route
                path="*"
                element={user ? <Navigate to={defaultRouteFor(user)} replace /> : <Navigate to="/" replace />}
            />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthRouter />
        </BrowserRouter>
    );
}
