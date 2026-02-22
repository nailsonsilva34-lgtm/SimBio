
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { Login } from './components/Auth/Login';
import { TeacherDashboard } from './components/Dashboard/TeacherDashboard';
import { StudentDashboard } from './components/Dashboard/StudentDashboard';
import { Header } from './components/Layout/Header';
import { authService } from './services/authService';
import { syncService } from './services/syncService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      // Baixa os dados da nuvem para o cache local primeiro
      await syncService.pullInitialData();

      const savedUser = authService.getCurrentUser();
      if (savedUser) {
        setUser(savedUser);
      }
      setLoading(false);
    };

    initializeApp();
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-black text-emerald-600">Carregando...</div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(user.role === UserRole.TEACHER || user.role === UserRole.MONITOR) ? (
          <TeacherDashboard user={user} />
        ) : (
          user.studentData && <StudentDashboard student={user.studentData} />
        )}
      </main>
    </div>
  );
};

export default App;
