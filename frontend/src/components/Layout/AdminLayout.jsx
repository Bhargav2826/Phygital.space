import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Menu, X, Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { user } = useAuth()

    return (
        <div className="flex h-screen bg-dark-900 overflow-hidden">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-30 transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topbar */}
                <header className="flex items-center justify-between px-4 sm:px-6 h-16 border-b border-dark-700 bg-dark-900/80 backdrop-blur-sm flex-shrink-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden btn-icon bg-dark-700 hover:bg-dark-600 text-dark-200"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="hidden lg:block">
                        <h1 className="text-sm font-medium text-dark-300">
                            Welcome back, <span className="text-white font-semibold">{user?.name}</span> 👋
                        </h1>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Page */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
