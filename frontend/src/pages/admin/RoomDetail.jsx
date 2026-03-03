import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Spinner from '../../components/UI/Spinner'
import {
    ArrowLeft, Plus, Target, ScanLine, BarChart3, Trash2, CheckCircle2,
    Clock, AlertCircle, Image, Video, FileText, Info, Globe, Eye, Zap, RefreshCw
} from 'lucide-react'

const StatusBadge = ({ status }) => {
    const map = {
        ready: { cls: 'badge-green', icon: CheckCircle2, label: 'Ready' },
        processing: { cls: 'badge-yellow', icon: Clock, label: 'Processing…' },
        pending: { cls: 'badge-yellow', icon: Clock, label: 'Pending' },
        failed: { cls: 'badge-red', icon: AlertCircle, label: 'Failed' },
    }
    const { cls, icon: Icon, label } = map[status] || map.pending
    return <span className={cls}><Icon size={10} />{label}</span>
}

const ContentIcon = ({ type }) => {
    const icons = { video: Video, pdf: FileText, image: Image, info: Info }
    const Icon = icons[type] || FileText
    return <Icon size={14} className="text-dark-300" />
}

export default function RoomDetail() {
    const { roomId } = useParams()
    const navigate = useNavigate()
    const [room, setRoom] = useState(null)
    const [targets, setTargets] = useState([])
    const [loading, setLoading] = useState(true)
    const [publishing, setPublishing] = useState(false)
    const [bundling, setBundling] = useState(false)

    const fetchRoom = useCallback(async () => {
        try {
            const { data } = await api.get(`/rooms/${roomId}`)
            setRoom(data.room)
            setTargets(data.targets)
        } catch {
            toast.error('Failed to load room')
            navigate('/dashboard/rooms')
        } finally { setLoading(false) }
    }, [roomId])

    useEffect(() => { fetchRoom() }, [fetchRoom])

    // Poll for pending/processing targets
    useEffect(() => {
        const hasPending = targets.some(t => ['pending', 'processing'].includes(t.mindFileStatus))
        if (!hasPending) return
        const interval = setInterval(async () => {
            const { data } = await api.get(`/rooms/${roomId}`)
            setTargets(data.targets)
        }, 5000)
        return () => clearInterval(interval)
    }, [targets, roomId])

    const handlePublish = async () => {
        setPublishing(true)
        try {
            const { data } = await api.post(`/rooms/${roomId}/publish`)
            setRoom(r => ({ ...r, isPublished: true }))
            toast.success('Room is now live! 🎉')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to publish')
        } finally { setPublishing(false) }
    }

    const handleDeleteTarget = async (targetId) => {
        if (!confirm('Delete this target?')) return
        try {
            await api.delete(`/targets/${targetId}`)
            setTargets(p => p.filter(t => t._id !== targetId))
            setRoom(r => ({ ...r, targetCount: Math.max(0, (r.targetCount || 1) - 1) }))
            toast.success('Target deleted')
        } catch { toast.error('Failed to delete') }
    }

    const handleBuildTracking = async () => {
        if (targets.length === 0) return toast.error('Add some targets first')
        setBundling(true)
        const tid = toast.loading('Bundling targets into one trackable hub...')

        try {
            // 1. Download all images
            const images = await Promise.all(targets.map(async (t) => {
                return new Promise((resolve, reject) => {
                    const img = new window.Image()
                    img.crossOrigin = 'anonymous'
                    img.onload = () => resolve(img)
                    img.onerror = () => reject(new Error(`Failed to load target image: ${t.name}`))
                    img.src = t.imageUrl
                })
            }))

            // 2. Compile in browser
            toast.loading('Compiling tracking patterns...', { id: tid })
            const mindarModule = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js')
            const { Compiler } = mindarModule
            const compiler = new Compiler()

            await compiler.compileImageTargets(images, (progress) => {
                console.log(`[MindAR] Hub Compilation: ${Math.round(progress)}%`)
            })

            const data = await compiler.exportData()
            const blob = new Blob([data], { type: 'application/octet-stream' })

            // 3. Upload to room
            toast.loading('Saving tracking hub to cloud...', { id: tid })
            const fd = new FormData()
            fd.append('mind', blob, `room-${roomId}.mind`)

            const { data: resData } = await api.put(`/rooms/${roomId}/mind`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            setRoom(prev => ({ ...prev, mindFileUrl: resData.mindFileUrl }))
            toast.success('AR Tracking Hub Ready! Multiple targets supported.', { id: tid })
        } catch (err) {
            console.error('Bundling error:', err)
            toast.error(err.message || 'Failed to build tracking hub', { id: tid })
        } finally {
            setBundling(false)
        }
    }

    if (loading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
    if (!room) return null

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-start gap-4 mb-8">
                <Link to="/dashboard/rooms" className="btn-icon bg-dark-700 hover:bg-dark-600 text-dark-300 mt-1"><ArrowLeft size={18} /></Link>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="page-title">{room.name}</h1>
                        {room.isPublished ? <span className="badge-green">Live</span> : <span className="badge-gray">Draft</span>}
                    </div>
                    <p className="page-subtitle">{room.location}{room.description ? ` · ${room.description}` : ''}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {!room.isPublished && (
                        <button onClick={handlePublish} disabled={publishing || targets.filter(t => t.mindFileStatus === 'ready').length === 0 || !room.mindFileUrl} className="btn-accent">
                            {publishing ? <Spinner size="sm" /> : <><Globe size={15} />Publish Room</>}
                        </button>
                    )}
                    <button onClick={handleBuildTracking} disabled={bundling || targets.length === 0} className={`btn-secondary ${!room.mindFileUrl ? 'border-primary-500/50 shadow-glow-primary/20' : ''}`}>
                        {bundling ? <Spinner size="sm" /> : <><Zap size={15} className={!room.mindFileUrl ? 'text-primary-400' : ''} />Build Tracking Hub</>}
                    </button>
                    <Link to={`/dashboard/rooms/${roomId}/scanner`} className="btn-secondary"><ScanLine size={15} />Scanner</Link>
                    <Link to={`/dashboard/rooms/${roomId}/analytics`} className="btn-secondary"><BarChart3 size={15} />Analytics</Link>
                </div>
            </div>

            {/* Targets */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">AR Targets ({targets.length})</h2>
                <Link to={`/dashboard/rooms/${roomId}/upload`} className="btn-primary btn-sm">
                    <Plus size={14} /> Add Target
                </Link>
            </div>

            {targets.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-icon"><Target size={32} /></div>
                    <p className="text-white font-semibold mb-1">No targets yet</p>
                    <p className="text-dark-300 text-sm mb-4">Upload images that visitors will scan to trigger AR content</p>
                    <Link to={`/dashboard/rooms/${roomId}/upload`} className="btn-primary"><Plus size={16} />Upload First Target</Link>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {targets.map((target) => (
                        <div key={target._id} className="card overflow-hidden flex flex-col">
                            {/* Preview image */}
                            <div className="relative h-40 bg-dark-700 overflow-hidden">
                                {target.imageUrl
                                    ? <img src={target.imageUrl} alt={target.name} className="w-full h-full object-cover" />
                                    : <div className="flex items-center justify-center h-full"><Image size={32} className="text-dark-500" /></div>}
                                <div className="absolute top-2 right-2"><StatusBadge status={target.mindFileStatus} /></div>
                            </div>

                            <div className="p-4 flex-1 flex flex-col gap-3">
                                <div>
                                    <h3 className="font-medium text-white text-sm truncate">{target.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <ContentIcon type={target.contentType} />
                                        <span className="text-xs text-dark-300 capitalize">{target.contentType === 'none' ? 'No content yet' : target.contentType}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-auto">
                                    <Link to={`/dashboard/rooms/${roomId}/upload?target=${target._id}`} className="btn-secondary btn-sm flex-1 text-xs py-1.5">Edit Content</Link>
                                    <button onClick={() => handleDeleteTarget(target._id)} className="btn-icon text-dark-400 hover:text-red-400 hover:bg-red-500/10 w-7 h-7">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
