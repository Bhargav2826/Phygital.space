import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api/axios'
import { Zap, Camera, X, ChevronDown, ChevronUp, Info } from 'lucide-react'
import toast from 'react-hot-toast'

// Generate a simple device fingerprint for analytics
const getDeviceId = () => {
    let id = localStorage.getItem('phygital_device_id')
    if (!id) {
        id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('phygital_device_id', id)
    }
    return id
}

export default function ARScanner() {
    const { slug } = useParams()
    const [room, setRoom] = useState(null)
    const [targets, setTargets] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [arReady, setArReady] = useState(false)
    const [showGuide, setShowGuide] = useState(true)
    const [activeTarget, setActiveTarget] = useState(null)
    const [showContent, setShowContent] = useState(false)

    const containerRef = useRef(null)
    const arSystemRef = useRef(null)
    const trackedRef = useRef(false)

    // Fetch room data
    useEffect(() => {
        api.get(`/rooms/public/${slug}`)
            .then(({ data }) => {
                setRoom(data.room)
                setTargets(data.targets)
                // Track scan
                const deviceId = getDeviceId()
                api.post(`/analytics/scan/${data.room._id}`, { deviceId }).catch(() => { })
            })
            .catch(err => setError(err.response?.data?.message || 'Room not found or not published'))
            .finally(() => setLoading(false))
    }, [slug])

    // Initialize MindAR when room data is ready
    useEffect(() => {
        if (!room || targets.length === 0 || arReady) return

        // 1. Check for room-level bundled tracking data (preferred)
        if (room.mindFileUrl) {
            initAR(targets, room.mindFileUrl)
            return
        }

        // 2. Fallback: Only targets that have compiled .mind files
        const readyTargets = targets.filter(t => t.mindFileStatus === 'ready' && t.mindFileUrl)
        if (readyTargets.length === 0) {
            setError('AR tracking data is not ready yet. Please build the tracking hub in dashboard.')
            return
        }

        // Using first target as fallback (old way)
        initAR(readyTargets, readyTargets[0].mindFileUrl)

        return () => {
            if (arSystemRef.current) {
                try { arSystemRef.current.stop() } catch (_) { }
            }
        }
    }, [room, targets])

    const initAR = async (readyTargets, mindFileUrl) => {
        try {
            // Load Three.js and MindAR as ES modules
            const [THREE, { MindARThree }] = await Promise.all([
                import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'),
                import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js')
            ]);

            if (!THREE || !MindARThree) {
                throw new Error('Failed to load AR libraries');
            }

            // Store in window for any legacy/internal references if needed
            window.THREE = THREE;

            const mindarThree = new MindARThree({
                container: containerRef.current,
                imageTargetSrc: mindFileUrl,
                maxTrack: readyTargets.length,
                uiLoading: 'no',
                uiScanning: 'no',
                uiError: 'no',
            })

            arSystemRef.current = mindarThree
            const { renderer, scene, camera } = mindarThree

            // Create anchors for each ready target
            readyTargets.forEach((target, index) => {
                const anchor = mindarThree.addAnchor(index)
                const lastTrackedRef = { time: 0 };

                // Create a plane to display content
                const geometry = new THREE.PlaneGeometry(1, 0.75)

                // Create material based on content type
                let material
                if (target.contentType === 'video' && target.contentUrl) {
                    // Video texture
                    const video = document.createElement('video')
                    video.src = target.contentUrl
                    video.crossOrigin = 'anonymous'
                    video.loop = true
                    video.muted = false
                    video.playsInline = true
                    video.setAttribute('playsinline', 'true')

                    const videoTexture = new THREE.VideoTexture(video)
                    material = new THREE.MeshBasicMaterial({
                        map: videoTexture,
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.9
                    })

                    anchor.onTargetFound = () => {
                        video.play().catch(() => {
                            // If autoplay fails, we show a muted version and try again
                            video.muted = true;
                            video.play().catch(e => console.error("Autoplay failed:", e));
                        })
                        setActiveTarget(target)
                        setShowContent(true)
                        setShowGuide(false) // Auto-hide guide on find

                        // Throttle analytics to once every 10 seconds per target session
                        const now = Date.now();
                        if (now - lastTrackedRef.time > 10000) {
                            lastTrackedRef.time = now;
                            api.post(`/analytics/interaction/${room._id}/${target._id}`).catch(() => { })
                        }
                    }
                    anchor.onTargetLost = () => {
                        video.pause()
                        // Don't clear activeTarget immediately to prevent UI flickering
                    }
                } else {
                    // For PDF/info/image – show a sleek glass-like overlay
                    material = new THREE.MeshBasicMaterial({
                        color: 0x4f46e5, // Indigo-600
                        transparent: true,
                        opacity: 0.4,
                        side: THREE.DoubleSide,
                    })

                    anchor.onTargetFound = () => {
                        console.log('[AR] Target detected:', target.name, 'Type:', target.contentType, 'Content:', !!target.contentUrl);
                        setActiveTarget(target)
                        setShowContent(true)
                        setShowGuide(false) // Auto-hide guide on find

                        // Throttle analytics to once every 10 seconds per target session
                        const now = Date.now();
                        if (now - lastTrackedRef.time > 10000) {
                            lastTrackedRef.time = now;
                            api.post(`/analytics/interaction/${room._id}/${target._id}`).catch(() => { })
                        }
                    }
                    anchor.onTargetLost = () => {
                        console.log('[AR] Target lost:', target.name);
                        // Keep the UI open even if tracking is lost - better for reading PDFs
                    }
                }

                const plane = new THREE.Mesh(geometry, material)
                anchor.group.add(plane)
            })

            try {
                await mindarThree.start()
                renderer.setAnimationLoop(() => {
                    renderer.render(scene, camera)
                })
                setArReady(true)
                setShowGuide(true)
            } catch (err) {
                setError('Camera access denied or not available. Please allow camera and retry.')
                console.error('MindAR start error:', err)
            }
        } catch (err) {
            setError(err.message || 'Failed to load AR libraries')
            console.error('AR Load Error:', err)
        }
    }

    // ─── Loading state ───────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center animate-pulse shadow-glow-primary">
                    <Camera className="w-7 h-7 text-white" />
                </div>
                <div className="loading-dots text-primary-400 text-2xl font-bold">
                    <span>.</span><span>.</span><span>.</span>
                </div>
                <p className="text-dark-300 text-sm">Loading AR experience</p>
            </div>
        )
    }

    // ─── Error state ─────────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                    <X className="w-7 h-7 text-red-400" />
                </div>
                <h1 className="text-xl font-bold text-white">AR Experience Unavailable</h1>
                <p className="text-dark-300 text-sm max-w-xs">{error}</p>
                <button onClick={() => window.location.reload()} className="btn-primary mt-2">Retry</button>
            </div>
        )
    }

    // ─── AR Scanner ──────────────────────────────────────────────────────────────
    return (
        <div className="relative w-screen h-screen overflow-hidden bg-black">
            {/* MindAR container */}
            <div ref={containerRef} className="ar-container" />

            {/* Main AR Overlay System */}
            <div className="ar-overlay pointer-events-none">
                {/* Top Navigation Bar - Phygital.space Branding */}
                <div className="fixed top-0 left-0 right-0 z-[100] px-4 pt-4 pb-10 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 pointer-events-auto">
                        {/* Brand Logo & Name */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 md:w-12 md:h-12 glass rounded-2xl flex items-center justify-center border-white/20 shadow-2xl relative group overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl opacity-80 group-hover:opacity-100 transition-opacity" />
                                <Zap className="w-5 h-5 md:w-6 md:h-6 text-white fill-white relative z-10 animate-pulse" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-white text-base md:text-xl font-black tracking-tighter leading-none">
                                    PHYGITAL<span className="text-primary-400">.SPACE</span>
                                </h1>
                                <p className="text-white/40 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] leading-none mt-1">
                                    Reality Enhanced
                                </p>
                            </div>
                        </div>

                        {/* Content Pill (Room & Targets) - Optimized for mobile */}
                        <div className="flex items-center gap-2 md:gap-3">
                            {/* Room Info Pill */}
                            <div className="glass rounded-2xl px-3 md:px-5 py-2 md:py-2.5 flex items-center gap-2 md:gap-3 border-white/10 backdrop-blur-3xl shadow-xl">
                                <div className="hidden sm:flex flex-col text-right">
                                    <span className="text-white text-xs md:text-sm font-black tracking-tight leading-tight truncate max-w-[100px] md:max-w-[200px]">{room?.name}</span>
                                    <span className="text-primary-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest leading-none">Access Point</span>
                                </div>
                                <div className="w-[1px] h-6 bg-white/10 hidden sm:block" />
                                <div className="flex items-center gap-2 bg-emerald-500/10 px-2 md:px-3 py-1.5 rounded-xl border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-emerald-400 text-[9px] md:text-[11px] font-black tracking-tighter uppercase whitespace-nowrap">
                                        {targets.filter(t => t.mindFileStatus === 'ready').length} Targets
                                    </span>
                                </div>
                            </div>

                            {/* Info Toggle */}
                            {!showGuide && arReady && (
                                <button
                                    onClick={() => setShowGuide(true)}
                                    className="w-10 h-10 md:w-12 md:h-12 glass rounded-2xl flex items-center justify-center text-white border-white/10 hover:bg-white/10 transition-all active:scale-95 shadow-xl"
                                >
                                    <Info size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Scanning ring / guide */}
                {arReady && !activeTarget && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-8">
                        <div className="relative w-64 h-64 md:w-72 md:h-72">
                            {/* Scanning Corner Brackets */}
                            <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-primary-400 rounded-tl-3xl animate-in fade-in zoom-in duration-700" />
                            <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-primary-400 rounded-tr-3xl animate-in fade-in zoom-in duration-700" />
                            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-primary-400 rounded-bl-3xl animate-in fade-in zoom-in duration-700" />
                            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-primary-400 rounded-br-3xl animate-in fade-in zoom-in duration-700" />

                            {/* Inner Scanning Frame */}
                            <div className="absolute inset-4 border border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/5 backdrop-blur-[1px] group">
                                <div className="relative">
                                    <div className="absolute -inset-4 bg-primary-500/20 rounded-full blur-xl animate-pulse" />
                                    <Camera className="w-14 h-14 text-white/50 relative z-10" />
                                </div>

                                {/* Scanning Laser Line */}
                                <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500 to-transparent top-0 animate-scanning-laser shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
                            </div>
                        </div>

                        <div className="mt-12 text-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                            <p className="text-white text-lg font-bold tracking-wide drop-shadow-lg">
                                Ready to Scan
                            </p>
                            <p className="text-white/60 text-xs font-medium uppercase tracking-[0.2em] bg-black/40 px-5 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                                Point at a target image
                            </p>
                        </div>
                    </div>
                )}

                {/* Full-screen Image Overlay */}
                {showContent && activeTarget && activeTarget.contentType?.toLowerCase() === 'image' && (
                    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 pointer-events-auto">
                        <div className="w-full flex justify-end mb-6">
                            <button
                                onClick={() => setShowContent(false)}
                                className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 w-full flex flex-col items-center justify-center gap-10 max-w-2xl mx-auto overflow-y-auto hide-scrollbar">
                            <div className="w-full relative group shrink-0">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-indigo-500 rounded-3xl blur opacity-25"></div>
                                <div className="relative bg-dark-950 rounded-3xl p-2 border border-white/10 shadow-2xl overflow-hidden">
                                    <img
                                        src={activeTarget.contentUrl}
                                        alt={activeTarget.name}
                                        className="w-full h-auto max-h-[55vh] rounded-2xl object-contain mx-auto"
                                    />
                                </div>
                            </div>

                            <div className="w-full space-y-4 text-center shrink-0">
                                <h1 className="text-white text-3xl font-bold tracking-tight">
                                    {activeTarget.contentTitle || activeTarget.name}
                                </h1>
                                {activeTarget.contentText && (
                                    <p className="text-dark-300 text-base max-w-lg mx-auto leading-relaxed">
                                        {activeTarget.contentText}
                                    </p>
                                )}
                            </div>

                            <div className="w-full pb-8 shrink-0">
                                <button
                                    onClick={async () => {
                                        const downloadUrl = `${api.defaults.baseURL}/targets/${activeTarget._id}/download`;
                                        const a = document.createElement('a');
                                        a.style.display = 'none';
                                        a.href = downloadUrl;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        toast.success('Download starting...');
                                    }}
                                    className="w-full py-5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-2xl shadow-xl shadow-primary-600/40 flex items-center justify-center gap-3 transition-all active:scale-[0.98] group"
                                >
                                    <Zap size={26} className="fill-white group-hover:scale-110 transition-transform" />
                                    <span className="text-xl uppercase tracking-widest">Download Image</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content panel for PDF/info (non-video, non-image) */}
                {showContent && activeTarget && activeTarget.contentType?.toLowerCase() !== 'video' && activeTarget.contentType?.toLowerCase() !== 'image' && (
                    <div className="absolute inset-x-0 bottom-0 z-[9999] p-4 pointer-events-none animate-in slide-in-from-bottom-full duration-500">
                        <div className="bg-dark-950/95 rounded-[2.5rem] p-7 border border-white/10 shadow-2xl shadow-primary-500/10 max-h-[85vh] overflow-y-auto pointer-events-auto backdrop-blur-3xl relative">
                            {/* Drag Handle Decoration */}
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full" />

                            <div className="flex items-start justify-between mb-8 pt-2">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center flex-shrink-0 border border-primary-500/30">
                                        <Info size={28} className="text-primary-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-white font-extrabold text-xl tracking-tight leading-tight">{activeTarget.contentTitle || activeTarget.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-emerald-400 text-[10px] uppercase font-black tracking-widest leading-none">
                                                    {activeTarget.contentType === 'none' ? 'Document' : activeTarget.contentType}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowContent(false)}
                                    className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-dark-300 hover:text-white transition-all active:scale-90"
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="space-y-8 pb-4">
                                {(activeTarget.contentType?.toLowerCase() === 'pdf' || (activeTarget.contentType === 'none' && activeTarget.contentUrl)) && (
                                    <div className="space-y-5">
                                        <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                                            <p className="text-dark-100 text-[15px] leading-relaxed font-medium">
                                                {activeTarget.contentType === 'none' ? 'A high-quality document has been linked to this space.' : `A ${activeTarget.contentType} document is available. Tap below to view.`}
                                            </p>
                                        </div>

                                        {activeTarget.contentUrl ? (
                                            <button
                                                onClick={async () => {
                                                    const downloadUrl = `${api.defaults.baseURL}/targets/${activeTarget._id}/download`;
                                                    try {
                                                        const check = await fetch(downloadUrl, { method: 'HEAD' });
                                                        if (check.status === 403) {
                                                            toast.error('Connection restricted. Please re-upload.', { duration: 6000 });
                                                            return;
                                                        }
                                                    } catch (err) { }

                                                    const a = document.createElement('a');
                                                    a.style.display = 'none';
                                                    a.href = downloadUrl;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    document.body.removeChild(a);
                                                    toast.success('Accessing document...');
                                                }}
                                                className="w-full py-5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-black rounded-[1.5rem] shadow-2xl shadow-primary-600/30 flex items-center justify-center gap-4 transition-all active:scale-[0.97] group border border-white/10"
                                            >
                                                <Zap size={24} className="fill-white group-hover:rotate-12 transition-transform" />
                                                <span className="text-lg uppercase tracking-wider">Download PDF</span>
                                            </button>
                                        ) : (
                                            <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-[1.5rem] text-red-400 text-sm font-bold flex items-center gap-3">
                                                <X size={18} />
                                                Attachment not available
                                            </div>
                                        )}
                                    </div>
                                )}


                                {activeTarget.contentText && (
                                    <div className="bg-dark-900/50 rounded-2xl p-5 border border-white/10 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-500" />
                                        <p className="text-dark-100 text-sm leading-relaxed whitespace-pre-wrap">{activeTarget.contentText}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Guide modal - Professional Onboarding View */}
                {showGuide && arReady && (
                    <div className="absolute inset-0 z-[10001] flex items-end justify-center p-6 bg-black/40 backdrop-blur-[2px] pointer-events-auto animate-in fade-in duration-500">
                        <div className="bg-dark-950/95 rounded-[2.5rem] p-8 w-full max-w-md border border-white/10 shadow-3xl shadow-primary-500/20 animate-in slide-in-from-bottom-8 duration-700 delay-100">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-600/40">
                                        <Zap size={22} className="text-white fill-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-black text-xl tracking-tight leading-none mb-1">{room?.name}</h3>
                                        <p className="text-primary-400 text-[10px] font-bold uppercase tracking-[0.2em] leading-none">Interactive Hub</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowGuide(false)}
                                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-dark-300 hover:text-white transition-all pb-1"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h4 className="text-white/40 text-[10px] uppercase font-black tracking-[0.25em]">Scanning Zones</h4>
                                    <div className="grid grid-cols-1 gap-3 max-h-[30vh] overflow-y-auto pr-2 hide-scrollbar">
                                        {targets.filter(t => t.mindFileStatus === 'ready').map((t, i) => (
                                            <div key={t._id} className="group p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 transition-all hover:bg-white/10 hover:border-white/10">
                                                <div className="w-8 h-8 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400 font-black text-xs shrink-0 group-hover:scale-110 transition-transform">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-white truncate leading-none mb-1">{t.name}</p>
                                                    <p className="text-[10px] text-dark-400 uppercase font-black tracking-widest leading-none">{t.contentType || 'Interaction'}</p>
                                                </div>
                                                <div className="w-2 h-2 rounded-full bg-primary-500/50 group-hover:bg-primary-500 group-hover:animate-pulse transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowGuide(false)}
                                    className="w-full py-5 bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-600 bg-size-200 animate-gradient-x text-white font-black rounded-2xl shadow-2xl shadow-primary-600/40 text-base uppercase tracking-widest transition-all active:scale-[0.97] border border-white/10"
                                >
                                    Begin Scanning
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
