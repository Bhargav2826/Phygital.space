import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { Building2, ScanLine, Target, BarChart3, Plus, ArrowRight } from 'lucide-react'
import Spinner from '../../components/UI/Spinner'

export default function Dashboard() {
    const { user } = useAuth()
    const [rooms, setRooms] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/rooms').then(r => setRooms(r.data.rooms)).catch(() => { }).finally(() => setLoading(false))
    }, [])

    const published = rooms.filter(r => r.isPublished).length
    const totalTargets = rooms.reduce((a, r) => a + (r.targetCount || 0), 0)

    const stats = [
        { label: 'Total Rooms', value: rooms.length, icon: Building2, color: 'from-primary-600 to-primary-500', bg: 'bg-primary-600/20 border-primary-600/30', textColor: 'text-primary-400' },
        { label: 'Published', value: published, icon: ScanLine, color: 'from-emerald-600 to-emerald-500', bg: 'bg-emerald-600/20 border-emerald-600/30', textColor: 'text-emerald-400' },
        { label: 'AR Targets', value: totalTargets, icon: Target, color: 'from-accent-600 to-accent-500', bg: 'bg-accent-600/20 border-accent-600/30', textColor: 'text-accent-400' },
        { label: 'Active Scanners', value: published, icon: BarChart3, color: 'from-violet-600 to-violet-500', bg: 'bg-violet-600/20 border-violet-600/30', textColor: 'text-violet-400' },
    ]

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Welcome back, {user?.name} 👋</p>
                </div>
                <Link to="/dashboard/rooms" className="btn-primary">
                    <Plus size={16} /> New AR Room
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map(({ label, value, icon: Icon, bg, textColor }) => (
                    <div key={label} className="stat-card">
                        <div className={`stat-icon border ${bg}`}>
                            <Icon size={22} className={textColor} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{loading ? '—' : value}</p>
                            <p className="text-sm text-dark-300">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent rooms */}
            <div className="card">
                <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
                    <h2 className="text-base font-semibold text-white">Recent My Spaces</h2>
                    <Link to="/dashboard/rooms" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
                        View all <ArrowRight size={14} />
                    </Link>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16"><Spinner /></div>
                ) : rooms.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon"><Building2 size={32} /></div>
                        <p className="text-white font-semibold mb-1">No rooms yet</p>
                        <p className="text-dark-300 text-sm mb-4">Create your first AR room to get started</p>
                        <Link to="/dashboard/rooms" className="btn-primary">
                            <Plus size={16} /> Create Room
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-dark-700/50">
                        {rooms.slice(0, 5).map(room => (
                            <Link key={room._id} to={`/dashboard/rooms/${room._id}`}
                                className="flex items-center justify-between px-6 py-4 hover:bg-dark-700/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-primary-600/20 border border-primary-600/30 flex items-center justify-center">
                                        <Building2 size={16} className="text-primary-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{room.name}</p>
                                        <p className="text-xs text-dark-300">{room.location} · {room.targetCount || 0} targets</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {room.isPublished
                                        ? <span className="badge-green">Live</span>
                                        : <span className="badge-gray">Draft</span>}
                                    <ArrowRight size={14} className="text-dark-400" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
