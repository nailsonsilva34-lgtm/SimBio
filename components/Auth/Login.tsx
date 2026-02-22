
import React, { useState, useEffect } from 'react';
import { UserRole, SchoolClass, CLASS_LABELS, ResidenceType, RESIDENCE_LABELS } from '../../types';
import { initData, registerStudent, registerTeacher } from '../../services/dataService';
import { authService } from '../../services/authService';
import { User, Lock, ChevronRight, Dna, Mail, BookOpen, GraduationCap, MapPin, AlertCircle, ShieldCheck } from '../UI/Icons';

interface LoginProps {
  onLogin: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasTeacher, setHasTeacher] = useState(false);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regClass, setRegClass] = useState<SchoolClass>('1A');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regBiologicalSex, setRegBiologicalSex] = useState<'M' | 'F'>('M');
  const [regResidence, setRegResidence] = useState<ResidenceType>('URBAN');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    initData();
    const loadTeacherCheck = async () => {
      const exists = await authService.checkTeacherExists();
      setHasTeacher(exists);
    };
    loadTeacherCheck();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsRegistering(false);
    // Wait, adding an isLoading state would be better, but for simplicity:

    try {
      const user = await authService.login(identifier, password, role);
      onLogin(user);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (role === UserRole.STUDENT) {
        await authService.register(
          regEmail, regPassword, role, regName,
          { schoolClass: regClass, birthDate: regBirthDate, biologicalSex: regBiologicalSex, residenceType: regResidence }
        );
        setIdentifier(regEmail);
      } else {
        await authService.register(regEmail, regPassword, role, regName);
        setIdentifier(regEmail);
        setHasTeacher(true);
      }
      setSuccessMsg("Conta criada com sucesso! Faça login abaixo.");
      setIsRegistering(false);
    } catch (err) { setError((err as Error).message); }
  };

  const showRegisterLink = role === UserRole.STUDENT || !hasTeacher;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 relative z-10 border border-slate-100 overflow-y-auto max-h-[95vh]">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-[2rem] mb-6 text-emerald-600 shadow-xl shadow-emerald-500/10">
            <Dna size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic">SímBio</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Acesse suas Notas e Desempenho</p>
        </div>

        {!isRegistering && (
          <div className="flex p-1.5 bg-slate-100 rounded-3xl mb-8">
            {['STUDENT', 'TEACHER'].map(r => (
              <button key={r} onClick={() => { setRole(r as any); setError(''); }} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${role === r ? 'bg-white text-emerald-700 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
                {r === 'STUDENT' ? 'Estudante' : 'Professor'}
              </button>
            ))}
          </div>
        )}

        {isRegistering ? (
          <form onSubmit={handleRegister} className="space-y-5 animate-in slide-in-from-bottom-4">
            <input type="text" value={regName} onChange={e => setRegName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-emerald-500/10" placeholder="Nome Completo" required />
            <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-emerald-500/10" placeholder="E-mail" required />

            {role === UserRole.STUDENT && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Série/Turma</label>
                    <select value={regClass} onChange={e => setRegClass(e.target.value as any)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm">
                      {Object.entries(CLASS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Sexo Biológico</label>
                    <select value={regBiologicalSex} onChange={e => setRegBiologicalSex(e.target.value as any)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm">
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nascimento</label>
                    <input type="date" value={regBirthDate} onChange={e => setRegBirthDate(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Residência</label>
                    <select value={regResidence} onChange={e => setRegResidence(e.target.value as any)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm">
                      {Object.entries(RESIDENCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-emerald-500/10" placeholder="Crie uma Senha" required />

            <button type="submit" className="w-full bg-emerald-600 text-white font-black py-5 rounded-3xl shadow-2xl hover:bg-emerald-700 transition-all uppercase tracking-widest">Registrar Agora</button>
            <button type="button" onClick={() => setIsRegistering(false)} className="w-full text-xs font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600">Voltar para Login</button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="email" value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-emerald-500/10" placeholder="Seu E-mail" required />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-emerald-500/10" placeholder="Sua Senha" required />
              </div>
            </div>
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100">{error}</div>}
            {successMsg && <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">{successMsg}</div>}
            <button type="submit" className="w-full bg-emerald-600 text-white font-black py-5 rounded-[1.8rem] shadow-2xl shadow-emerald-500/30 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3">
              Acessar Portal <ChevronRight size={20} />
            </button>
            {role === UserRole.TEACHER && (
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                <ShieldCheck className="text-blue-600 shrink-0" size={18} />
                <p className="text-[9px] text-blue-900 font-bold uppercase leading-tight tracking-widest">Monitores podem usar este acesso com suas próprias credenciais.</p>
              </div>
            )}
            {showRegisterLink && (
              <button type="button" onClick={() => setIsRegistering(true)} className="w-full text-xs font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600">Não tem conta? Cadastre-se</button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
