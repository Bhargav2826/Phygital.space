import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api/axios'
import { Zap, Camera, X, Info, Play, Pause, Volume2, VolumeX, Maximize2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import logo from '../../assets/logo.png'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getDeviceId = () => {
    let id = localStorage.getItem('phygital_device_id')
    if (!id) {
        id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('phygital_device_id', id)
    }
    return id
}

const fmtTime = (secs) => {
    if (!isFinite(secs) || isNaN(secs)) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── Glass Video Modal ────────────────────────────────────────────────────────
function GlassVideoModal({ target, videoEl, onClose }) {
    const [playing, setPlaying] = useState(false)
    const [muted, setMuted] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [showControls, setShowControls] = useState(true)
    const [isDragging, setIsDragging] = useState(false)
    const [tapFlash, setTapFlash] = useState(false)
    const [videoRatio, setVideoRatio] = useState(16 / 9)

    const progressRef = useRef(null)
    const hideTimerRef = useRef(null)
    const canvasRef = useRef(null)
    const rafRef = useRef(null)

    // ── Sync video state ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!videoEl) return
        const onPlay = () => setPlaying(true)
        const onPause = () => setPlaying(false)
        const onTimeUpdate = () => { if (!isDragging) setCurrentTime(videoEl.currentTime) }
        const onDuration = () => setDuration(videoEl.duration)
        const onVolumeChange = () => setMuted(videoEl.muted)

        videoEl.addEventListener('play', onPlay)
        videoEl.addEventListener('pause', onPause)
        videoEl.addEventListener('timeupdate', onTimeUpdate)
        videoEl.addEventListener('durationchange', onDuration)
        videoEl.addEventListener('volumechange', onVolumeChange)

        setPlaying(!videoEl.paused)
        setMuted(videoEl.muted)
        setCurrentTime(videoEl.currentTime)
        if (videoEl.duration) setDuration(videoEl.duration)

        return () => {
            videoEl.removeEventListener('play', onPlay)
            videoEl.removeEventListener('pause', onPause)
            videoEl.removeEventListener('timeupdate', onTimeUpdate)
            videoEl.removeEventListener('durationchange', onDuration)
            videoEl.removeEventListener('volumechange', onVolumeChange)
        }
    }, [videoEl, isDragging])

    // ── Mirror video to canvas ────────────────────────────────────────────────
    useEffect(() => {
        if (!videoEl || !canvasRef.current) return
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const draw = () => {
            if (videoEl.readyState >= 2 && videoEl.videoWidth) {
                if (canvas.width !== videoEl.videoWidth) {
                    canvas.width = videoEl.videoWidth
                    canvas.height = videoEl.videoHeight
                    setVideoRatio(videoEl.videoWidth / videoEl.videoHeight)
                }
                ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
            }
            rafRef.current = requestAnimationFrame(draw)
        }
        rafRef.current = requestAnimationFrame(draw)
        return () => cancelAnimationFrame(rafRef.current)
    }, [videoEl])

    // ── Auto-hide controls ────────────────────────────────────────────────────
    const resetHideTimer = useCallback(() => {
        setShowControls(true)
        clearTimeout(hideTimerRef.current)
        hideTimerRef.current = setTimeout(() => setShowControls(false), 3500)
    }, [])

    useEffect(() => {
        resetHideTimer()
        return () => clearTimeout(hideTimerRef.current)
    }, [resetHideTimer])

    // ── Toggle play/pause ─────────────────────────────────────────────────────
    const togglePlay = useCallback(() => {
        if (!videoEl) return
        // Flash icon
        setTapFlash(true)
        setTimeout(() => setTapFlash(false), 350)

        if (videoEl.paused) {
            videoEl.play().catch(() => { videoEl.muted = true; videoEl.play() })
        } else {
            videoEl.pause()
        }
        resetHideTimer()
    }, [videoEl, resetHideTimer])

    const toggleMute = useCallback(() => {
        if (!videoEl) return
        videoEl.muted = !videoEl.muted
        resetHideTimer()
    }, [videoEl, resetHideTimer])

    // ── Seek ─────────────────────────────────────────────────────────────────
    const getSeekRatio = (e) => {
        if (!progressRef.current) return 0
        const rect = progressRef.current.getBoundingClientRect()
        const clientX = e.touches ? e.touches[0].clientX : e.clientX
        return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    }

    const seekTo = useCallback((e) => {
        if (!videoEl || !videoEl.duration) return
        const ratio = getSeekRatio(e)
        videoEl.currentTime = ratio * videoEl.duration
        setCurrentTime(ratio * videoEl.duration)
        resetHideTimer()
    }, [videoEl, resetHideTimer])

    const progress = duration ? (currentTime / duration) * 100 : 0

    return (
        /* Full-screen dim backdrop — camera still visible through blur */
        <div
            className="fixed inset-0 z-[9998] flex items-center justify-center pointer-events-auto"
            style={{
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
            }}
        >
            {/* ── Glass Card — centered, full mobile width ── */}
            <div
                className="w-[92vw] max-w-sm animate-in zoom-in-95 fade-in duration-400 max-h-[90vh] flex flex-col"
                style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: '2.25rem',
                    boxShadow: `
                        0 0 0 1px rgba(255,255,255,0.06) inset,
                        0 40px 80px rgba(0,0,0,0.70),
                        0 0 60px rgba(99,102,241,0.18),
                        0 -1px 0 rgba(255,255,255,0.20) inset
                    `,
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Glowing top-light shimmer ── */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px rounded-full pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)' }}
                />

                {/* ── Header: title + close ── */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                        <span className="text-white text-sm font-bold truncate leading-none">
                            {target.contentTitle || target.name}
                        </span>
                        <span
                            className="text-[9px] uppercase tracking-widest font-black flex-shrink-0 px-1.5 py-0.5 rounded-md"
                            style={{ color: '#818cf8', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}
                        >
                            Live AR
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90"
                        style={{
                            background: 'rgba(255,255,255,0.10)',
                            border: '1px solid rgba(255,255,255,0.15)',
                        }}
                    >
                        <X size={16} className="text-white/80" />
                    </button>
                </div>

                {/* ── Video area ── */}
                <div className="px-3 pb-3">
                    <div
                        className="relative overflow-hidden select-none w-full"
                        style={{
                            borderRadius: '1.75rem',
                            aspectRatio: `${videoRatio}`,
                            background: '#000',
                            border: '1px solid rgba(255,255,255,0.08)',
                        }}
                        onMouseMove={resetHideTimer}
                        onTouchStart={resetHideTimer}
                    >
                        {/* Canvas — the video frame mirror */}
                        <canvas
                            ref={canvasRef}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                borderRadius: '1.75rem',
                                display: 'block',
                            }}
                        />

                        {/* Dark gradient for controls legibility */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-opacity duration-400"
                            style={{
                                borderRadius: '1.75rem',
                                background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.10) 45%, transparent 100%)',
                                opacity: showControls ? 1 : 0,
                            }}
                        />

                        {/* ── Invisible click layer for play/pause — sits on top of canvas ── */}
                        <button
                            onClick={togglePlay}
                            className="absolute inset-0 w-full h-full cursor-pointer focus:outline-none"
                            style={{ background: 'transparent', borderRadius: '1.75rem' }}
                            aria-label={playing ? 'Pause' : 'Play'}
                        />

                        {/* ── Centre play/pause icon flash — pointer-events-none so button behind works ── */}
                        <div
                            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-400"
                            style={{ opacity: showControls || tapFlash ? 1 : 0 }}
                        >
                            <div
                                className="w-14 h-14 flex items-center justify-center rounded-full transition-all duration-200"
                                style={{
                                    background: tapFlash
                                        ? 'rgba(255,255,255,0.30)'
                                        : 'rgba(0,0,0,0.45)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1.5px solid rgba(255,255,255,0.25)',
                                    transform: tapFlash ? 'scale(1.15)' : 'scale(1)',
                                    boxShadow: tapFlash ? '0 0 24px rgba(99,102,241,0.6)' : 'none',
                                }}
                            >
                                {playing
                                    ? <Pause size={24} className="text-white fill-white" />
                                    : <Play size={24} className="text-white fill-white" style={{ marginLeft: 3 }} />
                                }
                            </div>
                        </div>

                        {/* ── Bottom controls — pointer-events-auto on top of transparent button ── */}
                        <div
                            className="absolute bottom-0 left-0 right-0 px-4 pb-3 transition-opacity duration-400"
                            style={{ opacity: showControls ? 1 : 0 }}
                        >
                            {/* Progress bar */}
                            <div
                                ref={progressRef}
                                className="relative h-1 rounded-full mb-3 cursor-pointer"
                                style={{ background: 'rgba(255,255,255,0.25)', touchAction: 'none' }}
                                onMouseDown={(e) => { setIsDragging(true); seekTo(e) }}
                                onMouseMove={(e) => { if (isDragging) seekTo(e) }}
                                onMouseUp={(e) => { seekTo(e); setIsDragging(false) }}
                                onMouseLeave={() => isDragging && setIsDragging(false)}
                                onTouchStart={(e) => { e.stopPropagation(); setIsDragging(true); seekTo(e) }}
                                onTouchMove={(e) => { e.stopPropagation(); seekTo(e) }}
                                onTouchEnd={(e) => { e.stopPropagation(); seekTo(e); setIsDragging(false) }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Played fill */}
                                <div
                                    className="absolute left-0 top-0 h-full rounded-full"
                                    style={{
                                        width: `${progress}%`,
                                        background: 'linear-gradient(90deg, #6366f1, #22d3ee)',
                                        boxShadow: '0 0 6px rgba(99,102,241,0.9)',
                                        transition: isDragging ? 'none' : 'width 0.1s linear',
                                    }}
                                />
                                {/* Thumb */}
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white"
                                    style={{
                                        left: `calc(${progress}% - 6px)`,
                                        boxShadow: '0 1px 6px rgba(0,0,0,0.5)',
                                        transition: isDragging ? 'none' : 'left 0.1s linear',
                                    }}
                                />
                            </div>

                            {/* Controls row */}
                            <div
                                className="flex items-center gap-3"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Play/Pause */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); togglePlay() }}
                                    className="text-white active:scale-90 transition-transform p-1"
                                >
                                    {playing
                                        ? <Pause size={18} className="fill-white" />
                                        : <Play size={18} className="fill-white" style={{ marginLeft: 2 }} />
                                    }
                                </button>

                                {/* Mute */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleMute() }}
                                    className="text-white/70 hover:text-white active:scale-90 transition-all p-1"
                                >
                                    {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                </button>

                                {/* Time */}
                                <span className="text-white/75 text-[11px] font-mono tabular-nums">
                                    {fmtTime(currentTime)}
                                    <span className="text-white/35"> / </span>
                                    {fmtTime(duration)}
                                </span>

                                <div className="flex-1" />

                                {/* Fullscreen */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (videoEl?.requestFullscreen) videoEl.requestFullscreen()
                                        else if (videoEl?.webkitEnterFullscreen) videoEl.webkitEnterFullscreen()
                                    }}
                                    className="text-white/70 hover:text-white active:scale-90 transition-all p-1"
                                >
                                    <Maximize2 size={15} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Footer strip ── */}
                <div className="flex items-center gap-3 px-5 pb-5 pt-1">
                    <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.28)' }}
                    >
                        <Zap size={14} className="text-indigo-400 fill-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white/85 text-xs font-semibold truncate leading-none">
                            {target.contentTitle || target.name}
                        </p>
                        <p className="text-white/35 text-[9px] uppercase tracking-widest leading-none mt-0.5">
                            AR Augmented Content
                        </p>
                    </div>
                    <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
                        style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-emerald-400 text-[9px] font-black uppercase tracking-widest">Live</span>
                    </div>
                </div>

                {/* ── Bottom light shimmer ── */}
                <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px rounded-full pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent)' }}
                />
            </div>
        </div>
    )
}

