
import React from 'react';
import { Student, Teacher, Activity, Bimester, SchoolClass, CLASS_LABELS } from '../../types';
import { Dna, FileCheck } from 'lucide-react';

interface GradeBulletinProps {
    student: Student;
    teacher: Teacher;
    activeBimester: Bimester;
    allBimesters?: boolean;
}

export const GradeBulletin: React.FC<GradeBulletinProps> = ({
    student,
    teacher,
    activeBimester,
    allBimesters = true
}) => {
    const bimesters: Bimester[] = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

    const calculateAverage = (grades: Activity[]) => {
        const validGrades = grades.filter(g => g.score !== null);
        if (validGrades.length < 3) return '-';

        const sum = validGrades.reduce((acc, curr) => {
            const scoreToUse = (curr.recoveryScore !== null && curr.recoveryScore > (curr.score || 0)) ? curr.recoveryScore : (curr.score || 0);
            return acc + scoreToUse;
        }, 0);

        return (sum / 3).toFixed(1);
    };

    return (
        <div id="grade-bulletin-print" className="bg-white p-10 text-slate-800 font-sans hidden print:block">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-emerald-500 pb-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl border border-emerald-100">
                        <Dna size={36} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-emerald-600 italic tracking-tighter">SímBio</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Portal Acadêmico de Biologia</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Boletim Escolar</h2>
                    <p className="text-xs font-bold text-slate-500">Ano Letivo: 2026</p>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-8 mb-10 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="space-y-3">
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Estudante</span>
                        <p className="text-sm font-black text-slate-800 uppercase">{student.name}</p>
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Série / Turma</span>
                        <p className="text-sm font-bold text-slate-800">{CLASS_LABELS[student.schoolClass]}</p>
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">E-mail de Acesso</span>
                        <p className="text-sm font-medium text-slate-600">{student.email}</p>
                    </div>
                </div>
                <div className="space-y-3">
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Disciplina</span>
                        <p className="text-sm font-black text-emerald-700 uppercase">Biologia</p>
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Professor Responsável</span>
                        <p className="text-sm font-bold text-slate-800">{teacher.name}</p>
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Data de Emissão</span>
                        <p className="text-sm font-medium text-slate-600">{new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
            </div>

            {/* Grades Table */}
            <div className="space-y-8">
                {(allBimesters ? bimesters : [activeBimester]).map(bim => {
                    const grades = student.bimesterGrades[bim] || [];
                    const average = calculateAverage(grades);

                    return (
                        <div key={bim} className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                            <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                                <h3 className="font-black text-xs uppercase tracking-[0.2em]">{bim}</h3>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-bold uppercase opacity-60 tracking-wider">Média Final</span>
                                    <span className={`text-lg font-black ${parseFloat(average) < 6 ? 'text-red-400' : 'text-emerald-400'}`}>{average}</span>
                                </div>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="p-4 pl-6">Avaliação</th>
                                        <th className="p-4 text-center">Nota Original</th>
                                        <th className="p-4 text-center">Recuperação</th>
                                        <th className="p-4 pr-6 text-right">Nota Final</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 italic font-medium text-slate-700">
                                    {grades.map(g => (
                                        <tr key={g.id}>
                                            <td className="p-4 pl-6 text-xs font-bold text-slate-800">{g.title}</td>
                                            <td className="p-4 text-center text-xs">{g.score ?? '-'}</td>
                                            <td className="p-4 text-center text-xs">{g.recoveryScore ?? '-'}</td>
                                            <td className="p-4 pr-6 text-right text-xs font-black">
                                                {Math.max(g.score || 0, g.recoveryScore || 0) || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>

            {/* Footer / Auth */}
            <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-end">
                <div className="max-w-xs">
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-wider">
                        Este documento é gerado automaticamente pelo sistema SímBio e serve como comprovante oficial de desempenho acadêmico na disciplina de Biologia.
                    </p>
                </div>
                <div className="text-right">
                    <div className="w-48 border-b border-black mb-2 opacity-50 ml-auto"></div>
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Assinatura do Responsável</p>
                </div>
            </div>
        </div>
    );
};

export const ClassAveragesExport: React.FC<{
    students: Student[],
    schoolClass: SchoolClass,
    activeBimester: Bimester
}> = ({ students, schoolClass, activeBimester }) => {

    const BIMESTERS: Bimester[] = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

    const calculateAverage = (grades: Activity[]) => {
        const validGrades = grades.filter(g => g.score !== null);
        if (validGrades.length < 3) return '-';
        const sum = validGrades.reduce((acc, curr) => {
            const scoreToUse = (curr.recoveryScore !== null && curr.recoveryScore > (curr.score || 0)) ? curr.recoveryScore : (curr.score || 0);
            return acc + scoreToUse;
        }, 0);
        return (sum / 3).toFixed(1);
    };

    return (
        <div id="class-averages-print" className="bg-white p-10 text-slate-800 font-sans hidden print:block">
            <div className="flex justify-between items-center border-b-2 border-emerald-500 pb-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl border border-emerald-100">
                        <Dna size={36} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-emerald-600 italic tracking-tighter">SímBio</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Portal Acadêmico de Biologia</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Relatório de Médias Anuais</h2>
                    <p className="text-xs font-bold text-slate-500">Ano Letivo de 2026</p>
                </div>
            </div>

            <div className="mb-8 flex gap-8">
                <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 flex-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Turma</span>
                    <p className="text-lg font-black text-slate-800">{CLASS_LABELS[schoolClass]}</p>
                </div>
                <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 flex-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Disciplina</span>
                    <p className="text-lg font-black text-emerald-700 uppercase">Biologia</p>
                </div>
            </div>

            <table className="w-full border-collapse">
                <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100">
                    <tr>
                        <th className="p-4 text-left pl-6">Nome do Estudante</th>
                        {BIMESTERS.map(b => (
                            <th key={b} className="p-4">{b.split(' ')[0]} Bim</th>
                        ))}
                        <th className="p-4">Média Geral</th>
                        <th className="p-4 pr-6">Situação Funcional</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {students.map(s => {
                        const bimesterAvgs = BIMESTERS.map(b => calculateAverage(s.bimesterGrades[b] || []));
                        const validAvgs = bimesterAvgs.map(a => a !== '-' ? parseFloat(a) : null).filter(a => a !== null) as number[];

                        let annualAvg = '-';
                        if (validAvgs.length > 0) {
                            annualAvg = (validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length).toFixed(1);
                        }

                        const isPassing = annualAvg !== '-' && parseFloat(annualAvg) >= 6;
                        const isComplete = validAvgs.length === 4;

                        return (
                            <tr key={s.id}>
                                <td className="p-4 pl-6 text-xs font-black text-slate-800 uppercase max-w-[200px] truncate" title={s.name}>{s.name}</td>
                                {bimesterAvgs.map((avg, i) => (
                                    <td key={i} className={`p-4 text-center text-xs font-bold ${avg !== '-' ? (parseFloat(avg) >= 6 ? 'text-emerald-600' : 'text-red-500') : 'text-slate-300'}`}>
                                        {avg}
                                    </td>
                                ))}
                                <td className={`p-4 text-center text-sm font-black ${annualAvg !== '-' ? (isPassing ? 'text-emerald-600' : 'text-red-600') : 'text-slate-400'}`}>
                                    {annualAvg}
                                </td>
                                <td className="p-4 pr-6 text-center">
                                    {!isComplete ? (
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Em Curso</span>
                                    ) : (
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${isPassing ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {isPassing ? 'Aprovado' : 'Reprovado'}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="mt-12 text-center opacity-50">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Gerado em {new Date().toLocaleDateString('pt-BR')} via SímBio Portal</p>
            </div>
        </div>
    );
};
