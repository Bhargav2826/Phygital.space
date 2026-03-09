import { Link } from 'react-router-dom'
import { Zap, Image, Video, QrCode, BarChart3, ArrowRight, CheckCircle2, Scan } from 'lucide-react'

const features = [
    { icon: Image, title: 'Upload Image Targets', desc: 'Upload any real-world image — painting, poster, product. It becomes a scannable AR target.' },
    { icon: Video, title: 'Link AR Content', desc: 'Attach videos, PDFs, 3D info panels to each image. Content appears instantly on scan.' },
    { icon: QrCode, title: 'Generate Scanner', desc: 'Get a unique QR code & URL. Share it with visitors. No app download needed.' },
    { icon: BarChart3, title: 'Track Analytics', desc: 'See total scans, unique visitors, most viewed targets, and daily engagement charts.' },
]

const steps = [
    'Create an AR Room for your space',
    'Upload images that visitors will scan',
    'Attach videos or PDFs to each image',
    'Generate your scanner QR code',
    'Visitors scan → see AR content',
]

const useCases = ['Museums', 'Art Galleries', 'Real Estate', 'Events & Expos', 'Retail Products', 'Education']

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-dark-950 text-white">
            {/* Nav */}
            <nav className="border-b border-dark-800 sticky top-0 z-50 bg-dark-950/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <img src="https://res.cloudinary.com/djoyq5lra/image/upload/v1773035253/file_00000000c35871fd85fb742005c6feb4_nylaiq.png" alt="Phygital.space" className="h-10 sm:h-12 w-auto object-contain" />
                        <span className="-ml-3 sm:-ml-4 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">Phygital<span className="text-primary-400">.space</span></span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link to="/login" className="hidden xs:inline-flex btn-ghost py-2 px-3 sm:px-5 text-xs sm:text-sm">Sign in</Link>
                        <Link to="/register" className="btn-primary py-2 px-3 sm:px-5 text-xs sm:text-sm whitespace-nowrap">
                            <span className="sm:hidden">Get Started</span>
                            <span className="hidden sm:inline">Get Started Free</span>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative overflow-hidden pt-12 sm:pt-24 pb-20 sm:pb-32">
                <div className="orb w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-primary-600 top-[-100px] sm:top-[-200px] left-1/2 -translate-x-1/2" style={{ opacity: 0.08 }} />
                <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-primary-600/20 border border-primary-600/30 text-primary-300 text-[10px] sm:text-xs md:text-sm font-medium mb-6 sm:mb-8 mx-auto">
                        <Scan size={14} className="sm:w-4 sm:h-4" />
                        <span>WebAR — No app download required</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-6 tracking-tight">
                        Turn Physical Spaces<br className="hidden sm:block" />
                        into <span className="gradient-text">AR Experiences</span>
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-dark-300 max-w-2xl mx-auto mb-8 sm:mb-10 px-2 sm:px-0">
                        Phygital.space lets museums, galleries and events overlay digital content on real-world images —
                        instantly, in the browser, no app required.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0">
                        <Link to="/register" className="btn-primary w-full sm:w-auto btn-lg animate-pulse-glow flex items-center justify-center">
                            Start Building Free <ArrowRight size={18} />
                        </Link>
                        <Link to="/login" className="btn-secondary w-full sm:w-auto btn-lg flex items-center justify-center">Sign In</Link>
                    </div>

                    {/* Use cases */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-8 sm:mt-10 px-2">
                        {useCases.map(u => (
                            <span key={u} className="badge-blue text-[9px] sm:text-[10px] md:text-xs px-2.5 sm:px-3 py-0.5 sm:py-1">{u}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-16 sm:py-20 border-t border-dark-800 bg-dark-900/30">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-12">How It Works</h2>
                    <div className="space-y-3 sm:space-y-4">
                        {steps.map((step, i) => (
                            <div key={i} className="flex items-center gap-3 sm:gap-4 card p-3 sm:p-4 card-hover">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-600/20 border border-primary-600/30 flex items-center justify-center text-primary-400 font-bold text-xs sm:text-sm flex-shrink-0">
                                    {i + 1}
                                </div>
                                <span className="text-dark-200 text-sm sm:text-base leading-tight">{step}</span>
                                <CheckCircle2 size={16} className="ml-auto text-emerald-400 flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-16 sm:py-20 border-t border-dark-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 sm:mb-4 px-4">Everything You Need</h2>
                    <p className="text-sm sm:text-base text-dark-300 text-center mb-10 sm:mb-12 px-6">Powerful tools for AR experience creators</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {features.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="card-hover p-5 sm:p-6 group">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-600/20 border border-primary-600/30 flex items-center justify-center mb-4 group-hover:bg-primary-500/30 transition-colors">
                                    <Icon size={20} className="sm:w-[22px] sm:h-[22px] text-primary-400" />
                                </div>
                                <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">{title}</h3>
                                <p className="text-xs sm:text-sm text-dark-300 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 sm:py-24 border-t border-dark-800">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
                    <div className="card p-8 sm:p-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="h-16 w-auto flex justify-center mx-auto mb-6 relative z-10 transition-transform group-hover:scale-110">
                            <img src="https://res.cloudinary.com/djoyq5lra/image/upload/v1773035253/file_00000000c35871fd85fb742005c6feb4_nylaiq.png" alt="Phygital Logo" className="h-full w-auto object-contain" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold mb-4 px-2 relative z-10">Ready to go Phygital?</h2>
                        <p className="text-sm sm:text-base text-dark-300 mb-8 px-4 relative z-10">Create your first AR room in minutes. No credit card needed.</p>
                        <Link to="/register" className="btn-primary w-full sm:w-auto btn-lg relative z-10">
                            Create Free Account <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-dark-800 py-8 bg-dark-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4">
                    <div className="flex items-center gap-2">
                        <img src="https://res.cloudinary.com/djoyq5lra/image/upload/v1773035253/file_00000000c35871fd85fb742005c6feb4_nylaiq.png" alt="Phygital Logo" className="h-6 w-auto object-contain grayscale opacity-50 transition-all hover:grayscale-0 hover:opacity-100" />
                        <span className="text-[11px] sm:text-sm text-dark-400 sm:text-dark-300 text-center sm:text-left leading-tight px-4 sm:px-0">
                            © 2024 Phygital.space. <br className="sm:hidden" /> Bridge Physical + Digital.
                        </span>
                    </div>
                    <div className="flex gap-6 text-[11px] sm:text-sm text-dark-400">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
