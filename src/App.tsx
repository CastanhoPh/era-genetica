
import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User, signOut } from 'firebase/auth';
import LoginPage from './LoginPage';
import { Outlet } from 'react-router-dom'; // Import Outlet

const auth = getAuth();

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth).catch((error) => {
      console.error("Logout Error:", error);
    });
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900"></div>; // Or a proper loading spinner
  }

  if (!user) {
    return <LoginPage />;
  }

  // The Outlet will render the component for the matched route (Admin or CharacterSheet)
  // We pass user and handleLogout down to the child routes via context or props if needed,
  // but for now, the router will handle which component to show.
  return (
    <div>
      {/* You can have a shared layout here if you want, e.g., a navbar with a logout button */}
      {/* <button onClick={handleLogout}>Logout</button> */}
      <Outlet />
    </div>
  );
}

export default App;
