import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [myList, setMyList] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const requireAuth = () => {
    if (!user) {
      navigate('/signin');
      return false;
    }
    return true;
  };

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
        fetchReminders(session.user.id);
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
        fetchReminders(session.user.id);
      } else {
        setMyList([]);
        setWatchHistory([]);
        setReminders([]);
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

  const signInWithGoogle = async () => {
    if (!supabase) throw new Error('Auth service is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
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
    if (!supabase) return;
    if (!requireAuth()) return;

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

  const fetchReminders = async (userId) => {
    if (!supabase) return;
    const { data } = await supabase
      .from('reminders')
      .select('movie_id, media_type, title, release_date, notified')
      .eq('user_id', userId);
    if (data) setReminders(data.map(r => ({ id: r.movie_id, type: r.media_type, title: r.title, releaseDate: r.release_date, notified: r.notified })));
  };

  const toggleReminder = async (item) => {
    if (!supabase) return;
    if (!requireAuth()) return;
    const exists = reminders.find(r => r.id === item.id);
    if (exists) {
      await supabase.from('reminders').delete().eq('user_id', user.id).eq('movie_id', item.id);
      setReminders(prev => prev.filter(r => r.id !== item.id));
    } else {
      await supabase.from('reminders').insert({
        user_id: user.id, movie_id: item.id, media_type: item.type,
        title: item.title, release_date: item.releaseDate || null
      });
      setReminders(prev => [...prev, { id: item.id, type: item.type, title: item.title, releaseDate: item.releaseDate || null, notified: false }]);
    }
  };

  const isReminded = (id) => reminders.some(r => r.id === id);

  // Check for due reminders on user change
  useEffect(() => {
    if (!user || !supabase) return;
    if (!('Notification' in window)) return;

    const checkDue = async () => {
      const due = reminders.filter(r => r.releaseDate && r.releaseDate <= new Date().toISOString().split('T')[0] && !r.notified);
      if (due.length === 0) return;

      if (Notification.permission === 'granted') {
        due.forEach(r => {
          new Notification('📅 Now Available on laura', { body: `${r.title} has been released!`, icon: '/favicon.svg' });
        });
      } else if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          due.forEach(r => {
            new Notification('📅 Now Available on laura', { body: `${r.title} has been released!`, icon: '/favicon.svg' });
          });
        }
      }

      // Mark as notified
      const { error } = await supabase
        .from('reminders')
        .update({ notified: true })
        .eq('user_id', user.id)
        .in('movie_id', due.map(r => r.id));
      if (!error) {
        setReminders(prev => prev.map(r => due.some(d => d.id === r.id) ? { ...r, notified: true } : r));
      }
    };
    checkDue();
  }, [user, reminders.length]);

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signInWithGoogle, signUp, signOut, myList, watchHistory, reminders, toggleMyList, toggleReminder, isInList, isReminded, saveToHistory }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
