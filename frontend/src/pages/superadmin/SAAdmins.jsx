import { useEffect, useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Spinner from '../../components/UI/Spinner'
import { Users, Building2, Mail, ToggleLeft, ToggleRight, Search } from 'lucide-react'

export default function SAAdmins() {
    const [admins, setAdmins] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        api.get('/superadmin/admins')
            .then(r => setAdmins(r.data.admins))
            .catch(() => toast.error('Failed to load admins'))
            .finally(() => setLoading(false))
    }, [])

    const toggleAdmin = async (admin) => {
        const route = admin.isActive ? 'deactivate' : 'activate'
        try {
            const { data } = await api.put(`/superadmin/admins/${admin._id}/${route}`)
            setAdmins(p => p.map(a => a._id === admin._id ? { ...a, isActive: data.admin.isActive } : a))
            toast.success(`Admin ${admin.isActive ? 'deactivated' : 'activated'}`)
        } catch { toast.error('Action failed') }
    }

    const filtered = admins.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Manage Admins</h1>
                    <p className="page-subtitle">{admins.length} registered admins</p>
                </div>
            </div>

            <div className="relative mb-6">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
                <input className="input pl-10 max-w-sm" placeholder="Search admins…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
            ) : (
                <div className="table-wrapper">
                    <table className="table">
                        <thead className="thead">
                            <tr>
                                <th className="th">Admin</th>
                                <th className="th">Organization</th>
                                <th className="th">Rooms</th>
                                <th className="th">Status</th>
                                <th className="th">Joined</th>
                                <th className="th">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={6} className="td text-center py-10 text-dark-400">No admins found</td></tr>
                            ) : filtered.map(admin => (
                                <tr key={admin._id} className="tr">
                                    <td className="td">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                {admin.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-medium">{admin.name}</p>
                                                <p className="text-xs text-dark-400 flex items-center gap-1"><Mail size={10} />{admin.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="td text-dark-300">{admin.organization || '—'}</td>
                                    <td className="td">
                                        <span className="flex items-center gap-1 text-dark-200"><Building2 size={12} />{admin.roomCount || 0}</span>
                                    </td>
                                    <td className="td">
                                        {admin.isActive ? <span className="badge-green">Active</span> : <span className="badge-red">Inactive</span>}
                                    </td>
                                    <td className="td text-dark-300 text-xs">{new Date(admin.createdAt).toLocaleDateString()}</td>
                                    <td className="td">
                                        <button
                                            onClick={() => toggleAdmin(admin)}
                                            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${admin.isActive ? 'text-red-400 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                                        >
                                            {admin.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                            {admin.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
