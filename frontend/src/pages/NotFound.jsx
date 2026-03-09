import { Link } from 'react-router-dom'
import { Zap, Home } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
            <div className="text-center">
                <div className="h-20 w-auto flex justify-center mx-auto mb-6">
                    <img src="https://res.cloudinary.com/djoyq5lra/image/upload/v1773035253/file_00000000c35871fd85fb742005c6feb4_nylaiq.png" alt="Phygital Logo" className="h-full w-auto object-contain" />
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
