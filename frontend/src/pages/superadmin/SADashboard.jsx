import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { BarChart3, Users, Building2, ScanLine, MousePointerClick, Activity } from 'lucide-react'
import Spinner from '../../components/UI/Spinner'

export default function SADashboard() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/superadmin/stats')
            .then(r => setStats(r.data.stats))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const cards = stats ? [
        { label: 'Total Admins', value: stats.totalAdmins, icon: Users, bg: 'bg-primary-600/20 border-primary-600/30', text: 'text-primary-400' },
        { label: 'Total Rooms', value: stats.totalRooms, icon: Building2, bg: 'bg-accent-600/20 border-accent-600/30', text: 'text-accent-400' },
        { label: 'Active Rooms', value: stats.activeRooms, icon: Activity, bg: 'bg-emerald-600/20 border-emerald-600/30', text: 'text-emerald-400' },
        { label: 'Total Targets', value: stats.totalTargets, icon: BarChart3, bg: 'bg-violet-600/20 border-violet-600/30', text: 'text-violet-400' },
        { label: 'Total Scans', value: stats.totalScans, icon: ScanLine, bg: 'bg-amber-600/20 border-amber-600/30', text: 'text-amber-400' },
        { label: 'Interactions', value: stats.totalInteractions, icon: MousePointerClick, bg: 'bg-rose-600/20 border-rose-600/30', text: 'text-rose-400' },
    ] : []

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Platform Overview</h1>
                    <p className="page-subtitle">Global statistics across all users and rooms</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {cards.map(({ label, value, icon: Icon, bg, text }) => (
                        <div key={label} className="stat-card">
                            <div className={`stat-icon border ${bg}`}><Icon size={20} className={text} /></div>
                            <div>
                                <p className="text-2xl font-bold text-white">{value?.toLocaleString()}</p>
                                <p className="text-sm text-dark-300">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
