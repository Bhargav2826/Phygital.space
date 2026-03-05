import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
    LayoutDashboard, Building2, ScanLine, BarChart3, Settings,
    LogOut, Zap, Shield, ChevronRight,
} from 'lucide-react'

const nav = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard/rooms', label: 'My Spaces', icon: Building2 },
]

export default function Sidebar({ onClose }) {
    const { user, logout, isSuperAdmin } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <aside className="flex flex-col h-full bg-dark-900 border-r border-dark-700 w-64">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-dark-700">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-glow-primary">
                    <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="text-white font-bold text-base leading-none">Phygital</p>
                    <p className="text-primary-400 text-xs font-medium">.space</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {nav.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/dashboard'}
                        onClick={onClose}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
                                : 'text-dark-300 hover:text-white hover:bg-dark-700'
                            }`
                        }
                    >
                        <Icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
                        {label}
                        <ChevronRight className="ml-auto w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" size={14} />
                    </NavLink>
                ))}

                {isSuperAdmin && (
                    <>
                        <div className="pt-4 pb-1 px-3">
                            <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Super Admin</p>
                        </div>
                        {[
                            { to: '/superadmin', label: 'SA Dashboard', icon: Shield },
                            { to: '/superadmin/admins', label: 'Manage Admins', icon: Settings },
                            { to: '/superadmin/rooms', label: 'All Rooms', icon: Building2 },
                        ].map(({ to, label, icon: Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={to === '/superadmin'}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                                        : 'text-dark-300 hover:text-white hover:bg-dark-700'
                                    }`
                                }
                            >
                                <Icon size={18} />
                                {label}
                            </NavLink>
                        ))}
                    </>
                )}
            </nav>

            {/* User */}
            <div className="p-3 border-t border-dark-700">
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                        <p className="text-xs text-dark-300 capitalize">{user?.role}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-dark-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>
        </aside>
    )
}
