import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { Student, SchoolClass, CLASS_LABELS, Bimester, BIMESTERS } from '../../types';
import { TrendingUp, Users, Award, AlertTriangle, GraduationCap, Trophy, Target } from 'lucide-react';
import { BiologicalLevelIcon, getAvatarStyles, getInitials, getRankColor } from '../UI/AvatarUtils';

interface StatisticsViewProps {
  students: Student[];
  selectedClass: SchoolClass | 'ALL';
  selectedStudentId?: string;
  currentBimester: Bimester;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ students, selectedClass, selectedStudentId, currentBimester }) => {
  
  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b'];

  // Dados para Gráfico de Turma (Médias por Bimestre)
  const classStats = useMemo(() => {
    return BIMESTERS.map(bim => {
      const classStudents = selectedClass === 'ALL' ? students : students.filter(s => s.schoolClass === selectedClass);
      let total = 0;
      let count = 0;

      classStudents.forEach(s => {
        const activities = s.bimesterGrades[bim];
        if (activities.every(a => a.score !== null)) {
          const avg = activities.reduce((sum, a) => sum + (a.hasRecovery ? Math.max(a.score || 0, a.recoveryScore || 0) : (a.score || 0)), 0) / 3;
          total += avg;
          count++;
        }
      });

      return {
        name: bim.split(' ')[0],
        média: count > 0 ? parseFloat((total / count).toFixed(1)) : 0
      };
    });
  }, [students, selectedClass]);

  // Dados para Gráfico de Pizza (Status de Aprovação)
  const distributionData = useMemo(() => {
    const classStudents = selectedClass === 'ALL' ? students : students.filter(s => s.schoolClass === selectedClass);
    let above = 0;
    let below = 0;

    classStudents.forEach(s => {
      const acts = s.bimesterGrades[currentBimester];
      // Only count if all activities have a score (not null)
      if (acts.every(a => a.score !== null)) {
        const avg = acts.reduce((sum, a) => sum + (a.hasRecovery ? Math.max(a.score || 0, a.recoveryScore || 0) : (a.score || 0)), 0) / 3;
        if (avg >= 6) above++; else below++;
      }
    });

    return [
      { name: 'Acima da Média (>= 6.0)', value: above },
      { name: 'Abaixo da Média (< 6.0)', value: below },
    ];
  }, [students, selectedClass, currentBimester]);

  // Top Students Data
  const topStudents = useMemo(() => {
      return students
        .filter(s => selectedClass === 'ALL' || s.schoolClass === selectedClass)
        .map(s => {
            const acts = s.bimesterGrades[currentBimester];
            const total = acts.reduce((sum, a) => sum + (a.hasRecovery ? Math.max(a.score || 0, a.recoveryScore || 0) : (a.score || 0)), 0);
            return { ...s, totalScore: total };
        })
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 10);
  }, [students, selectedClass, currentBimester]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* KPIs Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Total Alunos</p>
            <p className="text-3xl font-bold text-slate-800">{selectedClass === 'ALL' ? students.length : students.filter(s => s.schoolClass === selectedClass).length}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Users size={28}/></div>
        </div>
        <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Média da Turma</p>
            <p className="text-3xl font-bold text-slate-800">
                {classStats.find(c => c.name === currentBimester.split(' ')[0])?.média || 0} <span className="text-sm font-normal text-slate-400">pts</span>
            </p>
          </div>
          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><TrendingUp size={28}/></div>
        </div>
        <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Médias Acima de 6.0</p>
            <p className="text-3xl font-bold text-slate-800">
                {distributionData[0].value}
            </p>
          </div>
          <div className="bg-amber-100 p-3 rounded-xl text-amber-600"><Trophy size={28}/></div>
        </div>
        <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Médias Abaixo de 6.0</p>
            <p className="text-3xl font-bold text-slate-800">{distributionData[1].value}</p>
          </div>
          <div className="bg-purple-100 p-3 rounded-xl text-purple-600"><AlertTriangle size={28}/></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 List */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-slate-800 font-bold text-lg mb-8 flex items-center gap-2">
            <Trophy className="text-amber-500" size={24} />
            Top 10 — {currentBimester}
          </h3>
          <div className="space-y-4">
            {topStudents.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-slate-200 text-slate-500'}`}>
                            {i + 1}º
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">{s.name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <span className={s.schoolClass.includes('3') ? 'text-orange-500' : s.schoolClass.includes('2') ? 'text-purple-500' : 'text-blue-500'}>
                                    {CLASS_LABELS[s.schoolClass]}
                                </span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                <BiologicalLevelIcon level={s.biologicalLevel || 'ORGANELLE'} size={12} className={getRankColor(i)} />
                            </p>
                        </div>
                    </div>
                    <span className={`font-bold ${getRankColor(i)}`}>{s.totalScore.toFixed(1)}</span>
                </div>
            ))}
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-slate-800 font-bold text-lg mb-8 flex items-center gap-2">
            <TrendingUp className="text-emerald-600" size={24} />
            Performance Top 10
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={topStudents.map(s => ({ name: s.name.split(' ')[0], score: s.totalScore }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis domain={[0, 30]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};