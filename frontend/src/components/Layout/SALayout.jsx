import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Shield, Users, Building2, BarChart3, LogOut, Zap, Menu, X } from 'lucide-react'

const nav = [
    { to: '/superadmin', label: 'Overview', icon: BarChart3, end: true },
    { to: '/superadmin/admins', label: 'Admins', icon: Users },
    { to: '/superadmin/rooms', label: 'All Rooms', icon: Building2 },
]

function SASidebar({ onClose }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const handleLogout = () => { logout(); navigate('/login') }

    return (
        <aside className="flex flex-col h-full bg-dark-900 border-r border-dark-700 w-64">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-dark-700">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center shadow-glow-accent">
                    <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="text-white font-bold text-base leading-none">Super Admin</p>
                    <p className="text-accent-400 text-xs font-medium">Phygital.space</p>
                </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
                {nav.map(({ to, label, icon: Icon, end }) => (
                    <NavLink key={to} to={to} end={end} onClick={onClose}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30' : 'text-dark-300 hover:text-white hover:bg-dark-700'
                            }`
                        }>
                        <Icon size={18} />{label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-3 border-t border-dark-700">
                <NavLink to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-dark-300 hover:text-primary-400 hover:bg-primary-500/10 transition-all mb-1">
                    <Zap size={16} /> Admin Dashboard
                </NavLink>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-dark-300 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <LogOut size={16} /> Sign Out
                </button>
            </div>
        </aside>
    )
}

export default function SALayout() {
    const [open, setOpen] = useState(false)
    const { user } = useAuth()

    return (
        <div className="flex h-screen bg-dark-900 overflow-hidden">
            {open && <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}
            <div className={`fixed inset-y-0 left-0 z-30 transition-transform duration-300 lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
                <SASidebar onClose={() => setOpen(false)} />
            </div>
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="flex items-center justify-between px-4 sm:px-6 h-16 border-b border-dark-700 bg-dark-900/80 backdrop-blur-sm">
                    <button onClick={() => setOpen(true)} className="lg:hidden btn-icon bg-dark-700 text-dark-200"><Menu size={20} /></button>
                    <div className="hidden lg:flex items-center gap-2">
                        <Shield size={16} className="text-accent-400" />
                        <span className="text-sm text-dark-300">Super Admin Control Panel</span>
                    </div>
                    <div className="ml-auto w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center text-white text-xs font-bold">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"><Outlet /></main>
            </div>
        </div>
    )
}
