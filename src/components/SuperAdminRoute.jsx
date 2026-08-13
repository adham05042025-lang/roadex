import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabase';

function SuperAdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const { data: userData } =
      await supabase.auth.getUser();

    if (!userData.user) {
      setLoggedIn(false);
      setAllowed(false);
      setLoading(false);
      return;
    }

    setLoggedIn(true);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (
      !error &&
      profile?.role === 'super_admin'
    ) {
      setAllowed(true);
    } else {
      setAllowed(false);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <p style={{ padding: '40px' }}>
        Checking Super Admin access...
      </p>
    );
  }

  if (!loggedIn) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!allowed) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  return children;
}

export default SuperAdminRoute;
