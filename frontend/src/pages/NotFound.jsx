import { Link } from 'react-router-dom'
import { Zap, Home } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
            <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-6 shadow-glow-primary">
                    <Zap className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-8xl font-black text-white mb-2">404</h1>
                <p className="text-xl font-semibold text-dark-200 mb-2">Page not found</p>
                <p className="text-dark-400 mb-8">The page you're looking for doesn't exist or has been moved.</p>
                <Link to="/" className="btn-primary btn-lg">
                    <Home size={18} /> Back to Home
                </Link>
            </div>
        </div>
    )
}
