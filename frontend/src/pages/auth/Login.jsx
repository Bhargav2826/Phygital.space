import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import Spinner from '../../components/UI/Spinner'

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' })
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await api.post('/auth/login', form)
            login(data.token, data.user)
            toast.success(`Welcome back, ${data.user.name}!`)
            navigate(data.user.role === 'superadmin' ? '/superadmin' : '/dashboard')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4 relative overflow-hidden">
            {/* Orbs */}
            <div className="orb w-96 h-96 bg-primary-600 top-[-100px] left-[-100px]" />
            <div className="orb w-80 h-80 bg-accent-500 bottom-[-80px] right-[-80px]" />

            <div className="w-full max-w-md relative z-10 animate-slide-up">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow-primary">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white">Phygital<span className="text-primary-400">.space</span></span>
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
                    <p className="text-dark-300">Sign in to manage your AR rooms</p>
                </div>

                <div className="card p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="form-group">
                            <label className="label">Email address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                                <input
                                    id="email"
                                    type="email"
                                    className="input pl-10"
                                    placeholder="you@museum.com"
                                    value={form.email}
                                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                                <input
                                    id="password"
                                    type={showPw ? 'text' : 'password'}
                                    className="input pl-10 pr-10"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                    required
                                />
                                <button type="button" onClick={() => setShowPw(p => !p)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200">
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary w-full btn-lg" disabled={loading}>
                            {loading ? <Spinner size="sm" /> : <><span>Sign In</span><ArrowRight size={16} /></>}
                        </button>
                    </form>

                    <div className="divider my-6" />

                    <p className="text-center text-sm text-dark-300">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                            Create one free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
