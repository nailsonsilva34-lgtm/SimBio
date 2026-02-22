import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Student, CLASS_LABELS, BIMESTERS, Bimester, ClassContent, ResidenceType, RESIDENCE_LABELS, FileAttachment, BIMESTER_DATES, Reminder, Notification, BIOLOGICAL_LEVELS, ClassSettings, ForumPost, ForumSettings, UserRole } from '../../types';
import { getClassContent, getNotifications, markNotificationAsRead, markAllNotificationsAsRead, getCurrentBimester, updateStudent, getClassSettings, getForumPosts, saveForumPost, getForumSettings, getStudentRanksForClass, deleteForumPost, getTeachers } from '../../services/dataService';
import { FileText, Beaker, BookOpen, Bell, Settings, X, Save, Lock, User, Mail, Users, Download, Music, ImageIcon, Paperclip, Calendar, LayoutGrid, Check, Info, FileCheck, TrendingUp, ChevronRight, FileIcon, Camera, MessageCircle, Send, Trash2, Printer } from 'lucide-react';
import { GradeBulletin } from '../UI/GradeBulletin';
import { CalendarView } from './CalendarView';
import { BiologicalLevelIcon, getAvatarStyles, getInitials, getRankColor } from '../UI/AvatarUtils';

interface StudentDashboardProps {
    student: Student;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ student: initialStudent }) => {
    const [student, setStudent] = useState<Student>(initialStudent);
    // Inicializa com o bimestre atual
    const [activeBimester, setActiveBimester] = useState<Bimester>(getCurrentBimester());
    const [viewMode, setViewMode] = useState<'PANEL' | 'CALENDAR' | 'FORUM'>('PANEL');
    const [classContent, setClassContent] = useState<ClassContent | null>(null);
    const [classSettings, setClassSettings] = useState<ClassSettings>({ showAverage: false });

    // Forum State
    const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
    const [forumSettings, setForumSettings] = useState<ForumSettings>({ isEnabled: false });
    const [newForumPost, setNewForumPost] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    // Profile Edit State
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editAvatar, setEditAvatar] = useState('');

    useEffect(() => {
        const content = getClassContent(student.schoolClass, activeBimester);
        setClassContent(content);
        setClassSettings(getClassSettings(student.schoolClass, activeBimester));
        setForumPosts(getForumPosts(student.schoolClass, activeBimester));
        setForumSettings(getForumSettings(student.schoolClass, activeBimester));

        const loadNotifs = () => {
            const filtered = getNotifications().filter(n => (n.targetType === 'STUDENT' && n.targetId === student.id) || (n.targetType === 'CLASS' && n.targetId === student.schoolClass));
            setNotifications(filtered);
        };
        loadNotifs();
        const interval = setInterval(loadNotifs, 5000);
        return () => clearInterval(interval);
    }, [student.schoolClass, activeBimester, student.id]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadCount = useMemo(() => notifications.filter(n => !n.readBy.includes(student.id)).length, [notifications, student.id]);

    const classRanks = useMemo(() => {
        return getStudentRanksForClass(student.schoolClass, activeBimester);
    }, [student.schoolClass, activeBimester]);

    const openProfile = () => {
        setEditName(student.name);
        setEditEmail(student.email);
        setEditPassword('');
        setEditAvatar(student.avatarUrl || '');
        setIsProfileOpen(true);
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) setEditAvatar(ev.target.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleMarkAllAsRead = () => {
        markAllNotificationsAsRead(student.id);
        const filtered = getNotifications().filter(n => (n.targetType === 'STUDENT' && n.targetId === student.id) || (n.targetType === 'CLASS' && n.targetId === student.schoolClass));
        setNotifications(filtered);
    };

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const updates: any = { name: editName, email: editEmail, avatarUrl: editAvatar };
            if (editPassword.trim()) updates.password = editPassword;

            const updatedStudent = updateStudent(student.id, updates);
            setStudent(updatedStudent);
            setIsProfileOpen(false);
            alert('Dados atualizados com sucesso!');
        } catch (error) {
            alert('Erro ao atualizar perfil.');
        }
    };

    const handleAddForumPost = () => {
        const currentSettings = getForumSettings(student.schoolClass, activeBimester);
        if (!newForumPost.trim() || !currentSettings.isEnabled) return;

        const post: ForumPost = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
            authorId: student.id,
            authorName: student.name,
            authorRole: student.isMonitor ? UserRole.MONITOR : UserRole.STUDENT,
            authorLevel: student.biologicalLevel,
            content: newForumPost,
            timestamp: new Date().toISOString(),
            bimester: activeBimester,
            schoolClass: student.schoolClass
        };

        saveForumPost(post);
        setForumPosts(getForumPosts(student.schoolClass, activeBimester));
        setNewForumPost('');
    };
    const handleDeleteForumPost = (postId: string) => {
        setConfirmDeleteId(postId);
    };

    const confirmDelete = () => {
        if (!confirmDeleteId) return;
        deleteForumPost(confirmDeleteId);
        setForumPosts(getForumPosts(student.schoolClass, activeBimester));
        setConfirmDeleteId(null);
    };

    const teacher = getTeachers()[0] || { name: 'Professor de Biologia' } as any;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6 pb-20 px-2 md:px-0">
            {/* Banner Principal */}
            <div className="bg-gradient-to-br from-emerald-800 to-teal-700 rounded-[2.5rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col gap-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="bg-white/20 text-white px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]">{CLASS_LABELS[student.schoolClass]}</span>
                                <div className="flex bg-black/20 p-1 rounded-2xl">
                                    <button onClick={() => setViewMode('PANEL')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'PANEL' ? 'bg-white text-emerald-800 shadow-xl' : 'text-white/60'}`}><LayoutGrid size={18} /></button>
                                    <button onClick={() => setViewMode('CALENDAR')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'CALENDAR' ? 'bg-white text-emerald-800 shadow-xl' : 'text-white/60'}`}><Calendar size={18} /></button>
                                    <button onClick={() => setViewMode('FORUM')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'FORUM' ? 'bg-white text-emerald-800 shadow-xl' : 'text-white/60'}`}><MessageCircle size={18} /></button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className={`w-16 h-16 flex items-center justify-center text-white shadow-lg border-4 border-white/30 ${getAvatarStyles(student.schoolClass)}`}>
                                        <span className="font-black text-2xl">{getInitials(student.name)}</span>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-md border border-slate-100" title={BIOLOGICAL_LEVELS[student.biologicalLevel || 'ORGANELLE'].label}>
                                        <BiologicalLevelIcon level={student.biologicalLevel || 'ORGANELLE'} size={18} className={getRankColor(classRanks[student.id] ?? 999)} />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter">Olá, {student.name.split(' ')[0]}!</h1>
                                    <span className="text-white/80 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                        <BiologicalLevelIcon level={student.biologicalLevel || 'ORGANELLE'} size={12} className={getRankColor(classRanks[student.id] ?? 999)} />
                                        {BIOLOGICAL_LEVELS[student.biologicalLevel || 'ORGANELLE'].label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 ml-auto">
                                    <button onClick={openProfile} className="p-3 rounded-2xl bg-white/10 hover:bg-white text-white hover:text-emerald-800 transition-all border border-white/20 shadow-lg" title="Meus Dados">
                                        <Settings size={28} />
                                    </button>
                                    <div className="relative">
                                        <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className={`p-3 rounded-2xl transition-all border border-white/20 relative shadow-lg ${isNotificationsOpen ? 'bg-white text-emerald-800' : 'bg-white/10'}`}>
                                            <Bell size={28} />
                                            {unreadCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-emerald-800 animate-bounce">{unreadCount}</span>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Bimestres Grid Mobile */}
                        <div className="grid grid-cols-4 gap-1.5 bg-white/10 backdrop-blur-xl p-1.5 rounded-[1.8rem] w-full md:w-auto border border-white/10 overflow-x-auto">
                            {BIMESTERS.map(b => (
                                <button key={b} onClick={() => setActiveBimester(b)} className={`px-4 py-3 rounded-2xl text-[10px] font-black transition-all text-center whitespace-nowrap ${activeBimester === b ? 'bg-white text-emerald-800 shadow-xl' : 'text-emerald-50 hover:bg-white/10'}`}>
                                    {b.split('º')[0]}B
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* iOS-style Notification Popup */}
            {isNotificationsOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/20 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsNotificationsOpen(false)}>
                    <div className="w-full max-w-sm bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/40 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col max-h-[70vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm">{unreadCount}</div>
                                <span className="font-black text-sm text-slate-800 uppercase tracking-widest">Notificações</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button onClick={handleMarkAllAsRead} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-colors shadow-sm border border-emerald-100/50">Lidas</button>
                                )}
                                <button onClick={() => setIsNotificationsOpen(false)} className="p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors"><X size={16} className="text-slate-600" /></button>
                            </div>
                        </div>
                        <div className="overflow-y-auto p-4 space-y-3">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center gap-4 opacity-50">
                                    <Bell size={48} className="text-slate-400" />
                                    <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Nenhuma notificação nova</span>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div key={n.id} onClick={() => { markNotificationAsRead(student.id, n.id); setIsNotificationsOpen(false); }} className="p-4 bg-white/60 hover:bg-white transition-all rounded-[1.5rem] shadow-sm border border-white/50 cursor-pointer flex gap-4 active:scale-95 duration-150">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm"><Bell size={18} /></div>
                                        <div className="flex-1">
                                            <p className="text-[12px] font-bold text-slate-800 leading-snug">{n.message}</p>
                                            <span className="text-[9px] font-black text-slate-400 mt-1.5 block uppercase tracking-wide">{new Date(n.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {!n.readBy.includes(student.id) && <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>}
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 bg-white/50 border-t border-black/5 text-center">
                            <button onClick={() => setIsNotificationsOpen(false)} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Fechar Central</button>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'PANEL' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                    <div className="lg:col-span-8 space-y-6 md:space-y-8">
                        <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between gap-4 mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600"><FileText /></div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Meus Resultados</h2>
                                </div>
                                <button
                                    onClick={handlePrint}
                                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2 shadow-sm border border-slate-200"
                                >
                                    <Printer size={16} /> Exportar Boletim
                                </button>
                            </div>
                            <div className="grid gap-4">
                                {(student.bimesterGrades[activeBimester] || []).map(a => (
                                    <div key={a.id} className="bg-slate-50 p-6 rounded-[2rem] flex justify-between items-center hover:bg-emerald-50 transition-all">
                                        <div className="flex flex-col">
                                            <h3 className="font-black text-slate-800 text-lg">{a.title}</h3>
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{a.description || 'Atividade acadêmica'}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className={`text-3xl font-black ${a?.score !== null && a?.score < 6 ? 'text-red-500' : 'text-emerald-600'}`}>{a?.score ?? '-'}</div>
                                            {a?.recoveryScore !== null && (
                                                <div className="flex items-center gap-1 mt-1 bg-white px-2 py-1 rounded-lg shadow-sm border border-slate-100">
                                                    <span className="text-[8px] font-black uppercase text-slate-400">Recuperação</span>
                                                    <span className={`text-xs font-black ${a?.recoveryScore < 6 ? 'text-red-500' : 'text-emerald-600'}`}>{a?.recoveryScore}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div className="bg-slate-900 p-6 rounded-[2rem] flex justify-between items-center shadow-lg mt-4">
                                    <h3 className="font-black text-white text-lg uppercase tracking-widest">Média Bimestral</h3>
                                    <div className="text-4xl font-black">
                                        {(() => {
                                            if (!classSettings.showAverage) return <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Aguardando</span>;

                                            const grades = student.bimesterGrades[activeBimester] || [];
                                            const validGrades = grades.filter(g => g.score !== null);
                                            if (validGrades.length < 3) return <span className="text-slate-600">-</span>;

                                            const sum = validGrades.reduce((acc, curr) => {
                                                const scoreToUse = (curr.recoveryScore !== null && curr.recoveryScore > (curr.score || 0)) ? curr.recoveryScore : (curr.score || 0);
                                                return acc + scoreToUse;
                                            }, 0);

                                            const average = (sum / 3).toFixed(1);
                                            const avgNum = parseFloat(average);

                                            return (
                                                <span className={avgNum >= 6 ? 'text-emerald-400' : 'text-red-400'}>
                                                    {average}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </section>
                        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600"><BookOpen /></div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Planejamento</h2>
                            </div>
                            <div className="bg-indigo-50/50 p-8 rounded-[2rem] min-h-[120px] shadow-inner">
                                <p className="text-sm font-bold text-indigo-900 leading-relaxed whitespace-pre-wrap">{classContent?.textContent || 'Nenhum planejamento disponível para este bimestre.'}</p>
                                {classContent?.textContent && classContent?.lastEditedBy && (
                                    <p className="text-[10px] text-indigo-800 font-bold mt-4 text-right opacity-60">Atualizado por: {classContent.lastEditedBy}</p>
                                )}
                            </div>
                        </section>
                    </div>
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <h3 className="font-black text-slate-800 text-xs mb-6 uppercase tracking-widest"><Paperclip size={20} className="text-emerald-500 mr-2 inline" /> Materiais</h3>
                            <div className="space-y-3">
                                {classContent?.files.map(f => (
                                    <a
                                        key={f.id}
                                        href={f.url}
                                        download={f.name}
                                        className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-emerald-50 transition-all cursor-pointer shadow-sm group"
                                    >
                                        <div>
                                            <span className="text-xs font-black text-slate-700 truncate max-w-[150px] group-hover:text-emerald-700 block">{f.name}</span>
                                            {f.createdBy && <span className="text-[8px] text-slate-400 block mt-0.5">por {f.createdBy}</span>}
                                        </div>
                                        <Download size={18} className="text-emerald-600" />
                                    </a>
                                ))}
                                {(!classContent?.files || classContent.files.length === 0) && <p className="text-center py-6 text-slate-300 font-bold text-[10px] uppercase">Vazio</p>}
                            </div>
                        </div>
                        <div className="bg-amber-50 rounded-[2.5rem] p-8 border border-amber-100 shadow-sm">
                            <h3 className="font-black text-amber-900 text-xs mb-6 uppercase tracking-widest"><Bell size={20} className="text-amber-500 mr-2 inline" /> Mural</h3>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {[...(student.personalReminders || []), ...(classContent?.reminders || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((rem, i) => (
                                    <div key={i} onClick={() => setSelectedReminder(rem)} className="p-5 bg-white rounded-3xl border-2 border-amber-100 shadow-sm cursor-pointer hover:scale-[1.02] transition-transform">
                                        <p className="text-[13px] font-bold text-amber-900 leading-tight line-clamp-2">{rem.text}</p>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-[8px] font-black uppercase text-amber-400 block">Ver detalhes →</span>
                                            {rem.createdBy && <span className="text-[8px] text-amber-300 font-bold">por {rem.createdBy}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : viewMode === 'FORUM' ? (
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-600"><MessageCircle size={24} /></div>
                            <div>
                                <h3 className="font-black text-slate-800 text-lg">Fórum da Turma</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{CLASS_LABELS[student.schoolClass]} • {activeBimester}</p>
                            </div>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${forumSettings.isEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                            {forumSettings.isEnabled ? 'Aberto' : 'Fechado'}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                        {forumPosts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                <MessageCircle size={48} className="mb-4 opacity-20" />
                                <p className="text-sm font-bold uppercase tracking-widest">Nenhuma mensagem ainda</p>
                            </div>
                        ) : (
                            forumPosts.map(post => (
                                <div key={post.id} className={`flex gap-4 ${post.authorId === student.id ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md shrink-0 ${post.authorRole === 'TEACHER' ? 'bg-emerald-500' :
                                        post.authorRole === 'MONITOR' ? 'bg-amber-500' : 'bg-blue-500'
                                        }`}>
                                        {getInitials(post.authorName)}
                                    </div>
                                    <div className={`max-w-[70%] space-y-1 ${post.authorId === student.id ? 'items-end flex flex-col' : ''}`}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{post.authorName}</span>
                                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${post.authorRole === 'TEACHER' ? 'bg-emerald-100 text-emerald-600' :
                                                post.authorRole === 'MONITOR' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                {post.authorRole === 'TEACHER' ? 'Professor' : post.authorRole === 'MONITOR' ? 'Monitor' : 'Estudante'}
                                            </span>
                                            {post.authorLevel && (
                                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-500 flex items-center gap-1">
                                                    <BiologicalLevelIcon level={post.authorLevel} size={10} className={getRankColor(classRanks[post.authorId] ?? 999)} />
                                                    {BIOLOGICAL_LEVELS[post.authorLevel].label}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-slate-300 font-bold">{new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className={`p-4 rounded-2xl text-sm font-medium shadow-sm ${post.authorRole === 'TEACHER' ? 'bg-emerald-50 text-emerald-900 rounded-tr-none' :
                                            post.authorRole === 'MONITOR' ? 'bg-amber-50 text-amber-900 rounded-tl-none' : 'bg-white text-slate-700 rounded-tl-none'
                                            }`}>
                                            {post.content}
                                        </div>
                                        {post.authorId === student.id && (
                                            <button
                                                onClick={() => handleDeleteForumPost(post.id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                title="Apagar mensagem"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 bg-white border-t border-slate-100">
                        {forumSettings.isEnabled ? (
                            <div className="flex gap-2">
                                <input
                                    value={newForumPost}
                                    onChange={(e) => setNewForumPost(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddForumPost()}
                                    placeholder="Participe do debate..."
                                    className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 transition-all font-medium text-sm"
                                />
                                <button
                                    onClick={handleAddForumPost}
                                    disabled={!newForumPost.trim()}
                                    className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 rounded-2xl text-center text-slate-400 font-bold text-xs uppercase tracking-widest border border-slate-100">
                                O fórum está fechado para novas mensagens
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="h-[650px] bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100">
                    <CalendarView reminders={classContent?.reminders || []} personalReminders={student.personalReminders || []} />
                </div>
            )}

            {selectedReminder && (
                <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-8 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-200 text-amber-700 rounded-2xl"><Bell size={24} /></div>
                                <h4 className="font-black text-slate-800 text-lg">Aviso Completo</h4>
                            </div>
                            <button onClick={() => setSelectedReminder(null)} className="p-2 hover:bg-white/50 rounded-full transition-colors"><X /></button>
                        </div>
                        <div className="p-10">
                            <p className="text-lg text-slate-700 font-bold leading-relaxed whitespace-pre-wrap">{selectedReminder.text}</p>
                            <div className="mt-6 flex flex-col gap-1">
                                {selectedReminder.date && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Para o dia: {new Date(selectedReminder.date + 'T12:00:00').toLocaleDateString()}</p>}
                                {selectedReminder.createdBy && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enviado por: {selectedReminder.createdBy}</p>}
                            </div>
                        </div>
                        <div className="p-6 text-center bg-slate-50">
                            <button onClick={() => setSelectedReminder(null)} className="w-full py-4 bg-slate-800 text-white font-black text-xs rounded-3xl uppercase tracking-widest hover:bg-slate-700 transition-all">Fechar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Editar Perfil (Meus Dados) */}
            {isProfileOpen && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[600] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-600"><Settings size={24} /></div>
                                <h3 className="font-black text-slate-800 text-lg">Meus Dados</h3>
                            </div>
                            <button onClick={() => setIsProfileOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X /></button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="p-8 space-y-5">

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Nome Completo</label>
                                    <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Email</label>
                                    <input value={editEmail} onChange={e => setEditEmail(e.target.value)} type="email" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Nova Senha (Opcional)</label>
                                    <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Deixe em branco para manter a atual" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" />
                                </div>

                                {/* Campos de Leitura (Não editáveis pelo aluno) */}
                                <div className="grid grid-cols-2 gap-4 opacity-60">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Turma</label>
                                        <div className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500">
                                            {CLASS_LABELS[student.schoolClass]}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Residência</label>
                                        <div className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500">
                                            {RESIDENCE_LABELS[student.residenceType]}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-5 bg-emerald-600 text-white font-black rounded-3xl shadow-xl hover:bg-emerald-700 transition-all mt-4"><Save size={20} /> Salvar Alterações</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação de Exclusão */}
            {confirmDeleteId && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[700] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 text-center space-y-4">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">Apagar sua mensagem?</h3>
                            <p className="text-sm font-medium text-slate-500">Esta ação não pode ser desfeita. Sua mensagem será removida permanentemente do fórum.</p>
                        </div>
                        <div className="p-6 bg-slate-50 flex gap-3">
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 py-4 bg-white text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-4 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
                            >
                                Apagar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Printable Grade Bulletin */}
            <GradeBulletin student={student} teacher={teacher} activeBimester={activeBimester} />

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #grade-bulletin-print, #grade-bulletin-print * {
                        visibility: visible;
                    }
                    #grade-bulletin-print {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    @page {
                        margin: 2cm;
                        size: A4;
                    }
                }
            `}} />
        </div>
    );
};
