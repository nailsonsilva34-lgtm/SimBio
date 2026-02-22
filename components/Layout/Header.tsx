
import React from 'react';
import { User, UserRole } from '../../types';
import { LogOut, Dna, Microscope, Users } from '../UI/Icons';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-emerald-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-700 p-2 rounded-lg">
                <Dna className="w-6 h-6 text-emerald-100" />
            </div>
            <span className="font-bold text-xl tracking-tight">SímBio</span>
          </div>
          
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {user.studentData?.avatarUrl ? (
                  <img src={user.studentData.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-emerald-700" />
                ) : (
                  <div className="bg-emerald-800 rounded-full p-1.5">
                     <Microscope className="w-5 h-5 text-emerald-200" />
                  </div>
                )}
                <div className="flex flex-col text-right">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-emerald-300 uppercase tracking-wider">
                        {user.role === UserRole.TEACHER ? 'Professor(a)' : 'Estudante'}
                    </span>
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="p-2 hover:bg-emerald-800 rounded-full transition-colors text-emerald-200 hover:text-white"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
