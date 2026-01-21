import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { User } from '@/lib/types';

interface AuthContextType {
  user: SupabaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider - Initializing auth context');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthProvider - Initial session:', session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('AuthProvider - User found in session, fetching profile');
        fetchUserProfile(session.user.id);
      } else {
        console.log('AuthProvider - No user in session, setting loading to false');
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('AuthProvider - Auth state changed:', { event, session });
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('AuthProvider - User in session, fetching profile');
        fetchUserProfile(session.user.id);
      } else {
        console.log('AuthProvider - No user in session, clearing profile');
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // First get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', userError);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      // If user is a partner, also fetch partner profile using RPC (fixes 406 error)
      if (userData?.user_type === 'partner' || userData?.user_type === 'admin') {
        const { data: partnerData, error: partnerError } = await supabase
          .rpc('get_partner_profile_by_user_id', { p_user_id: userId });

        if (partnerError) {
          console.error('Error fetching partner profile:', partnerError);
        } else {
          // Merge user and partner data
          const mergedProfile = {
            ...userData,
            ...partnerData
          };
          setUserProfile(mergedProfile || null);
        }
      } else {
        setUserProfile(userData || null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (data.user) {
      await fetchUserProfile(data.user.id);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth`,
      },
    });

    if (error) throw error;

    // Create user profile immediately
    if (data.user) {
      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        user_type: 'customer',
      });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        throw profileError;
      }

      // Sign in user immediately after successful registration
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Error signing in after registration:', signInError);
        throw signInError;
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
