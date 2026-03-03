import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'
import Spinner from '../../components/UI/Spinner'
import { ArrowLeft, Copy, ExternalLink, Download, ScanLine } from 'lucide-react'

export default function ScannerPage() {
    const { roomId } = useParams()
    const [room, setRoom] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get(`/rooms/${roomId}`)
            .then(r => setRoom(r.data.room))
            .catch(() => toast.error('Failed to load room'))
            .finally(() => setLoading(false))
    }, [roomId])

    const copyUrl = () => {
        navigator.clipboard.writeText(room.scannerUrl)
        toast.success('Scanner URL copied!')
    }

    if (loading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
    if (!room) return null

    return (
        <div className="animate-fade-in max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
                <Link to={`/dashboard/rooms/${roomId}`} className="btn-icon bg-dark-700 hover:bg-dark-600 text-dark-300"><ArrowLeft size={18} /></Link>
                <div>
                    <h1 className="page-title">AR Scanner</h1>
                    <p className="page-subtitle">Share this QR code with your visitors</p>
                </div>
            </div>

            {!room.isPublished && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6">
                    <ScanLine size={18} className="text-amber-400 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-amber-300">Room not published yet</p>
                        <p className="text-xs text-amber-400/80 mt-0.5">Publish your room first so visitors can access the scanner.</p>
                    </div>
                    <Link to={`/dashboard/rooms/${roomId}`} className="btn-sm bg-amber-500 text-dark-900 font-semibold ml-auto">Publish</Link>
                </div>
            )}

            <div className="grid sm:grid-cols-2 gap-6">
                {/* QR Code */}
                <div className="card p-6 flex flex-col items-center gap-4">
                    <h3 className="text-sm font-semibold text-dark-200 self-start">QR Code</h3>
                    <div className="bg-white rounded-2xl p-4 shadow-glow-primary">
                        <QRCodeSVG
                            value={room.scannerUrl}
                            size={180}
                            bgColor="#ffffff"
                            fgColor="#1a1a2e"
                            level="H"
                            includeMargin={false}
                        />
                    </div>
                    <p className="text-xs text-dark-400 text-center">Scan with any camera to open AR experience</p>
                    {room.qrCodeUrl && (
                        <a href={room.qrCodeUrl} download={`${room.slug}-qr.png`} target="_blank" rel="noreferrer" className="btn-secondary btn-sm w-full">
                            <Download size={14} /> Download QR
                        </a>
                    )}
                </div>

                {/* URL + Info */}
                <div className="space-y-4">
                    <div className="card p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-dark-400 mb-2">Scanner URL</p>
                        <p className="text-sm text-primary-300 break-all font-mono mb-3">{room.scannerUrl}</p>
                        <div className="flex gap-2">
                            <button onClick={copyUrl} className="btn-secondary btn-sm flex-1"><Copy size={13} />Copy</button>
                            <a href={room.scannerUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm flex-1"><ExternalLink size={13} />Preview</a>
                        </div>
                    </div>

                    <div className="card p-5 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-dark-400">Room Info</p>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-dark-300">Name</span><span className="text-white font-medium">{room.name}</span></div>
                            <div className="flex justify-between"><span className="text-dark-300">Location</span><span className="text-white">{room.location}</span></div>
                            <div className="flex justify-between"><span className="text-dark-300">Targets</span><span className="text-white">{room.targetCount || 0}</span></div>
                            <div className="flex justify-between"><span className="text-dark-300">Status</span><span>{room.isPublished ? <span className="badge-green">Live</span> : <span className="badge-gray">Draft</span>}</span></div>
                        </div>
                    </div>

                    <div className="card p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-dark-400 mb-2">Instructions for Visitors</p>
                        <ol className="text-xs text-dark-300 space-y-1.5 list-decimal list-inside">
                            <li>Scan the QR code with your camera</li>
                            <li>Allow camera permission when prompted</li>
                            <li>Point at any image in the room</li>
                            <li>Watch AR content appear!</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    )
}
