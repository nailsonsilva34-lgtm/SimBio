import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { SchoolClass, BiologicalSex, ResidenceType, UserRole } from '../../types';
import { authService } from '../../services/authService';

interface BatchImportProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const BatchImport: React.FC<BatchImportProps> = ({ onClose, onSuccess }) => {
    const [csvData, setCsvData] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);

    const handleImport = async () => {
        if (!csvData) return;
        setIsProcessing(true);
        const lines = csvData.split('\n').filter(l => l.trim() !== '');

        let successCount = 0;
        const errorLog: string[] = [];

        // Header expected: Nome,Email,Senha,Turma,Sexo(M/F),Residencia(URBAN/RURAL),Nascimento(YYYY-MM-DD)
        // Pula a primeira linha se for cabeçalho
        const startIdx = lines[0].toLowerCase().includes('nome') ? 1 : 0;

        for (let i = startIdx; i < lines.length; i++) {
            const columns = lines[i].split(',').map(c => c.trim());
            if (columns.length < 7) {
                errorLog.push(`Linha ${i + 1}: Faltam colunas obrigatórias.`);
                continue;
            }

            const [nome, email, senha, turmaRaw, sexoRaw, resRaw, nascRaw] = columns;

            try {
                // Processa Enums
                let objTurma: SchoolClass = '1A';
                if (['1A', '1B', '2A', '2B', '3A', '3B'].includes(turmaRaw)) objTurma = turmaRaw as SchoolClass;

                let objSexo: BiologicalSex = sexoRaw === 'F' ? 'F' : 'M';
                let objRes: ResidenceType = resRaw.toUpperCase() === 'RURAL' ? 'RURAL' : 'URBAN';

                await authService.registerAdmin(
                    email,
                    senha,
                    UserRole.STUDENT,
                    nome,
                    { schoolClass: objTurma, biologicalSex: objSexo, residenceType: objRes, birthDate: nascRaw }
                );
                successCount++;
            } catch (e: any) {
                errorLog.push(`Falha em ${email}: ${e.message}`);
            }
        }

        setResults({ success: successCount, errors: errorLog });
        setIsProcessing(false);
        if (successCount > 0) {
            onSuccess(); // Para atualizar a lista de estudantes na dashboard
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[400] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl p-10 relative">
                <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-colors">
                    <X size={24} />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <Upload size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Importação em Lote</h2>
                        <p className="text-slate-500 font-medium text-sm">Cadastre várias contas estudantis via CSV.</p>
                    </div>
                </div>

                {!results ? (
                    <>
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-6">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Formato Esperado (CSV)</p>
                            <pre className="text-[10px] text-emerald-800 bg-emerald-50 p-4 rounded-2xl font-mono overflow-x-auto">
                                Nome,Email,Senha,Turma,Sexo(M/F),Residencia(URBAN/RURAL),Nascimento(YYYY-MM-DD)
                                João Silva,joao@escola.com,senha123,1A,M,URBAN,2010-05-12
                                Maria Oliveira,maria@escola.com,senha123,3B,F,RURAL,2008-11-20
                            </pre>
                        </div>

                        <textarea
                            value={csvData}
                            onChange={(e) => setCsvData(e.target.value)}
                            placeholder="Cole os dados do Excel/CSV aqui..."
                            className="w-full h-48 bg-slate-50 border border-slate-200 rounded-3xl p-6 font-mono text-xs focus:ring-4 focus:ring-emerald-500/20 outline-none mb-6 resize-none custom-scrollbar"
                        ></textarea>

                        <button
                            onClick={handleImport}
                            disabled={isProcessing || !csvData}
                            className="w-full py-5 bg-emerald-600 text-white font-black uppercase text-sm tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {isProcessing ? 'Processando (pode levar alguns segundos)...' : 'Iniciar Cadastro em Lote'}
                        </button>
                    </>
                ) : (
                    <div className="text-center space-y-6">
                        <div className="w-24 h-24 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                            <CheckCircle size={48} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-slate-800">{results.success} Alunos</h3>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Cadastrados com Sucesso</p>
                        </div>

                        {results.errors.length > 0 && (
                            <div className="bg-red-50 text-left p-6 rounded-3xl border border-red-100 mt-6 max-h-48 overflow-y-auto custom-scrollbar">
                                <div className="flex items-center gap-2 text-red-600 font-black text-xs uppercase tracking-widest mb-4">
                                    <AlertTriangle size={16} /> Falhas Encontradas ({results.errors.length})
                                </div>
                                <ul className="space-y-2 text-xs font-medium text-red-900 list-disc pl-4">
                                    {results.errors.map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            className="w-full mt-8 py-5 bg-slate-100 text-slate-700 font-black uppercase text-sm tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
                        >
                            Fechar e Ver Alunos
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
