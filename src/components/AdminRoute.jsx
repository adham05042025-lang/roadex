import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabase';

function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (!error && profile?.role === 'admin') {
      setAllowed(true);
    }

    setLoading(false);
  };

  if (loading) {
    return <p style={{ padding: '40px' }}>Checking access...</p>;
  }

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
