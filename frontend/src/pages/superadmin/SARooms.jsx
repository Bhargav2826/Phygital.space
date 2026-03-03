import { useEffect, useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Spinner from '../../components/UI/Spinner'
import { Building2, MapPin, Target, Search, ToggleRight } from 'lucide-react'

export default function SARooms() {
    const [rooms, setRooms] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        api.get('/superadmin/rooms')
            .then(r => setRooms(r.data.rooms))
            .catch(() => toast.error('Failed to load rooms'))
            .finally(() => setLoading(false))
    }, [])

    const deactivateRoom = async (roomId) => {
        if (!confirm('Deactivate this room?')) return
        try {
            await api.put(`/superadmin/rooms/${roomId}/deactivate`)
            setRooms(p => p.map(r => r._id === roomId ? { ...r, isActive: false, isPublished: false } : r))
            toast.success('Room deactivated')
        } catch { toast.error('Action failed') }
    }

    const filtered = rooms.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.location?.toLowerCase().includes(search.toLowerCase()) ||
        r.adminId?.name?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">All Rooms</h1>
                    <p className="page-subtitle">{rooms.length} rooms across the platform</p>
                </div>
            </div>

            <div className="relative mb-6">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
                <input className="input pl-10 max-w-sm" placeholder="Search rooms or admins…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
            ) : (
                <div className="table-wrapper">
                    <table className="table">
                        <thead className="thead">
                            <tr>
                                <th className="th">Room</th>
                                <th className="th">Admin</th>
                                <th className="th">Targets</th>
                                <th className="th">Status</th>
                                <th className="th">Created</th>
                                <th className="th">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={6} className="td text-center py-10 text-dark-400">No rooms found</td></tr>
                            ) : filtered.map(room => (
                                <tr key={room._id} className="tr">
                                    <td className="td">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-primary-600/20 border border-primary-600/30 flex items-center justify-center flex-shrink-0">
                                                <Building2 size={14} className="text-primary-400" />
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-medium">{room.name}</p>
                                                <p className="text-xs text-dark-400 flex items-center gap-1"><MapPin size={10} />{room.location}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="td">
                                        <p className="text-sm text-dark-200">{room.adminId?.name || '—'}</p>
                                        <p className="text-xs text-dark-400">{room.adminId?.email}</p>
                                    </td>
                                    <td className="td"><span className="flex items-center gap-1 text-dark-200"><Target size={12} />{room.targetCount || 0}</span></td>
                                    <td className="td">
                                        {!room.isActive ? <span className="badge-red">Deactivated</span>
                                            : room.isPublished ? <span className="badge-green">Live</span>
                                                : <span className="badge-gray">Draft</span>}
                                    </td>
                                    <td className="td text-dark-300 text-xs">{new Date(room.createdAt).toLocaleDateString()}</td>
                                    <td className="td">
                                        {room.isActive && (
                                            <button onClick={() => deactivateRoom(room._id)} className="flex items-center gap-1.5 text-xs text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all">
                                                <ToggleRight size={14} /> Deactivate
                                            </button>
                                        )}
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
