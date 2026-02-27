import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [myList, setMyList] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMyList(session.user.id);
        fetchWatchHistory(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMyList(session.user.id);
        fetchWatchHistory(session.user.id);
      } else {
        setMyList([]);
        setWatchHistory([]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchMyList = async (userId) => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('my_list')
      .select('movie_id, media_type')
      .eq('user_id', userId);

    if (data) {
      setMyList(data.map(item => ({ id: item.movie_id, type: item.media_type })));
    }
  };

  const fetchWatchHistory = async (userId) => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('watch_history')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (data) {
      setWatchHistory(data.map(item => ({
        id: item.movie_id,
        type: item.media_type,
        season: item.season,
        episode: item.episode,
        updatedAt: item.updated_at
      })));
    }
  };

  const signIn = async (email, password) => {
    if (!supabase) throw new Error('Auth service is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password, name) => {
    if (!supabase) throw new Error('Auth service is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const toggleMyList = async (item) => {
    if (!supabase || !user) return; // Must be logged in

    const exists = myList.find(i => i.id === item.id);

    if (exists) {
      // Remove from DB
      await supabase
        .from('my_list')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', item.id);

      setMyList(prev => prev.filter(i => i.id !== item.id));
    } else {
      // Add to DB
      await supabase
        .from('my_list')
        .insert({ user_id: user.id, movie_id: item.id, media_type: item.type || 'movie' });

      setMyList(prev => [...prev, { id: item.id, type: item.type || 'movie' }]);
    }
  };

  const saveToHistory = async (item, season = null, episode = null) => {
    if (!supabase || !user) return;
    const { error } = await supabase
      .from('watch_history')
      .upsert({
        user_id: user.id,
        movie_id: item.id,
        media_type: item.type,
        season,
        episode,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,movie_id' }); // Assuming composite unique constraint on user_id + movie_id

    if (error) console.error("Failed to save history:", error.message);
  };

  const isInList = (id) => myList.some(i => i.id === id);

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, myList, watchHistory, toggleMyList, saveToHistory, isInList }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
