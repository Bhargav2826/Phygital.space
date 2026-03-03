import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Zap, Mail, Lock, Eye, EyeOff, User, Building2, ArrowRight } from 'lucide-react'
import Spinner from '../../components/UI/Spinner'

const Field = ({ id, label, icon: Icon, form, setForm, ...props }) => (
    <div className="form-group text-left">
        <label htmlFor={id} className="label">{label}</label>
        <div className="relative">
            <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
                id={id}
                className="input pl-10"
                onChange={e => setForm(p => ({ ...p, [id]: e.target.value }))}
                value={form[id]}
                {...props}
            />
        </div>
    </div>
)

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '', organization: '' })
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await api.post('/auth/register', form)
            login(data.token, data.user)
            toast.success('Account created! Welcome to Phygital.space 🎉')
            navigate('/dashboard')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
            <div className="orb w-96 h-96 bg-primary-600 top-[-100px] right-[-100px]" />
            <div className="orb w-80 h-80 bg-accent-500 bottom-[-80px] left-[-80px]" />

            <div className="w-full max-w-md relative z-10 animate-slide-up">
                <div className="text-center mb-6 sm:mb-8">
                    <Link to="/" className="inline-flex items-center gap-3 mb-4 sm:mb-6">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow-primary">
                            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <span className="text-xl sm:text-2xl font-bold text-white">Phygital<span className="text-primary-400">.space</span></span>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Create your account</h1>
                    <p className="text-dark-300 text-sm sm:text-base px-4">Start building AR experiences for free</p>
                </div>

                <div className="card p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Field id="name" label="Full name" icon={User} type="text" placeholder="John Smith" form={form} setForm={setForm} required />
                        <Field id="organization" label="Organization (optional)" icon={Building2} type="text" placeholder="City Museum" form={form} setForm={setForm} />
                        <Field id="email" label="Email address" icon={Mail} type="email" placeholder="you@museum.com" form={form} setForm={setForm} required />

                        <div className="form-group text-left">
                            <label htmlFor="password" className="label">Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                                <input
                                    id="password" type={showPw ? 'text' : 'password'}
                                    className="input pl-10 pr-10" placeholder="Min. 6 characters" required minLength={6}
                                    value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                                />
                                <button type="button" onClick={() => setShowPw(p => !p)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200">
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary w-full btn-lg mt-2" disabled={loading}>
                            {loading ? <Spinner size="sm" /> : <><span>Create Free Account</span><ArrowRight size={16} /></>}
                        </button>
                    </form>

                    <div className="divider my-6" />
                    <p className="text-center text-sm text-dark-300">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Sign in</Link>
                    </p>
                </div>

                <p className="text-center text-[10px] sm:text-xs text-dark-400 mt-4 px-6">
                    By registering you agree to our Terms of Service & Privacy Policy
                </p>
            </div>
        </div>
    )
}
