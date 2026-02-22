
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing App...');
        // Baixa os dados da nuvem para o cache local primeiro
        await syncService.pullInitialData();
        console.log('Sync complete.');

        const savedUser = authService.getCurrentUser();
        if (savedUser) {
          setUser(savedUser);
        }
      } catch (err: any) {
        console.error('App init error:', err);
        setError(`Erro ao inicializar: ${err.message || err}`);
      } finally {
        setLoading(false);
      }
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

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-red-200 max-w-lg w-full">
          <h1 className="text-xl font-bold text-red-600 mb-4">Erro de Carregamento</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
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
