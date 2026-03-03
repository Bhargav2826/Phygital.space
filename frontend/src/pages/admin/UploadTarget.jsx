import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Spinner from '../../components/UI/Spinner'
import { ArrowLeft, Upload, Image, Video, FileText, ChevronRight, CheckCircle2, X, AlertCircle } from 'lucide-react'

const STEPS = ['Upload Image', 'Upload Content', 'Done']

export default function UploadTarget() {
    const { roomId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const targetIdFromQuery = queryParams.get('target')

    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(!!targetIdFromQuery)

    // Step 1
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [targetName, setTargetName] = useState('')
    const [createdTarget, setCreatedTarget] = useState(null)

    // Step 2
    const [contentType, setContentType] = useState('video')
    const [contentFile, setContentFile] = useState(null)
    const [contentTitle, setContentTitle] = useState('')
    const [contentText, setContentText] = useState('')

    const imageRef = useRef()
    const contentRef = useRef()

    // Fetch target if editing
    useEffect(() => {
        if (targetIdFromQuery) {
            const fetchTarget = async () => {
                try {
                    const { data } = await api.get(`/targets/${targetIdFromQuery}`)
                    const t = data.target
                    setCreatedTarget(t)
                    setTargetName(t.name)
                    setImagePreview(t.imageUrl)
                    setContentType(t.contentType !== 'none' ? t.contentType : 'video')
                    setContentTitle(t.contentTitle || '')
                    setContentText(t.contentText || '')
                    setStep(1) // Jump to content step
                } catch (err) {
                    toast.error('Failed to load target details')
                } finally {
                    setFetching(false)
                }
            }
            fetchTarget()
        }
    }, [targetIdFromQuery])

    const compileImage = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const img = new window.Image();
                    img.onload = async () => {
                        try {
                            // Dynamic import from CDN as recommended by user
                            const mindarModule = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js');
                            const { Compiler } = mindarModule;

                            if (!Compiler) {
                                throw new Error('MindAR Compiler not found in loaded module');
                            }

                            const compiler = new Compiler();
                            await compiler.compileImageTargets([img], (progress) => {
                                console.log(`[MindAR] Compilation progress: ${Math.round(progress)}%`);
                            });

                            const data = await compiler.exportData(); // ArrayBuffer = .mind file
                            const blob = new Blob([data], { type: 'application/octet-stream' });
                            resolve(blob);
                        } catch (err) { reject(err); }
                    };
                    img.onerror = () => reject(new Error('Failed to load image for compilation'));
                    img.src = reader.result;
                } catch (err) { reject(err); }
            };
            reader.onerror = () => reject(new Error('Failed to read image file'));
            reader.readAsDataURL(file);
        });
    }

    const handleImageSelect = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setImageFile(file)
        setTargetName(file.name.replace(/\.[^.]+$/, ''))
        const reader = new FileReader()
        reader.onload = (ev) => setImagePreview(ev.target.result)
        reader.readAsDataURL(file)
    }

    const handleUploadImage = async () => {
        if (!imageFile) { toast.error('Please select an image'); return }
        setLoading(true)
        const toastId = toast.loading('Compiling AR tracking data in your browser...')

        try {
            // 1. Compile in browser
            const mindBlob = await compileImage(imageFile);

            // 2. Upload both
            const fd = new FormData()
            fd.append('image', imageFile)
            fd.append('mind', mindBlob, `${targetName}.mind`)
            fd.append('name', targetName)

            toast.loading('Uploading to Phygital Cloud...', { id: toastId })
            const { data } = await api.post(`/targets/room/${roomId}`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            setCreatedTarget(data.target)
            toast.success('Done! Target compiled and uploaded.', { id: toastId })
            setStep(1)
        } catch (err) {
            console.error('Compilation/Upload error:', err);
            toast.error(err.message || 'Processing failed', { id: toastId })
        } finally { setLoading(false) }
    }

    const handleUploadContent = async () => {
        if (contentType !== 'info' && !contentFile) { toast.error('Please select a file'); return }
        setLoading(true)
        try {
            const fd = new FormData()
            fd.append('contentType', contentType)
            fd.append('contentTitle', contentTitle)
            fd.append('contentText', contentText)
            if (contentFile) fd.append('content', contentFile)
            await api.put(`/targets/${createdTarget._id}/content`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            toast.success('Content linked!')
            setStep(2)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Content upload failed')
        } finally { setLoading(false) }
    }

    const contentTypes = [
        { value: 'video', label: 'Video', icon: Video, accept: 'video/*', desc: 'MP4, WebM – plays over the target' },
        { value: 'pdf', label: 'PDF Doc', icon: FileText, accept: 'application/pdf', desc: 'PDF shown in overlay panel' },
        { value: 'image', label: 'Image', icon: Image, accept: 'image/*', desc: 'Image displayed as overlay' },
        { value: 'info', label: 'Info Text', icon: CheckCircle2, accept: null, desc: 'Text info card overlay' },
    ]

    if (fetching) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>

    return (
        <div className="animate-fade-in max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
                <Link to={`/dashboard/rooms/${roomId}`} className="btn-icon bg-dark-700 hover:bg-dark-600 text-dark-300"><ArrowLeft size={18} /></Link>
                <div>
                    <h1 className="page-title">Upload AR Target</h1>
                    <p className="page-subtitle">Add a scannable image and attach AR content</p>
                </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-8">
                {STEPS.map((s, i) => (
                    <div key={s} className="flex items-center gap-2 flex-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-400'
                            }`}>
                            {i < step ? <CheckCircle2 size={14} /> : i + 1}
                        </div>
                        <span className={`text-sm ${i === step ? 'text-white font-medium' : 'text-dark-400'}`}>{s}</span>
                        {i < STEPS.length - 1 && <ChevronRight size={14} className="text-dark-600 ml-auto" />}
                    </div>
                ))}
            </div>

            {/* Step 1: Image */}
            {step === 0 && (
                <div className="card p-6 space-y-5">
                    <h2 className="font-semibold text-white">Select Target Image</h2>
                    <div
                        onClick={() => imageRef.current?.click()}
                        className="border-2 border-dashed border-dark-600 hover:border-primary-500 rounded-2xl p-8 text-center cursor-pointer transition-all group relative overflow-hidden"
                    >
                        {imagePreview
                            ? <img src={imagePreview} alt="preview" className="max-h-48 mx-auto rounded-xl object-contain" />
                            : <div className="space-y-3">
                                <div className="w-14 h-14 rounded-2xl bg-primary-600/20 border border-primary-600/30 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                    <Upload size={24} className="text-primary-400" />
                                </div>
                                <p className="text-white font-medium">Click or drop image here</p>
                                <p className="text-dark-300 text-sm">JPG, PNG, WebP – max 100MB</p>
                            </div>}
                    </div>
                    <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

                    {imageFile && (
                        <div className="form-group">
                            <label className="label">Target Name</label>
                            <input className="input" value={targetName} onChange={e => setTargetName(e.target.value)} placeholder="e.g. Mona Lisa Painting" required />
                        </div>
                    )}

                    <button onClick={handleUploadImage} disabled={loading || !imageFile} className="btn-primary w-full">
                        {loading ? <Spinner size="sm" /> : <><Upload size={16} />Upload & Compile AR Tracking</>}
                    </button>
                </div>
            )}

            {/* Step 2: Content */}
            {step === 1 && (
                <div className="card p-6 space-y-5">
                    <h2 className="font-semibold text-white">Attach AR Content</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {contentTypes.map(({ value, label, icon: Icon, desc }) => (
                            <button key={value} type="button" onClick={() => { setContentType(value); setContentFile(null) }}
                                className={`p-4 rounded-xl border text-left transition-all ${contentType === value ? 'border-primary-500 bg-primary-600/10' : 'border-dark-600 bg-dark-700/50 hover:border-dark-500'}`}>
                                <Icon size={20} className={contentType === value ? 'text-primary-400' : 'text-dark-300'} />
                                <p className={`text-sm font-medium mt-2 ${contentType === value ? 'text-primary-300' : 'text-white'}`}>{label}</p>
                                <p className="text-xs text-dark-400 mt-0.5">{desc}</p>
                            </button>
                        ))}
                    </div>

                    <div className="form-group">
                        <label className="label">Content Title</label>
                        <input className="input" placeholder="e.g. Learn About This Artwork" value={contentTitle} onChange={e => setContentTitle(e.target.value)} />
                    </div>

                    {contentType === 'info' ? (
                        <div className="form-group">
                            <label className="label">Info Text</label>
                            <textarea className="textarea" rows={4} placeholder="Information that will appear when this target is scanned…" value={contentText} onChange={e => setContentText(e.target.value)} />
                        </div>
                    ) : (
                        <div>
                            <label className="label">Upload File</label>
                            <div
                                onClick={() => contentRef.current?.click()}
                                className="border-2 border-dashed border-dark-600 hover:border-primary-500 rounded-xl p-6 text-center cursor-pointer transition-all"
                            >
                                {contentFile
                                    ? <div className="flex items-center gap-3">
                                        <CheckCircle2 size={20} className="text-emerald-400" />
                                        <span className="text-sm text-white truncate">{contentFile.name}</span>
                                        <button type="button" onClick={e => { e.stopPropagation(); setContentFile(null) }}><X size={14} className="text-dark-400" /></button>
                                    </div>
                                    : <p className="text-dark-300 text-sm">Click to select {contentType} file</p>}
                            </div>
                            <input ref={contentRef} type="file" accept={contentTypes.find(c => c.value === contentType)?.accept} className="hidden" onChange={e => setContentFile(e.target.files[0])} />
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button type="button" onClick={() => { setStep(2); toast.success('Target saved without content') }} className="btn-secondary flex-1">Skip for Now</button>
                        <button onClick={handleUploadContent} disabled={loading} className="btn-primary flex-1">
                            {loading ? <Spinner size="sm" /> : 'Save Content'}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Done */}
            {step === 2 && (
                <div className="card p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} className="text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Target Added!</h2>
                    <p className="text-dark-300 mb-6">Your AR tracking file is being compiled in the background. Check the room once it's ready.</p>
                    <div className="flex gap-3 justify-center">
                        <Link to={`/dashboard/rooms/${roomId}`} className="btn-secondary">Back to Room</Link>
                        <button onClick={() => { setStep(0); setImageFile(null); setImagePreview(null); setContentFile(null); setCreatedTarget(null) }} className="btn-primary">
                            Add Another Target
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