// ─── Main AR Scanner ──────────────────────────────────────────────────────────
export default function ARScanner() {
    const { slug } = useParams()
    const [room, setRoom] = useState(null)
    const [targets, setTargets] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [arReady, setArReady] = useState(false)
    const [showGuide, setShowGuide] = useState(true)
    const [activeTarget, setActiveTarget] = useState(null)
    const [showContent, setShowContent] = useState(false)
    const [activeVideoEl, setActiveVideoEl] = useState(null)

    const containerRef = useRef(null)
    const arSystemRef = useRef(null)
    const initStartedRef = useRef(false)
    const videoElementsRef = useRef([])

    // Fetch room
    useEffect(() => {
        api.get(`/rooms/public/${slug}`)
            .then(({ data }) => {
                setRoom(data.room)
                setTargets(data.targets)
                const deviceId = getDeviceId()
                api.post(`/analytics/scan/${data.room._id}`, { deviceId }).catch(() => { })
            })
            .catch(err => setError(err.response?.data?.message || 'Room not found or not published'))
            .finally(() => setLoading(false))
    }, [slug])

    // Init MindAR
    useEffect(() => {
        if (!room || targets.length === 0 || arReady) return
        if (initStartedRef.current) return
        initStartedRef.current = true

        if (room.mindFileUrl) {
            initAR(targets, room.mindFileUrl)
            return
        }

        const readyTargets = targets.filter(t => t.mindFileStatus === 'ready' && t.mindFileUrl)
        if (readyTargets.length === 0) {
            setError('AR tracking data is not ready yet. Please build the tracking hub in dashboard.')
            return
        }

        initAR(readyTargets, readyTargets[0].mindFileUrl)

        return () => {
            if (arSystemRef.current) { try { arSystemRef.current.stop() } catch (_) { } }
            videoElementsRef.current.forEach(v => {
                try {
                    v.pause()
                    v.removeAttribute('src')
                    v.load()
                } catch (e) { }
            })
            videoElementsRef.current = []
        }
    }, [room, targets, arReady])

    const initAR = async (readyTargets, mindFileUrl) => {
        try {
            const [THREE, { MindARThree }] = await Promise.all([
                import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'),
                import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js')
            ])

            if (!THREE || !MindARThree) throw new Error('Failed to load AR libraries')
            window.THREE = THREE

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

            readyTargets.forEach((target, index) => {
                const anchor = mindarThree.addAnchor(index)
                const lastTrackedRef = { time: 0 }
                const geometry = new THREE.PlaneGeometry(1, 0.75)

                let material

                if (target.contentType === 'video' && target.contentUrl) {
                    const video = document.createElement('video')
                    video.src = target.contentUrl
                    video.crossOrigin = 'anonymous'
                    video.loop = true
                    video.muted = false
                    video.playsInline = true
                    video.setAttribute('playsinline', 'true')
                    videoElementsRef.current.push(video)

                    // ✅ FIX: Fully INVISIBLE material on the 3D plane — video plays only in glass modal
                    material = new THREE.MeshBasicMaterial({
                        transparent: true,
                        opacity: 0,           // completely invisible in 3D
                        side: THREE.DoubleSide,
                    })

                    anchor.onTargetFound = () => {
                        video.play().catch(() => {
                            video.muted = true
                            video.play().catch(e => console.error('Autoplay failed:', e))
                        })
                        setActiveTarget(target)
                        setActiveVideoEl(video)
                        setShowContent(true)
                        setShowGuide(false)

                        const now = Date.now()
                        if (now - lastTrackedRef.time > 10000) {
                            lastTrackedRef.time = now
                            api.post(`/analytics/interaction/${room._id}/${target._id}`).catch(() => { })
                        }
                    }

                    anchor.onTargetLost = () => {
                        if (video && !video.paused) {
                            video.pause();
                        }
                        setShowContent(false);
                        setActiveTarget(null);
                    }
                } else {
                    // PDF / info / image targets — semi-transparent glow plane
                    material = new THREE.MeshBasicMaterial({
                        color: 0x4f46e5,
                        transparent: true,
                        opacity: 0.35,
                        side: THREE.DoubleSide,
                    })

                    anchor.onTargetFound = () => {
                        setActiveTarget(target)
                        setActiveVideoEl(null)
                        setShowContent(true)
                        setShowGuide(false)

                        const now = Date.now()
                        if (now - lastTrackedRef.time > 10000) {
                            lastTrackedRef.time = now
                            api.post(`/analytics/interaction/${room._id}/${target._id}`).catch(() => { })
                        }
                    }

                    anchor.onTargetLost = () => {
                        setShowContent(false);
                        setActiveTarget(null);
                    }
                }

                const plane = new THREE.Mesh(geometry, material)
                anchor.group.add(plane)
            })

            try {
                await mindarThree.start()
                renderer.setAnimationLoop(() => renderer.render(scene, camera))
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

    const handleCloseContent = () => {
        setShowContent(false)
        if (activeVideoEl && !activeVideoEl.paused) activeVideoEl.pause()
    }

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) return (
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

    // ── Error ─────────────────────────────────────────────────────────────────
    if (error) return (
        <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <X className="w-7 h-7 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white">AR Experience Unavailable</h1>
            <p className="text-dark-300 text-sm max-w-xs">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary mt-2">Retry</button>
        </div>
    )

    // ── AR Scanner ────────────────────────────────────────────────────────────
    return (
        <div className="relative w-screen h-screen overflow-hidden bg-black">

            {/* MindAR camera container */}
            <div ref={containerRef} className="ar-container" />

            {/* ── All overlays ── */}
            <div className="ar-overlay pointer-events-none">

                {/* Top Nav */}
                <div className="fixed top-0 left-0 right-0 z-[100] px-4 pt-4 pb-10 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 pointer-events-auto">
                        <div className="flex items-center gap-3">
                            <img src="https://res.cloudinary.com/djoyq5lra/image/upload/v1773035253/file_00000000c35871fd85fb742005c6feb4_nylaiq.png" alt="Phygital Logo" className="h-12 w-auto object-contain drop-shadow-lg" />
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="glass rounded-2xl h-10 px-3 sm:px-4 flex items-center justify-center border-white/10 backdrop-blur-3xl shadow-xl min-w-0">
                                <div className="text-right flex flex-col justify-center items-end">
                                    <span className="text-white text-[11px] sm:text-xs font-black tracking-tight leading-none truncate max-w-[100px] sm:max-w-[180px]">{room?.name}</span>
                                    <span className="text-primary-400 text-[7px] font-black uppercase tracking-widest mt-0.5 opacity-90">Access Point</span>
                                </div>
                            </div>
                            {!showGuide && arReady && (
                                <button
                                    onClick={() => setShowGuide(true)}
                                    className="w-10 h-10 shrink-0 glass rounded-2xl flex items-center justify-center text-white border-white/10 hover:bg-white/20 transition-all active:scale-95 shadow-xl"
                                >
                                    <Info size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Scanning ring */}
                {arReady && !activeTarget && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-8">
                        <div className="relative w-64 h-64">
                            <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-primary-400 rounded-tl-3xl" />
                            <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-primary-400 rounded-tr-3xl" />
                            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-primary-400 rounded-bl-3xl" />
                            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-primary-400 rounded-br-3xl" />
                            <div className="absolute inset-4 border border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/5 backdrop-blur-[1px]">
                                <div className="relative">
                                    <div className="absolute -inset-4 bg-primary-500/20 rounded-full blur-xl animate-pulse" />
                                    <Camera className="w-14 h-14 text-white/50 relative z-10" />
                                </div>
                                <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500 to-transparent top-0 animate-scanning-laser shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
                            </div>
                        </div>
                        <div className="mt-12 text-center space-y-3">
                            <p className="text-white text-lg font-bold tracking-wide drop-shadow-lg">Ready to Scan</p>
                            <p className="text-primary-400 text-xs font-medium uppercase tracking-[0.2em] bg-black/40 px-5 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                                Point at a target image
                            </p>
                        </div>
                    </div>
                )}

                {/* ✅ Glass Video Modal — centered, full-width, camera visible behind */}
                {showContent && activeTarget?.contentType?.toLowerCase() === 'video' && activeVideoEl && (
                    <GlassVideoModal
                        target={activeTarget}
                        videoEl={activeVideoEl}
                        onClose={handleCloseContent}
                    />
                )}

                {/* Image overlay */}
                {showContent && activeTarget?.contentType?.toLowerCase() === 'image' && (
                    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 pointer-events-auto">
                        <div className="w-full flex justify-end mb-6">
                            <button onClick={() => setShowContent(false)} className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white active:scale-90">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 w-full flex flex-col items-center justify-center gap-10 max-w-2xl mx-auto overflow-y-auto hide-scrollbar">
                            <div className="w-full relative shrink-0">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-indigo-500 rounded-3xl blur opacity-25" />
                                <div className="relative bg-dark-950 rounded-3xl p-2 border border-white/10 shadow-2xl overflow-hidden">
                                    <img src={activeTarget.contentUrl} alt={activeTarget.name} className="w-full h-auto max-h-[55vh] rounded-2xl object-contain mx-auto" />
                                </div>
                            </div>
                            <div className="w-full space-y-4 text-center shrink-0">
                                <h1 className="text-white text-3xl font-bold tracking-tight">{activeTarget.contentTitle || activeTarget.name}</h1>
                                {activeTarget.contentText && <p className="text-dark-300 text-base max-w-lg mx-auto leading-relaxed">{activeTarget.contentText}</p>}
                            </div>
                            <div className="w-full pb-8 shrink-0">
                                <button onClick={async () => {
                                    const a = document.createElement('a')
                                    a.href = `${api.defaults.baseURL}/targets/${activeTarget._id}/download`
                                    a.style.display = 'none'
                                    document.body.appendChild(a); a.click(); document.body.removeChild(a)
                                    toast.success('Download starting...')
                                }} className="w-full py-5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                                    <Zap size={24} className="fill-white" />
                                    <span className="text-lg uppercase tracking-widest">Download Image</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* PDF / Info panel */}
                {showContent && activeTarget && !['video', 'image'].includes(activeTarget.contentType?.toLowerCase()) && (
                    <div className="absolute inset-x-0 bottom-0 z-[9999] p-4 pointer-events-none animate-in slide-in-from-bottom-full duration-500">
                        <div className="bg-dark-950/95 rounded-[2.5rem] p-7 border border-white/10 shadow-2xl max-h-[85vh] overflow-y-auto pointer-events-auto backdrop-blur-3xl relative">
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full" />
                            <div className="flex items-start justify-between mb-8 pt-2">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center border border-primary-500/30">
                                        <Info size={28} className="text-primary-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-extrabold text-xl tracking-tight">{activeTarget.contentTitle || activeTarget.name}</h3>
                                        <div className="flex items-center gap-1.5 mt-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg w-fit">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-emerald-400 text-[10px] uppercase font-black tracking-widest">
                                                {activeTarget.contentType === 'none' ? 'Document' : activeTarget.contentType}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setShowContent(false)} className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-dark-300 hover:text-white active:scale-90">
                                    <X size={22} />
                                </button>
                            </div>
                            <div className="space-y-8 pb-4">
                                {(activeTarget.contentType?.toLowerCase() === 'pdf' || activeTarget.contentUrl) && (
                                    <div className="space-y-5">
                                        <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                                            <p className="text-dark-100 text-[15px] leading-relaxed font-medium">
                                                A document is available. Tap below to view.
                                            </p>
                                        </div>
                                        {activeTarget.contentUrl ? (
                                            <button onClick={async () => {
                                                const a = document.createElement('a')
                                                a.href = `${api.defaults.baseURL}/targets/${activeTarget._id}/download`
                                                a.style.display = 'none'
                                                document.body.appendChild(a); a.click(); document.body.removeChild(a)
                                                toast.success('Accessing document...')
                                            }} className="w-full py-5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-black rounded-[1.5rem] shadow-2xl flex items-center justify-center gap-4 active:scale-[0.97] border border-white/10">
                                                <Zap size={24} className="fill-white" />
                                                <span className="text-lg uppercase tracking-wider">Download PDF</span>
                                            </button>
                                        ) : (
                                            <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-[1.5rem] text-red-400 text-sm font-bold flex items-center gap-3">
                                                <X size={18} /> Attachment not available
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

                {/* Guide modal */}
                {showGuide && arReady && (
                    <div className="absolute inset-0 z-[10001] flex items-end justify-center p-6 bg-black/40 backdrop-blur-[2px] pointer-events-auto animate-in fade-in duration-500">
                        <div className="bg-dark-950/95 rounded-[2.5rem] p-8 w-full max-w-md border border-white/10 shadow-3xl animate-in slide-in-from-bottom-8 duration-700">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="flex justify-center flex-shrink-0">
                                        <img src="https://res.cloudinary.com/djoyq5lra/image/upload/v1773035253/file_00000000c35871fd85fb742005c6feb4_nylaiq.png" alt="Phygital Logo" className="h-10 w-auto object-contain drop-shadow-lg" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-black text-xl tracking-tight leading-none mb-1">{room?.name}</h3>
                                        <p className="text-primary-400 text-[10px] font-bold uppercase tracking-[0.2em] leading-none">Interactive Hub</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowGuide(false)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-dark-300 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-primary-500/10 border border-primary-500/20 rounded-2xl p-4 text-center shadow-inner">
                                    <p className="text-white/80 text-sm font-medium leading-relaxed">
                                        Total number of <span className="text-primary-400 font-bold">Phygitalize item</span> are present in this <span className="text-white font-bold">{room?.name}</span> is <span className="text-primary-400 font-black text-lg">{targets.filter(t => t.mindFileStatus === 'ready').length}</span>
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-white/40 text-[10px] uppercase font-black tracking-[0.25em] mb-4">Phygitalized Items</h4>

                                    <div className="relative mb-4">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                        <input
                                            type="text"
                                            placeholder="Search items..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500 placeholder:text-white/30 transition-colors"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto hide-scrollbar pb-2 pr-1">
                                        {targets.filter(t => t.mindFileStatus === 'ready' && t.name.toLowerCase().includes(searchQuery.toLowerCase())).map((t, i) => (
                                            <div key={t._id} className="relative group rounded-3xl overflow-hidden bg-dark-900 border border-white/10 aspect-square shadow-lg">
                                                {t.imageUrl ? (
                                                    <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-primary-400/50 p-2 bg-gradient-to-br from-white/5 to-transparent">
                                                        <Zap size={24} className="mb-2 opacity-30" />
                                                        <span className="text-[10px] text-center w-full truncate px-2 font-bold">{t.name}</span>
                                                    </div>
                                                )}

                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 pt-10 flex flex-col justify-end pointer-events-none">
                                                    <p className="text-sm font-black text-white truncate leading-tight drop-shadow-lg">{t.name}</p>
                                                    <p className="text-[9px] text-primary-400 uppercase font-black tracking-widest leading-none mt-1 drop-shadow-md">{t.contentType || 'Interaction'}</p>
                                                </div>

                                                <div className="absolute top-2 left-2 w-7 h-7 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white font-black text-xs shadow-xl">
                                                    {i + 1}
                                                </div>

                                                {/* Status dot */}
                                                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                            </div>
                                        ))}
                                        {targets.filter(t => t.mindFileStatus === 'ready' && t.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                            <div className="col-span-full py-8 text-center text-white/50 text-xs bg-white/5 border border-white/5 rounded-3xl">
                                                No items match your search.
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowGuide(false)}
                                    className="w-full py-5 bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-600 text-white font-black rounded-2xl shadow-2xl uppercase tracking-widest active:scale-[0.97] border border-white/10"
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
