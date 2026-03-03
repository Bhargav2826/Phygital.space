import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('phygital_user')
            return stored ? JSON.parse(stored) : null
        } catch {
            return null
        }
    })
    const [token, setToken] = useState(() => localStorage.getItem('phygital_token'))
    const [loading, setLoading] = useState(true)

    // Verify token on mount
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) { setLoading(false); return }
            try {
                const { data } = await api.get('/auth/me')
                setUser(data.user)
                localStorage.setItem('phygital_user', JSON.stringify(data.user))
            } catch {
                logout()
            } finally {
                setLoading(false)
            }
        }
        verifyToken()
    }, [])

    const login = useCallback((tokenValue, userData) => {
        setToken(tokenValue)
        setUser(userData)
        localStorage.setItem('phygital_token', tokenValue)
        localStorage.setItem('phygital_user', JSON.stringify(userData))
    }, [])

    const logout = useCallback(() => {
        setToken(null)
        setUser(null)
        localStorage.removeItem('phygital_token')
        localStorage.removeItem('phygital_user')
    }, [])

    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
    const isSuperAdmin = user?.role === 'superadmin'

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isSuperAdmin }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
    return ctx
}

export default AuthContext
