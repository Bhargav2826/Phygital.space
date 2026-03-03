import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Modal from '../../components/UI/Modal'
import Spinner from '../../components/UI/Spinner'
import { Building2, Plus, MapPin, Target, ScanLine, Trash2, ArrowRight, Search, Globe } from 'lucide-react'

export default function Rooms() {
    const [rooms, setRooms] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [createOpen, setCreateOpen] = useState(false)
    const [form, setForm] = useState({ name: '', location: '', description: '' })
    const [submitting, setSubmitting] = useState(false)

    const fetchRooms = () => {
        setLoading(true)
        api.get('/rooms').then(r => setRooms(r.data.rooms)).catch(() => toast.error('Failed to load rooms')).finally(() => setLoading(false))
    }

    useEffect(() => { fetchRooms() }, [])

    const handleCreate = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const { data } = await api.post('/rooms', form)
            setRooms(p => [data.room, ...p])
            setCreateOpen(false)
            setForm({ name: '', location: '', description: '' })
            toast.success('AR Room created!')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create room')
        } finally { setSubmitting(false) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Deactivate this room?')) return
        try {
            await api.delete(`/rooms/${id}`)
            setRooms(p => p.filter(r => r._id !== id))
            toast.success('Room deactivated')
        } catch { toast.error('Failed to delete room') }
    }

    const filtered = rooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.location.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">AR Rooms</h1>
                    <p className="page-subtitle">Manage your phygital spaces</p>
                </div>
                <button onClick={() => setCreateOpen(true)} className="btn-primary">
                    <Plus size={16} /> New Room
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
                <input className="input pl-10 max-w-sm" placeholder="Search rooms…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon"><Building2 size={32} /></div>
                    <p className="text-white font-semibold mb-1">{search ? 'No rooms found' : 'No rooms yet'}</p>
                    <p className="text-dark-300 text-sm mb-4">{search ? 'Try different keywords' : 'Create your first AR room'}</p>
                    {!search && <button onClick={() => setCreateOpen(true)} className="btn-primary"><Plus size={16} />Create Room</button>}
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map(room => (
                        <div key={room._id} className="card-hover flex flex-col">
                            {/* Header */}
                            <div className="p-5 border-b border-dark-700/50">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-600/20 border border-primary-600/30 flex items-center justify-center flex-shrink-0">
                                        <Building2 size={18} className="text-primary-400" />
                                    </div>
                                    {room.isPublished ? <span className="badge-green">Live</span> : <span className="badge-gray">Draft</span>}
                                </div>
                                <h3 className="font-semibold text-white mb-1 truncate">{room.name}</h3>
                                <div className="flex items-center gap-1 text-xs text-dark-300">
                                    <MapPin size={12} />{room.location}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-px bg-dark-700/50 flex-1">
                                <div className="px-4 py-3 bg-dark-800">
                                    <p className="text-lg font-bold text-white">{room.targetCount || 0}</p>
                                    <p className="text-xs text-dark-300 flex items-center gap-1"><Target size={10} />Targets</p>
                                </div>
                                <div className="px-4 py-3 bg-dark-800">
                                    <p className="text-lg font-bold text-white">{room.isPublished ? '●' : '○'}</p>
                                    <p className="text-xs text-dark-300 flex items-center gap-1"><Globe size={10} />Status</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 p-4 border-t border-dark-700/50">
                                <Link to={`/dashboard/rooms/${room._id}`} className="btn-primary flex-1 text-xs py-2">
                                    Manage <ArrowRight size={13} />
                                </Link>
                                <Link to={`/dashboard/rooms/${room._id}/scanner`} className="btn-secondary py-2 px-3 text-xs"><ScanLine size={14} /></Link>
                                <button onClick={() => handleDelete(room._id)} className="btn-icon text-dark-400 hover:text-red-400 hover:bg-red-500/10 w-8 h-8">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Room Modal */}
            <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create New AR Room">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="form-group">
                        <label className="label">Room Name *</label>
                        <input className="input" placeholder="e.g. Modern Art Museum" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label className="label">Location *</label>
                        <input className="input" placeholder="e.g. Ahmedabad, India" required value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label className="label">Description</label>
                        <textarea className="textarea" rows={3} placeholder="Brief description of this space…" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                            {submitting ? <Spinner size="sm" /> : 'Create Room'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
