import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
    children: React.ReactNode;
    requireRole?: 'admin' | 'student';
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireRole }) => {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                if (location.pathname !== '/login' && location.pathname !== '/' && !location.pathname.startsWith('/login')) {
                    navigate('/login');
                }
                setAuthenticated(false);
                setLoading(false);
                return;
            }

            if (requireRole) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    const userData = userDoc.data();

                    if (!userData || userData.role !== requireRole) {
                        // Redirect to their correct dashboard if role mismatch
                        if (userData?.role === 'admin') navigate('/admin');
                        else if (userData?.role === 'student') navigate('/student');
                        else navigate('/login');

                        setAuthenticated(false);
                    } else {
                        setAuthenticated(true);
                    }
                } catch (error) {
                    console.error("Error validating role:", error);
                    navigate('/login');
                    setAuthenticated(false);
                }
            } else {
                setAuthenticated(true);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [navigate, requireRole, location.pathname]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#F9FAF7]">
                <Loader2 className="h-10 w-10 text-[#1E293B] animate-spin" />
            </div>
        );
    }

    return authenticated ? <>{children}</> : null;
};
