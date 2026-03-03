import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Spinner from '../../components/UI/Spinner'
import { LineChart, BarChart } from '../../components/Charts/AnalyticsChart'
import { ArrowLeft, ScanLine, Users, MousePointerClick, TrendingUp } from 'lucide-react'

export default function AnalyticsDashboard() {
    const { roomId } = useParams()
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get(`/analytics/${roomId}`)
            .then(r => setAnalytics(r.data.analytics))
            .catch(() => toast.error('Failed to load analytics'))
            .finally(() => setLoading(false))
    }, [roomId])

    if (loading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
    if (!analytics) return null

    // Prepare chart data from dailyStats (last 14 days)
    const recent = [...(analytics.dailyStats || [])].slice(-14)
    const labels = recent.map(d => {
        const [, m, day] = d.date.split('-')
        return `${day}/${m}`
    })

    const stats = [
        { label: 'Total Scans', value: analytics.totalScans, icon: ScanLine, bg: 'bg-primary-600/20 border-primary-600/30', text: 'text-primary-400' },
        { label: 'Unique Visitors', value: analytics.uniqueUsers, icon: Users, bg: 'bg-accent-600/20 border-accent-600/30', text: 'text-accent-400' },
        { label: 'Interactions', value: analytics.totalInteractions, icon: MousePointerClick, bg: 'bg-violet-600/20 border-violet-600/30', text: 'text-violet-400' },
        {
            label: 'Engagement Rate', value: analytics.totalScans ? `${Math.round((analytics.totalInteractions / analytics.totalScans) * 100)}%` : '0%',
            icon: TrendingUp, bg: 'bg-emerald-600/20 border-emerald-600/30', text: 'text-emerald-400'
        },
    ]

    return (
        <div className="animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <Link to={`/dashboard/rooms/${roomId}`} className="btn-icon bg-dark-700 hover:bg-dark-600 text-dark-300"><ArrowLeft size={18} /></Link>
                <div>
                    <h1 className="page-title">Room Analytics</h1>
                    <p className="page-subtitle">Track performance of your AR room</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map(({ label, value, icon: Icon, bg, text }) => (
                    <div key={label} className="stat-card">
                        <div className={`stat-icon border ${bg}`}><Icon size={20} className={text} /></div>
                        <div>
                            <p className="text-2xl font-bold text-white">{value}</p>
                            <p className="text-sm text-dark-300">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <div className="card p-5">
                    <h3 className="text-sm font-semibold text-dark-200 mb-4">Daily Scans (Last 14 days)</h3>
                    {recent.length === 0
                        ? <p className="text-dark-400 text-sm text-center py-8">No scan data yet</p>
                        : <LineChart
                            labels={labels}
                            datasets={[{
                                label: 'Scans',
                                data: recent.map(d => d.scans),
                                borderColor: '#6366f1',
                                backgroundColor: 'rgba(99,102,241,0.1)',
                            }]}
                        />}
                </div>

                <div className="card p-5">
                    <h3 className="text-sm font-semibold text-dark-200 mb-4">Daily Interactions</h3>
                    {recent.length === 0
                        ? <p className="text-dark-400 text-sm text-center py-8">No interaction data yet</p>
                        : <BarChart
                            labels={labels}
                            datasets={[{
                                label: 'Interactions',
                                data: recent.map(d => d.interactions),
                                backgroundColor: 'rgba(6,182,212,0.7)',
                            }]}
                        />}
                </div>
            </div>

            {/* Last scan */}
            {analytics.lastScanned && (
                <div className="card p-4 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-sm text-dark-300">
                        Last scan: <span className="text-white font-medium">{new Date(analytics.lastScanned).toLocaleString()}</span>
                    </p>
                </div>
            )}
        </div>
    )
}
