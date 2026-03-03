import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Auth pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Admin pages
import AdminLayout from './components/Layout/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Rooms from './pages/admin/Rooms'
import RoomDetail from './pages/admin/RoomDetail'
import UploadTarget from './pages/admin/UploadTarget'
import ScannerPage from './pages/admin/ScannerPage'
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard'

// Super Admin pages
import SALayout from './components/Layout/SALayout'
import SADashboard from './pages/superadmin/SADashboard'
import SAAdmins from './pages/superadmin/SAAdmins'
import SARooms from './pages/superadmin/SARooms'

// Public pages
import ARScanner from './pages/scanner/ARScanner'
import LandingPage from './pages/LandingPage'
import NotFound from './pages/NotFound'

// Protected route wrapper
const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useAuth()
    if (loading) return <FullPageLoader />
    if (!user) return <Navigate to="/login" replace />
    if (role && user.role !== role && !(role === 'admin' && user.role === 'superadmin')) {
        return <Navigate to="/dashboard" replace />
    }
    return children
}

const FullPageLoader = () => (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-dark-300 text-sm">Loading Phygital.space…</p>
        </div>
    </div>
)

const AppRoutes = () => {
    const { user } = useAuth()

    return (
        <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
            <Route path="/scan/:slug" element={<ARScanner />} />

            {/* Admin */}
            <Route path="/dashboard" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="rooms" element={<Rooms />} />
                <Route path="rooms/:roomId" element={<RoomDetail />} />
                <Route path="rooms/:roomId/upload" element={<UploadTarget />} />
                <Route path="rooms/:roomId/scanner" element={<ScannerPage />} />
                <Route path="rooms/:roomId/analytics" element={<AnalyticsDashboard />} />
            </Route>

            {/* Super Admin */}
            <Route path="/superadmin" element={<ProtectedRoute role="superadmin"><SALayout /></ProtectedRoute>}>
                <Route index element={<SADashboard />} />
                <Route path="admins" element={<SAAdmins />} />
                <Route path="rooms" element={<SARooms />} />
            </Route>

            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}

export default function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    )
}
