
import React, { useState, useEffect } from 'react';
import { Activity } from '../../types';
import { Save, X, AlertCircle } from 'lucide-react';

interface GradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (activity: Activity) => void;
  studentName: string;
  activity: Activity | null;
  bimester: string;
  readOnlyMetadata?: boolean;
}

export const GradeModal: React.FC<GradeModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  studentName, 
  activity,
  bimester,
  readOnlyMetadata = false
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('10');
  const [hasRecovery, setHasRecovery] = useState(false);
  const [recoveryScore, setRecoveryScore] = useState('');

  useEffect(() => {
    if (activity) {
      setTitle(activity.title);
      setDescription(activity.description || '');
      setScore(activity.score !== null ? activity.score.toString() : '');
      setMaxScore(activity.maxScore.toString());
      setHasRecovery(activity.hasRecovery);
      setRecoveryScore(activity.recoveryScore !== null ? activity.recoveryScore.toString() : '');
    }
  }, [activity]);

  if (!isOpen || !activity) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedScore = score === '' ? null : parseFloat(score);
    const parsedRecoveryScore = recoveryScore === '' ? null : parseFloat(recoveryScore);

    onSubmit({
      ...activity,
      title,
      description,
      score: parsedScore,
      maxScore: parseFloat(maxScore),
      hasRecovery,
      recoveryScore: hasRecovery ? parsedRecoveryScore : null
    });
    onClose();
  };

  const finalGrade = (() => {
    const s = score === '' ? 0 : parseFloat(score);
    const r = recoveryScore === '' ? 0 : parseFloat(recoveryScore);
    if (!hasRecovery) return s;
    return Math.max(s, r);
  })();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white">{studentName}</h3>
            <p className="text-emerald-100 text-sm">{bimester} - {activity.title}</p>
          </div>
          <button onClick={onClose} className="text-emerald-100 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título da Atividade</label>
            <input
              type="text"
              required
              value={title}
              disabled={readOnlyMetadata}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${readOnlyMetadata ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição / Conteúdo</label>
            <input
              type="text"
              value={description}
              disabled={readOnlyMetadata}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Resumo Cap. 4 e 5"
              className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${readOnlyMetadata ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nota da Atividade</label>
              <input
                type="number"
                min="0"
                max={maxScore}
                step="0.1"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="-"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor Máximo</label>
              <input
                type="number"
                required
                min="0.1"
                step="0.1"
                value={maxScore}
                disabled={readOnlyMetadata}
                onChange={(e) => setMaxScore(e.target.value)}
                className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${readOnlyMetadata ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={hasRecovery}
                        disabled={readOnlyMetadata}
                        onChange={e => setHasRecovery(e.target.checked)}
                        className={`w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300 ${readOnlyMetadata ? 'cursor-not-allowed opacity-60' : ''}`}
                    />
                    <span className="text-sm font-medium text-slate-700">Atividade tem Recuperação?</span>
                </label>
            </div>

            {hasRecovery && (
                <div className="animate-in slide-in-from-top-2">
                     <label className="block text-sm font-medium text-slate-700 mb-1">Nota da Recuperação</label>
                     <input
                        type="number"
                        min="0"
                        max={maxScore}
                        step="0.1"
                        value={recoveryScore}
                        onChange={(e) => setRecoveryScore(e.target.value)}
                        placeholder="-"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                    />
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        A nota final será a maior entre as duas ({finalGrade}).
                    </p>
                </div>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md transition-colors flex items-center gap-2 font-medium"
            >
              <Save className="w-4 h-4" />
              Salvar Nota
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
