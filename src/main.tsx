
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

import AdminDashboard from './components/AdminDashboard';
import CharacterSheet from './components/CharacterSheet';
import LoginPage from './LoginPage';

import './index.css';
import './firebase.ts';

const auth = getAuth();
const root = createRoot(document.getElementById('root')!);

// Render a temporary loading screen
root.render(
  <StrictMode>
    <div className="min-h-screen bg-slate-900"></div>
  </StrictMode>
);

onAuthStateChanged(auth, async (user) => {
  let router;
  if (user) {
    // *** THE FINAL FIX IS HERE ***
    // Force a refresh of the ID token to get the latest claims from the server.
    const idTokenResult = await user.getIdTokenResult(true);
    
    const isAdmin = !!idTokenResult.claims.admin;

    const handleLogout = () => auth.signOut();

    router = createBrowserRouter([
      {
        path: '/',
        element: isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/character" replace />,
      },
      {
        path: '/admin',
        element: isAdmin ? <AdminDashboard adminUser={user} handleLogout={handleLogout} /> : <Navigate to="/character" replace />,
      },
      {
        path: '/character',
        element: <CharacterSheet user={user} handleLogout={handleLogout} />,
      },
      { // Redirect any other authenticated path to the root
        path: '/*',
        element: <Navigate to="/" replace />,
      }
    ]);
  } else {
    // Router for logged-out users
    router = createBrowserRouter([
      {
        path: '/login',
        element: <LoginPage />,
      },
      { // Catches all other paths and redirects to login
        path: '/*',
        element: <Navigate to="/login" replace />,
      },
    ]);
  }

  // Render the application with the correct router
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
});
