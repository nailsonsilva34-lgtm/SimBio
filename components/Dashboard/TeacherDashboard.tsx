
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Student, CLASS_LABELS, SchoolClass, ResidenceType, RESIDENCE_LABELS, BIMESTERS, Bimester, Activity, ClassContent, FileAttachment, BIMESTER_DATES, Reminder, UserRole, User, MonitorPermissions, ClassActivityConfig, ClassSettings, ForumPost, ForumSettings, BiologicalSex } from '../../types';
import { getStudents, updateStudent, updateActivityGrade, getClassContent, saveClassContent, registerStudent, addPersonalReminder, removePersonalReminder, addPersonalMaterial, removePersonalMaterial, getMonitorPermissions, saveMonitorPermissions, getCurrentBimester, getClassActivityConfigs, saveClassActivityConfigs, bulkUpdateGrades, getClassSettings, saveClassSettings, getForumPosts, saveForumPost, deleteForumPost, getForumSettings, saveForumSettings, getStudentRanksForClass, deleteStudent } from '../../services/dataService';
import { authService } from '../../services/authService';
import { Search, BookOpen, Users, Pencil, X, Save, Calendar, FileText, Upload, Paperclip, Trash2, Bell, FileIcon, Plus, Lock, UserPlus, GraduationCap, CheckSquare, Square, LayoutGrid, BarChart3, TrendingUp, ShieldCheck, ToggleLeft, ToggleRight, Edit3, Settings, AlertCircle, ChevronDown, ListChecks, Eye, EyeOff, MessageCircle, Send } from 'lucide-react';
import { GradeModal } from './GradeModal';
import { CalendarView } from './CalendarView';
import { StatisticsView } from './StatisticsView';
import { BiologicalLevelIcon, getAvatarStyles, getInitials, getClassColor, getRankColor } from '../UI/AvatarUtils';
import { BIOLOGICAL_LEVELS, BIOLOGICAL_LEVEL_ORDER } from '../../types';
import { GradeBulletin, ClassAveragesExport } from '../UI/GradeBulletin';
import { GradeBulletin, ClassAveragesExport } from '../UI/GradeBulletin';
import { Printer } from 'lucide-react';

interface TeacherDashboardProps {
    user: User;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [viewMode, setViewMode] = useState<'GRADES' | 'CALENDAR' | 'STATS' | 'MONITORS' | 'ACTIVITY_CONFIG' | 'FORUM'>('GRADES');

    const [activeBimester, setActiveBimester] = useState<Bimester>(getCurrentBimester());
    const [selectedClassFilter, setSelectedClassFilter] = useState<SchoolClass | 'ALL'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [editingGrade, setEditingGrade] = useState<{ student: Student, activity: Activity } | null>(null);
    const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
    const [isNewStudentOpen, setIsNewStudentOpen] = useState(false);
    const [currentClassContent, setCurrentClassContent] = useState<ClassContent | null>(null);
    const [monitorPerms, setMonitorPerms] = useState<MonitorPermissions>(getMonitorPermissions());

    // Batch Grade Edit State
    const [isBatchEditMode, setIsBatchEditMode] = useState(false);
    const [pendingGrades, setPendingGrades] = useState<Record<string, Record<number, string>>>({}); // studentId -> activityIndex -> value

    // Activity Config State
    const [activityConfigs, setActivityConfigs] = useState<ClassActivityConfig[]>([]);
    const [classSettings, setClassSettings] = useState<ClassSettings>({ showAverage: false });

    // Forum State
    const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
    const [forumSettings, setForumSettings] = useState<ForumSettings>({ isEnabled: false });
    const [newForumPost, setNewForumPost] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    // Student Form State
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editClass, setEditClass] = useState<SchoolClass>('1A');
    const [editBirthDate, setEditBirthDate] = useState('');
    const [editBiologicalSex, setEditBiologicalSex] = useState<BiologicalSex>('M');
    const [editResidence, setEditResidence] = useState<ResidenceType>('URBAN');
    const [editPassword, setEditPassword] = useState('');
    const [editIsMonitor, setEditIsMonitor] = useState(false);
    const [isConfirmDeleteContentOpen, setIsConfirmDeleteContentOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

    const [contentNotes, setContentNotes] = useState('');
    const [newReminder, setNewReminder] = useState('');
    const [reminderDate, setReminderDate] = useState('');
    const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
    const [levelSelectorOpen, setLevelSelectorOpen] = useState<string | null>(null);
    const [reminderTarget, setReminderTarget] = useState<'CLASS' | 'SELECTED'>('CLASS');
    const [materialTarget, setMaterialTarget] = useState<'CLASS' | 'SELECTED'>('CLASS');

    const reminderInputRef = useRef<HTMLInputElement>(null);
    const muralSectionRef = useRef<HTMLDivElement>(null);

    const isFullTeacher = user.role === UserRole.TEACHER;
    const currentPerms = isFullTeacher ? { canEditGrades: true, canManageContent: true, canManageMaterials: true, canManageMural: true } : user.permissions!;

    useEffect(() => { refreshData(); }, []);

    useEffect(() => {
        setSelectedIds(new Set());
        if (selectedClassFilter !== 'ALL') {
            const content = getClassContent(selectedClassFilter, activeBimester);
            setCurrentClassContent(content);
            setContentNotes('');
            // Load Activity Configs
            setActivityConfigs(getClassActivityConfigs(selectedClassFilter, activeBimester));
            // Load Class Settings
            setClassSettings(getClassSettings(selectedClassFilter, activeBimester));
            // Load Forum Data
            setForumPosts(getForumPosts(selectedClassFilter, activeBimester));
            setForumSettings(getForumSettings(selectedClassFilter, activeBimester));
        } else {
            setCurrentClassContent(null);
            setActivityConfigs([]);
            setClassSettings({ showAverage: false });
            setForumPosts([]);
            setForumSettings({ isEnabled: false });
        }
    }, [selectedClassFilter, activeBimester]);

    const toggleForumStatus = () => {
        if (selectedClassFilter === 'ALL') return;
        const newSettings = { isEnabled: !forumSettings.isEnabled };
        setForumSettings(newSettings);
        saveForumSettings(selectedClassFilter, activeBimester, newSettings);
    };

    const handleAddForumPost = () => {
        if (!newForumPost.trim() || selectedClassFilter === 'ALL') return;
        const currentSettings = getForumSettings(selectedClassFilter, activeBimester);
        if (!currentSettings.isEnabled && !isFullTeacher) return;

        const post: ForumPost = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
            authorId: user.id,
            authorName: user.name,
            authorRole: user.role,
            content: newForumPost,
            timestamp: new Date().toISOString(),
            bimester: activeBimester,
            schoolClass: selectedClassFilter
        };

        saveForumPost(post);
        setForumPosts(getForumPosts(selectedClassFilter, activeBimester));
        setNewForumPost('');
    };
    const handleDeleteForumPost = (postId: string) => {
        setConfirmDeleteId(postId);
    };

    const confirmDelete = () => {
        if (!confirmDeleteId) return;
        deleteForumPost(confirmDeleteId);
        setForumPosts(getForumPosts(selectedClassFilter as SchoolClass, activeBimester));
        setConfirmDeleteId(null);
    };

    const toggleShowAverage = () => {
        if (selectedClassFilter === 'ALL') return;
        const newSettings = { ...classSettings, showAverage: !classSettings.showAverage };
        setClassSettings(newSettings);
        saveClassSettings(selectedClassFilter, activeBimester, newSettings);
    };

    const refreshData = () => {
        const data = getStudents();
        setStudents(data);
        if (selectedStudent) {
            const updated = data.find(s => s.id === selectedStudent.id);
            if (updated) setSelectedStudent(updated);
        }
    };

    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const mSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
            const mClass = selectedClassFilter === 'ALL' || s.schoolClass === selectedClassFilter;
            return mSearch && mClass;
        });
    }, [students, searchTerm, selectedClassFilter]);

    const isAllSelected = filteredStudents.length > 0 && selectedIds.size === filteredStudents.length;

    const classRanks = useMemo(() => {
        if (selectedClassFilter === 'ALL') return {};
        return getStudentRanksForClass(selectedClassFilter, activeBimester);
    }, [selectedClassFilter, activeBimester, students]);

    const toggleSelectAll = () => {
        if (isAllSelected) setSelectedIds(new Set());
        else setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    };

    const toggleSelectStudent = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const openEditStudentModal = (student: Student) => {
        setSelectedStudent(student);
        setEditName(student.name); setEditEmail(student.email); setEditClass(student.schoolClass);
        setEditBirthDate(student.birthDate || '');
        setEditBiologicalSex(student.biologicalSex || 'M');
        setEditResidence(student.residenceType || 'URBAN');
        setEditIsMonitor(student.isMonitor); setEditPassword('');
        setIsEditStudentOpen(true);
    }

    const handleUpdateStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent) return;
        try {
            const updates: any = {
                name: editName,
                email: editEmail,
                schoolClass: editClass,
                birthDate: editBirthDate,
                biologicalSex: editBiologicalSex,
                residenceType: editResidence,
                isMonitor: editIsMonitor
            };
            if (editPassword.trim()) updates.password = editPassword;
            updateStudent(selectedStudent.id, updates);
            setIsEditStudentOpen(false);
            refreshData();
            alert('Estudante atualizado!');
        } catch (error) { alert((error as Error).message); }
    }

    const handleCreateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await authService.registerAdmin(editEmail, editPassword, UserRole.STUDENT, editName, {
                schoolClass: editClass,
                birthDate: editBirthDate,
                biologicalSex: editBiologicalSex,
                residenceType: editResidence,
                isMonitor: editIsMonitor
            });
            setIsNewStudentOpen(false);
            refreshData();
            alert('Estudante cadastrado com sucesso!');
        } catch (error) { alert((error as Error).message); }
    }

    const handleDeleteStudent = (student: Student) => {
        setStudentToDelete(student);
    };

    const confirmDeleteStudent = () => {
        if (!studentToDelete) return;
        deleteStudent(studentToDelete.id);
        setStudentToDelete(null);
        refreshData();
        // Remove from selection if it was there
        const next = new Set(selectedIds);
        next.delete(studentToDelete.id);
        setSelectedIds(next);
    };

    const handleUpdateBiologicalLevel = (studentId: string, level: string) => {
        try {
            updateStudent(studentId, { biologicalLevel: level });
            refreshData();
            setLevelSelectorOpen(null);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDayClickInCalendar = (date: string) => {
        if (selectedClassFilter === 'ALL') { alert("Selecione uma turma específica."); return; }
        setReminderDate(date);
        setViewMode('GRADES');
        setTimeout(() => {
            muralSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            reminderInputRef.current?.focus();
        }, 300);
    };

    const handleSaveContent = () => {
        if (!currentClassContent || !currentPerms.canManageContent || !contentNotes.trim()) return;
        const updated = { ...currentClassContent, textContent: contentNotes, lastEditedBy: user.name };
        saveClassContent(updated);
        setCurrentClassContent(updated);
        setContentNotes('');
        alert('Conteúdo postado!');
    };

    const handleEditContent = () => {
        if (!currentClassContent) return;
        setContentNotes(currentClassContent.textContent);
    };

    const handleDeleteContent = () => {
        setIsConfirmDeleteContentOpen(true);
    };

    const confirmDeleteContent = () => {
        if (!currentClassContent || !currentPerms.canManageContent) return;
        const updated = { ...currentClassContent, textContent: '', lastEditedBy: user.name };
        saveClassContent(updated);
        setCurrentClassContent(updated);
        setContentNotes('');
        setIsConfirmDeleteContentOpen(false);
    };

    const handleAddReminder = () => {
        if (!newReminder.trim() || !currentPerms.canManageMural) return;
        if (reminderTarget === 'CLASS') {
            if (!currentClassContent) return;
            const rem: Reminder = {
                id: Math.random().toString(36).substr(2, 9),
                text: newReminder,
                date: reminderDate || undefined,
                createdAt: new Date().toISOString(),
                createdBy: user.name
            };
            const updated = { ...currentClassContent, reminders: [...currentClassContent.reminders, rem] };
            saveClassContent(updated);
            setCurrentClassContent(updated);
        } else {
            if (selectedIds.size === 0) { alert("Selecione estudantes!"); return; }
            selectedIds.forEach(id => addPersonalReminder(id, newReminder, reminderDate || undefined, user.name));
            refreshData();
        }
        setNewReminder(''); setReminderDate('');
    };

    const handleRemoveReminder = (id: string) => {
        if (!currentClassContent || !currentPerms.canManageMural) return;
        const updated = { ...currentClassContent, reminders: currentClassContent.reminders.filter(r => r.id !== id) };
        saveClassContent(updated);
        setCurrentClassContent(updated);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || !currentPerms.canManageMaterials) return;
        const file = e.target.files[0];

        if (file.size > 1024 * 1024) { // 1MB limit for localStorage
            alert("Arquivo muito grande. O limite para esta versão demo é 1MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;

            const newFile: FileAttachment = {
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                type: 'PDF',
                url: base64,
                sentAt: new Date().toISOString(),
                createdBy: user.name
            };

            if (materialTarget === 'CLASS') {
                if (!currentClassContent) return;
                const updated = { ...currentClassContent, files: [...currentClassContent.files, newFile] };
                saveClassContent(updated);
                setCurrentClassContent(updated);
            } else {
                selectedIds.forEach(id => addPersonalMaterial(id, newFile, user.name));
                refreshData();
            }
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveFile = (id: string) => {
        if (!currentClassContent || !currentPerms.canManageMaterials) return;
        const updated = { ...currentClassContent, files: currentClassContent.files.filter(f => f.id !== id) };
        saveClassContent(updated);
        setCurrentClassContent(updated);
    };

    const togglePermission = (key: keyof MonitorPermissions) => {
        const next = { ...monitorPerms, [key]: !monitorPerms[key] };
        setMonitorPerms(next);
        saveMonitorPermissions(next);
    };

    const handleUpdateActivityConfig = (id: number, field: keyof ClassActivityConfig, value: any) => {
        setActivityConfigs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const saveActivityConfiguration = () => {
        if (selectedClassFilter === 'ALL') return;
        try {
            saveClassActivityConfigs(selectedClassFilter, activeBimester, activityConfigs);
            refreshData();
            alert('Atividades configuradas e propagadas para a turma!');
            setViewMode('GRADES');
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar configuração.');
        }
    };

    const handleBatchGradeChange = (studentId: string, activityIndex: number, value: string) => {
        setPendingGrades(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [activityIndex]: value
            }
        }));
    };

    const handleSaveBatchGrades = () => {
        const updates: { studentId: string, bimester: Bimester, activityId: number, score: number | null }[] = [];

        Object.entries(pendingGrades).forEach(([studentId, activities]) => {
            const student = students.find(s => s.id === studentId);
            if (!student) return;

            Object.entries(activities).forEach(([activityIndexStr, value]) => {
                const activityIndex = parseInt(activityIndexStr);
                const activity = student.bimesterGrades[activeBimester][activityIndex];
                if (!activity) return;

                const score = value === '' ? null : parseFloat(value);
                if (score !== null && (isNaN(score) || score < 0 || score > (activity.maxScore || 10))) {
                    // Skip invalid scores or handle error
                    return;
                }

                updates.push({
                    studentId,
                    bimester: activeBimester,
                    activityId: activity.id,
                    score
                });
            });
        });

        if (updates.length > 0) {
            bulkUpdateGrades(updates);
            refreshData();
            alert(`${updates.length} notas atualizadas com sucesso!`);
        }

        setIsBatchEditMode(false);
        setPendingGrades({});
    };

    const allClassReminders = useMemo(() => currentClassContent?.reminders || [], [currentClassContent]);

    return (
        <div className="flex flex-col gap-6 min-h-screen pb-20 max-w-[1600px] mx-auto w-full">
            {/* Header Menu */}
            <div className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 mx-4 md:mx-0">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-3xl w-full md:w-auto overflow-x-auto no-scrollbar">
                    <button onClick={() => setViewMode('GRADES')} className={`flex-1 md:flex-none px-5 py-2.5 rounded-2xl transition-all flex items-center justify-center gap-2 whitespace-nowrap ${viewMode === 'GRADES' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}><LayoutGrid size={18} /> <span className="text-xs font-black uppercase">Gestão</span></button>
                    <button onClick={() => setViewMode('CALENDAR')} className={`flex-1 md:flex-none px-5 py-2.5 rounded-2xl transition-all flex items-center justify-center gap-2 whitespace-nowrap ${viewMode === 'CALENDAR' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}><Calendar size={18} /> <span className="text-xs font-black uppercase">Agenda</span></button>
                    <button onClick={() => setViewMode('STATS')} className={`flex-1 md:flex-none px-5 py-2.5 rounded-2xl transition-all flex items-center justify-center gap-2 whitespace-nowrap ${viewMode === 'STATS' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}><BarChart3 size={18} /> <span className="text-xs font-black uppercase">Dados</span></button>
                    {isFullTeacher && (
                        <>
                            <button onClick={() => setViewMode('ACTIVITY_CONFIG')} className={`flex-1 md:flex-none px-5 py-2.5 rounded-2xl transition-all flex items-center justify-center gap-2 whitespace-nowrap ${viewMode === 'ACTIVITY_CONFIG' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}><Settings size={18} /> <span className="text-xs font-black uppercase">Config</span></button>
                            <button onClick={() => setViewMode('MONITORS')} className={`flex-1 md:flex-none px-5 py-2.5 rounded-2xl transition-all flex items-center justify-center gap-2 whitespace-nowrap ${viewMode === 'MONITORS' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}><ShieldCheck size={18} /> <span className="text-xs font-black uppercase">Monitores</span></button>
                            <button onClick={() => setViewMode('FORUM')} className={`flex-1 md:flex-none px-5 py-2.5 rounded-2xl transition-all flex items-center justify-center gap-2 whitespace-nowrap ${viewMode === 'FORUM' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}><MessageCircle size={18} /> <span className="text-xs font-black uppercase">Fórum</span></button>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="Buscar aluno..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-[1.8rem] text-sm font-bold" />
                    </div>
                    {isFullTeacher && selectedClassFilter !== 'ALL' && (
                        <button
                            onClick={() => window.print()}
                            className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg hover:bg-indigo-700 transition-all shadow-indigo-500/20 shrink-0"
                            title="Exportar Médias da Turma"
                        >
                            <Printer size={22} />
                        </button>
                    )}
                    {isFullTeacher && (
                        <button onClick={() => { setEditName(''); setEditEmail(''); setEditPassword(''); setEditIsMonitor(false); setEditResidence('URBAN'); setIsNewStudentOpen(true); }} className="bg-emerald-600 text-white p-2.5 rounded-2xl shadow-lg hover:bg-emerald-700 transition-all shadow-emerald-500/20 shrink-0"><UserPlus size={22} /></button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-0">
                <div className={`${viewMode === 'STATS' || viewMode === 'MONITORS' || viewMode === 'ACTIVITY_CONFIG' ? 'lg:col-span-12' : 'lg:col-span-8'} bg-white rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col overflow-hidden`}>
                    {viewMode === 'GRADES' ? (
                        <div className="flex flex-col flex-1">
                            {/* Filters Section */}
                            <div className="p-6 border-b border-slate-100 bg-white space-y-6">
                                {/* Class Selector - Compact Single Line */}
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2"><Users size={12} /> Selecione a Turma</h3>
                                    <div className="flex flex-wrap p-1 bg-slate-100 rounded-xl w-full">
                                        <button
                                            onClick={() => setSelectedClassFilter('ALL')}
                                            className={`flex-1 px-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap text-center ${selectedClassFilter === 'ALL' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            Todas
                                        </button>
                                        {Object.entries(CLASS_LABELS).map(([k, v]) => (
                                            <button
                                                key={k}
                                                onClick={() => setSelectedClassFilter(k as SchoolClass)}
                                                className={`flex-1 px-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap text-center ${selectedClassFilter === k ? `${getClassColor(k as SchoolClass)} text-white shadow-sm` : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                {k.replace(/(\d)([A-Z])/, '$1ª $2')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Bimester Selector - Tabs */}
                                <div className="space-y-2">
                                    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2"><Calendar size={12} /> Selecione o Bimestre</h3>
                                    <div className="flex p-1 bg-slate-100 rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar">
                                        {BIMESTERS.map(b => (
                                            <button key={b} onClick={() => setActiveBimester(b)} className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeBimester === b ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                                {b}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Actions Toolbar (Above Table) */}
                            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                    {filteredStudents.length} estudantes encontrados
                                </div>

                                {/* Batch Edit Button moved here */}
                                {isFullTeacher && selectedClassFilter !== 'ALL' && (
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={toggleShowAverage}
                                            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm ${classSettings.showAverage ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                        >
                                            {classSettings.showAverage ? <Eye size={16} /> : <EyeOff size={16} />}
                                            {classSettings.showAverage ? 'Média Visível' : 'Média Oculta'}
                                        </button>
                                        {isBatchEditMode ? (
                                            <>
                                                <button
                                                    onClick={() => { setIsBatchEditMode(false); setPendingGrades({}); }}
                                                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-red-100 text-red-600 hover:bg-red-200 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <X size={16} /> Cancelar
                                                </button>
                                                <button
                                                    onClick={handleSaveBatchGrades}
                                                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                                >
                                                    <Save size={16} /> Salvar Notas
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setIsBatchEditMode(true);
                                                        setPendingGrades({});
                                                    }}
                                                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-800 text-white hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                                                >
                                                    <ListChecks size={16} /> Lançar Notas em Lote
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                                        <tr>
                                            <th className="p-4 w-10 text-center">
                                                <button onClick={toggleSelectAll} className="p-1 hover:bg-slate-200 rounded transition-colors">
                                                    {isAllSelected ? <CheckSquare size={18} className="text-emerald-600 mx-auto" /> : <Square size={18} className="text-slate-400 mx-auto" />}
                                                </button>
                                            </th>
                                            <th className="p-4">Estudante</th>
                                            <th className="p-4 text-center w-24">A1</th>
                                            <th className="p-4 text-center w-24">A2</th>
                                            <th className="p-4 text-center w-24">A3</th>
                                            <th className="p-4 text-center w-24 bg-slate-100/50">Média</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredStudents.map(s => {
                                            const isSel = selectedIds.has(s.id);
                                            const rank = classRanks[s.id] ?? 999;

                                            return (
                                                <tr key={s.id} className={`${isSel ? 'bg-emerald-50/40' : 'hover:bg-slate-50/50'} transition-colors group`}>
                                                    <td className="p-4 text-center"><button onClick={() => toggleSelectStudent(s.id)}>{isSel ? <CheckSquare size={18} className="text-emerald-600 mx-auto" /> : <Square size={18} className="text-slate-200 mx-auto group-hover:text-slate-400 transition-colors" />}</button></td>
                                                    <td className="p-4">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative">
                                                                    <div className={`w-9 h-9 flex items-center justify-center text-white shadow-md ${getAvatarStyles(s.schoolClass)}`}>
                                                                        <span className="font-black text-[10px]">{getInitials(s.name)}</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => isFullTeacher && setLevelSelectorOpen(levelSelectorOpen === s.id ? null : s.id)}
                                                                        className="absolute -bottom-1.5 -right-1.5 bg-white p-0.5 rounded-full shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors z-10"
                                                                        title="Alterar Nível Biológico"
                                                                    >
                                                                        <BiologicalLevelIcon level={s.biologicalLevel || 'ORGANELLE'} size={10} className={getRankColor(rank)} />
                                                                    </button>

                                                                    {/* Level Selector Popover */}
                                                                    {levelSelectorOpen === s.id && (
                                                                        <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 w-64 grid grid-cols-2 gap-2 animate-in zoom-in-95 duration-200">
                                                                            {BIOLOGICAL_LEVEL_ORDER.map((level) => (
                                                                                <button
                                                                                    key={level}
                                                                                    onClick={() => handleUpdateBiologicalLevel(s.id, level)}
                                                                                    className={`p-2 rounded-xl flex items-center gap-2 transition-all text-left ${s.biologicalLevel === level ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/20' : 'hover:bg-slate-50 text-slate-500'}`}
                                                                                    title={BIOLOGICAL_LEVELS[level].label}
                                                                                >
                                                                                    <div className={`p-1.5 rounded-lg ${s.biologicalLevel === level ? 'bg-white' : 'bg-slate-100'}`}>
                                                                                        <BiologicalLevelIcon level={level} size={14} />
                                                                                    </div>
                                                                                    <span className="text-[10px] font-black uppercase tracking-wide">{BIOLOGICAL_LEVELS[level].label}</span>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <button
                                                                        onClick={() => setViewingStudent(s)}
                                                                        className="font-black text-slate-800 text-xs flex items-center gap-1 hover:text-emerald-600 transition-colors text-left"
                                                                    >
                                                                        {s.name}
                                                                        {s.isMonitor && <ShieldCheck size={12} className="text-emerald-500" />}
                                                                    </button>
                                                                    <span className="text-[9px] font-black uppercase text-emerald-600">{CLASS_LABELS[s.schoolClass]}</span>
                                                                </div>
                                                            </div>
                                                            {isFullTeacher && (
                                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                                    <button onClick={() => openEditStudentModal(s)} className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-all" title="Editar"><Pencil size={14} /></button>
                                                                    <button onClick={() => handleDeleteStudent(s)} className="p-1.5 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-all" title="Excluir"><Trash2 size={14} /></button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {[0, 1, 2].map(i => {
                                                        const activity = s.bimesterGrades[activeBimester][i];
                                                        const pendingVal = pendingGrades[s.id]?.[i];
                                                        const displayVal = pendingVal !== undefined ? pendingVal : (activity.score ?? '');

                                                        // Color Logic
                                                        const getScoreColor = (val: number | null) => {
                                                            if (val === null) return 'text-slate-300';
                                                            return val >= 6 ? 'text-emerald-600' : 'text-red-500';
                                                        };

                                                        return (
                                                            <td key={i} className="p-2 text-center">
                                                                {isBatchEditMode && currentPerms.canEditGrades ? (
                                                                    <div className="relative group/input flex justify-center">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max={activity.maxScore || 10}
                                                                            step="0.1"
                                                                            value={displayVal}
                                                                            onChange={(e) => handleBatchGradeChange(s.id, i, e.target.value)}
                                                                            className={`w-14 py-1.5 text-center border rounded-lg font-black text-xs outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${displayVal !== '' ? (parseFloat(displayVal as string) >= 6 ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-white border-red-200 text-red-600') : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                                                                            placeholder="-"
                                                                        />
                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/input:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                                            Max: {activity.maxScore || 10}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex justify-center">
                                                                        <button disabled={!currentPerms.canEditGrades} onClick={() => setEditingGrade({ student: s, activity: s.bimesterGrades[activeBimester][i] })} className={`w-14 py-1.5 border rounded-lg font-black text-xs relative group/btn flex flex-col items-center justify-center gap-0.5 ${!currentPerms.canEditGrades ? 'opacity-50 cursor-not-allowed' : ''} ${s.bimesterGrades[activeBimester][i].score !== null ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100'}`}>
                                                                            <span className={getScoreColor(s.bimesterGrades[activeBimester][i].score)}>
                                                                                {s.bimesterGrades[activeBimester][i].score ?? '-'}
                                                                            </span>
                                                                            {s.bimesterGrades[activeBimester][i].recoveryScore !== null && (
                                                                                <span className={`text-[8px] ${getScoreColor(s.bimesterGrades[activeBimester][i].recoveryScore)}`}>
                                                                                    Rec: {s.bimesterGrades[activeBimester][i].recoveryScore}
                                                                                </span>
                                                                            )}
                                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                                                {s.bimesterGrades[activeBimester][i].title}
                                                                            </div>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="p-4 text-center font-black text-slate-900 bg-slate-50/50">
                                                        {(() => {
                                                            const grades = s.bimesterGrades[activeBimester];
                                                            const validGrades = grades.filter(g => g.score !== null);
                                                            if (validGrades.length < 3) return '-';

                                                            const sum = validGrades.reduce((acc, curr) => {
                                                                const scoreToUse = (curr.recoveryScore !== null && curr.recoveryScore > (curr.score || 0)) ? curr.recoveryScore : (curr.score || 0);
                                                                return acc + scoreToUse;
                                                            }, 0);

                                                            const average = (sum / 3).toFixed(1);
                                                            const avgNum = parseFloat(average);

                                                            return (
                                                                <span className={avgNum >= 6 ? 'text-emerald-600' : 'text-red-500'}>
                                                                    {average}
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden flex flex-col divide-y divide-slate-100">
                                {filteredStudents.map(s => {
                                    const isSel = selectedIds.has(s.id);
                                    return (
                                        <div key={s.id} className={`p-4 ${isSel ? 'bg-emerald-50/40' : 'bg-white'} transition-colors`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => toggleSelectStudent(s.id)}>{isSel ? <CheckSquare size={20} className="text-emerald-600" /> : <Square size={20} className="text-slate-200" />}</button>
                                                    <div className="relative">
                                                        <div className={`w-10 h-10 flex items-center justify-center text-white shadow-md ${getAvatarStyles(s.schoolClass)}`}>
                                                            <span className="font-black text-xs">{getInitials(s.name)}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => isFullTeacher && setLevelSelectorOpen(levelSelectorOpen === s.id ? null : s.id)}
                                                            className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors z-10"
                                                        >
                                                            <BiologicalLevelIcon level={s.biologicalLevel || 'ORGANELLE'} size={12} className="text-emerald-600" />
                                                        </button>

                                                        {/* Level Selector Popover Mobile */}
                                                        {levelSelectorOpen === s.id && (
                                                            <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 w-64 grid grid-cols-2 gap-2 animate-in zoom-in-95 duration-200">
                                                                {BIOLOGICAL_LEVEL_ORDER.map((level) => (
                                                                    <button
                                                                        key={level}
                                                                        onClick={() => handleUpdateBiologicalLevel(s.id, level)}
                                                                        className={`p-2 rounded-xl flex items-center gap-2 transition-all text-left ${s.biologicalLevel === level ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/20' : 'hover:bg-slate-50 text-slate-500'}`}
                                                                    >
                                                                        <div className={`p-1.5 rounded-lg ${s.biologicalLevel === level ? 'bg-white' : 'bg-slate-100'}`}>
                                                                            <BiologicalLevelIcon level={level} size={14} />
                                                                        </div>
                                                                        <span className="text-[10px] font-black uppercase tracking-wide">{BIOLOGICAL_LEVELS[level].label}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-800 text-sm flex items-center gap-1">
                                                            {s.name}
                                                            {s.isMonitor && <ShieldCheck size={14} className="text-emerald-500" />}
                                                        </span>
                                                        <span className="text-[10px] font-black uppercase text-emerald-600">{CLASS_LABELS[s.schoolClass]}</span>
                                                    </div>
                                                </div>
                                                {isFullTeacher && (
                                                    <button onClick={() => openEditStudentModal(s)} className="p-2 text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100"><Pencil size={16} /></button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-4 gap-2">
                                                {[0, 1, 2].map(i => {
                                                    const activity = s.bimesterGrades[activeBimester][i];
                                                    const pendingVal = pendingGrades[s.id]?.[i];
                                                    const displayVal = pendingVal !== undefined ? pendingVal : (activity.score ?? '');

                                                    const getScoreColor = (val: number | null) => {
                                                        if (val === null) return 'text-slate-300';
                                                        return val >= 6 ? 'text-emerald-600' : 'text-red-500';
                                                    };

                                                    return (
                                                        <div key={i} className="flex flex-col gap-1">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase text-center">A{i + 1}</span>
                                                            {isBatchEditMode && currentPerms.canEditGrades ? (
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max={activity.maxScore || 10}
                                                                    step="0.1"
                                                                    value={displayVal}
                                                                    onChange={(e) => handleBatchGradeChange(s.id, i, e.target.value)}
                                                                    className={`w-full py-2 text-center border rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${displayVal !== '' ? (parseFloat(displayVal as string) >= 6 ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-white border-red-200 text-red-600') : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                                                                    placeholder="-"
                                                                />
                                                            ) : (
                                                                <button disabled={!currentPerms.canEditGrades} onClick={() => setEditingGrade({ student: s, activity: s.bimesterGrades[activeBimester][i] })} className={`w-full py-2 border rounded-xl font-black text-sm flex flex-col items-center justify-center gap-0.5 ${!currentPerms.canEditGrades ? 'opacity-50 cursor-not-allowed' : ''} ${s.bimesterGrades[activeBimester][i].score !== null ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100'}`}>
                                                                    <span className={getScoreColor(s.bimesterGrades[activeBimester][i].score)}>
                                                                        {s.bimesterGrades[activeBimester][i].score ?? '-'}
                                                                    </span>
                                                                    {s.bimesterGrades[activeBimester][i].recoveryScore !== null && (
                                                                        <span className={`text-[8px] ${getScoreColor(s.bimesterGrades[activeBimester][i].recoveryScore)}`}>
                                                                            R: {s.bimesterGrades[activeBimester][i].recoveryScore}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase text-center">Média</span>
                                                    <div className="w-full py-2 bg-slate-100/50 rounded-xl flex items-center justify-center font-black text-sm">
                                                        {(() => {
                                                            const grades = s.bimesterGrades[activeBimester];
                                                            const validGrades = grades.filter(g => g.score !== null);
                                                            if (validGrades.length < 3) return <span className="text-slate-300">-</span>;

                                                            const sum = validGrades.reduce((acc, curr) => {
                                                                const scoreToUse = (curr.recoveryScore !== null && curr.recoveryScore > (curr.score || 0)) ? curr.recoveryScore : (curr.score || 0);
                                                                return acc + scoreToUse;
                                                            }, 0);

                                                            const average = (sum / 3).toFixed(1);
                                                            const avgNum = parseFloat(average);

                                                            return (
                                                                <span className={avgNum >= 6 ? 'text-emerald-600' : 'text-red-500'}>
                                                                    {average}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : viewMode === 'CALENDAR' ? (
                        <CalendarView reminders={allClassReminders} onDayClick={handleDayClickInCalendar} />
                    ) : viewMode === 'MONITORS' ? (
                        <div className="p-8 space-y-8 animate-in fade-in">
                            <div className="flex flex-col gap-2">
                                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><ShieldCheck className="text-emerald-600" size={32} /> Gestão de Monitores</h2>
                                <p className="text-sm text-slate-500 font-bold">Defina as permissões de acesso para os estudantes que atuam como monitores.</p>
                            </div>

                            <div className="space-y-8">
                                {/* Permissão Principal de Acesso */}
                                <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white p-4 rounded-2xl text-emerald-600 shadow-sm"><Lock size={32} /></div>
                                        <div>
                                            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Acesso ao Portal Administrativo</h3>
                                            <p className="text-xs font-bold text-slate-500 mt-1">Permitir que monitores façam login no painel de gestão.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => {
                                        const newValue = !monitorPerms.canLogin;
                                        const next = {
                                            ...monitorPerms,
                                            canLogin: newValue,
                                            // Se desativar login, desativa tudo. Se ativar, mantém como estava (ou tudo false se preferir, aqui mantive o estado anterior das outras perms, mas a UI vai esconder)
                                            ...(newValue ? {} : { canEditGrades: false, canManageContent: false, canManageMaterials: false, canManageMural: false })
                                        };
                                        setMonitorPerms(next);
                                        saveMonitorPermissions(next);
                                    }}>
                                        {monitorPerms.canLogin ? (
                                            <div className="flex items-center gap-3 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all">
                                                <span className="text-xs font-black uppercase tracking-widest">Acesso Permitido</span>
                                                <ToggleRight size={32} />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 bg-slate-200 text-slate-400 px-6 py-3 rounded-2xl transition-all">
                                                <span className="text-xs font-black uppercase tracking-widest">Acesso Bloqueado</span>
                                                <ToggleLeft size={32} />
                                            </div>
                                        )}
                                    </button>
                                </div>

                                {/* Outras Permissões - Só aparecem se login permitido */}
                                {monitorPerms.canLogin && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 fade-in duration-500">
                                        {[
                                            { key: 'canEditGrades', label: 'Lançar Notas', icon: <TrendingUp /> },
                                            { key: 'canManageContent', label: 'Postar Conteúdo', icon: <FileText /> },
                                            { key: 'canManageMaterials', label: 'Subir Arquivos', icon: <Upload /> },
                                            { key: 'canManageMural', label: 'Gerenciar Mural', icon: <Bell /> },
                                        ].map(perm => (
                                            <div key={perm.key} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all">
                                                <div className="flex items-center justify-between">
                                                    <div className="bg-white p-3 rounded-2xl text-emerald-600 shadow-sm">{perm.icon}</div>
                                                    <button onClick={() => togglePermission(perm.key as any)}>
                                                        {monitorPerms[perm.key as keyof MonitorPermissions] ? <ToggleRight size={48} className="text-emerald-600" /> : <ToggleLeft size={48} className="text-slate-300" />}
                                                    </button>
                                                </div>
                                                <span className="font-black text-slate-800 text-sm uppercase tracking-widest">{perm.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : viewMode === 'ACTIVITY_CONFIG' ? (
                        <div className="p-8 space-y-6 animate-in fade-in">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Settings className="text-emerald-600" size={32} /> Configuração de Avaliações</h2>
                                    <p className="text-sm text-slate-500 font-bold mt-1">Defina os títulos e descrições das atividades para a turma inteira.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-xl text-xs font-black uppercase">{selectedClassFilter !== 'ALL' ? CLASS_LABELS[selectedClassFilter] : 'Selecione uma Turma'}</span>
                                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-xl text-xs font-black uppercase">{activeBimester}</span>
                                </div>
                            </div>

                            {selectedClassFilter === 'ALL' ? (
                                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                                    <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
                                    <p className="text-slate-400 font-bold text-lg">Selecione uma turma específica acima para configurar as atividades.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {activityConfigs.map((config) => (
                                        <div key={config.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="bg-white px-3 py-1 rounded-lg text-[10px] font-black uppercase text-slate-400 shadow-sm">Atividade {config.id}</span>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Título</label>
                                                <input
                                                    value={config.title}
                                                    onChange={(e) => handleUpdateActivityConfig(config.id, 'title', e.target.value)}
                                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-emerald-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Descrição</label>
                                                <textarea
                                                    value={config.description}
                                                    onChange={(e) => handleUpdateActivityConfig(config.id, 'description', e.target.value)}
                                                    className="w-full p-3 h-24 bg-white border border-slate-200 rounded-xl font-medium text-xs outline-none focus:border-emerald-500 resize-none"
                                                    placeholder="Descreva o conteúdo..."
                                                />
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nota Máx.</label>
                                                    <input
                                                        type="number"
                                                        value={config.maxScore}
                                                        onChange={(e) => handleUpdateActivityConfig(config.id, 'maxScore', parseFloat(e.target.value))}
                                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-emerald-500"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-center pt-5">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={config.hasRecovery}
                                                            onChange={(e) => handleUpdateActivityConfig(config.id, 'hasRecovery', e.target.checked)}
                                                            className="w-5 h-5 text-emerald-600 rounded"
                                                        />
                                                        <span className="text-[10px] font-black uppercase text-slate-500">Recuperação</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="md:col-span-3 mt-4 flex justify-end">
                                        <button
                                            onClick={saveActivityConfiguration}
                                            className="px-8 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-700 transition-all uppercase tracking-widest flex items-center gap-3"
                                        >
                                            <Save size={20} /> Salvar e Aplicar à Turma
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : viewMode === 'FORUM' ? (
                        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-600"><MessageCircle size={24} /></div>
                                    <div>
                                        <h3 className="font-black text-slate-800 text-lg">Fórum da Turma</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{CLASS_LABELS[selectedClassFilter as SchoolClass]} • {activeBimester}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${forumSettings.isEnabled ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        {forumSettings.isEnabled ? 'Habilitado' : 'Desabilitado'}
                                    </span>
                                    <button
                                        onClick={toggleForumStatus}
                                        className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${forumSettings.isEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${forumSettings.isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                                {forumPosts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                        <MessageCircle size={48} className="mb-4 opacity-20" />
                                        <p className="text-sm font-bold uppercase tracking-widest">Nenhuma mensagem ainda</p>
                                    </div>
                                ) : (
                                    forumPosts.map(post => (
                                        <div key={post.id} className={`flex gap-4 ${post.authorId === user.id ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md shrink-0 ${post.authorRole === 'TEACHER' ? 'bg-emerald-500' :
                                                post.authorRole === 'MONITOR' ? 'bg-amber-500' : 'bg-blue-500'
                                                }`}>
                                                {getInitials(post.authorName)}
                                            </div>
                                            <div className={`max-w-[70%] space-y-1 ${post.authorId === user.id ? 'items-end flex flex-col' : ''}`}>
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
                                                <button
                                                    onClick={() => handleDeleteForumPost(post.id)}
                                                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                    title="Apagar mensagem"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 bg-white border-t border-slate-100">
                                <div className="flex gap-2">
                                    <input
                                        value={newForumPost}
                                        onChange={(e) => setNewForumPost(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddForumPost()}
                                        placeholder="Escreva uma mensagem para a turma..."
                                        className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 transition-all font-medium text-sm"
                                    />
                                    <button
                                        onClick={handleAddForumPost}
                                        disabled={!newForumPost.trim() || (!forumSettings.isEnabled && !isFullTeacher)}
                                        className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <StatisticsView students={students} selectedClass={selectedClassFilter} selectedStudentId={selectedIds.size === 1 ? Array.from(selectedIds)[0] : undefined} currentBimester={activeBimester} />
                    )}
                </div>

                {/* Barra Lateral */}
                {(viewMode === 'GRADES' || viewMode === 'CALENDAR') && selectedClassFilter !== 'ALL' && (
                    <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-1">
                        {/* Planejamento */}
                        <div className={`bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4 ${!currentPerms.canManageContent ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                            <h3 className="font-black text-slate-800 text-xs flex items-center gap-2 uppercase tracking-widest"><FileText size={16} className="text-emerald-600" /> Planejamento</h3>
                            <textarea
                                value={contentNotes}
                                onChange={(e) => setContentNotes(e.target.value)}
                                className="w-full h-28 p-4 text-xs font-bold border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 resize-none bg-slate-50 transition-all"
                                placeholder="Postar novo planejamento..."
                            />
                            <button onClick={handleSaveContent} className="w-full py-3 bg-emerald-600 text-white text-xs font-black rounded-2xl shadow-lg hover:bg-emerald-700 transition-all uppercase">Postar Conteúdo</button>

                            {currentClassContent?.textContent && (
                                <div className="mt-4 p-5 bg-indigo-50 rounded-[1.8rem] border border-indigo-100 relative group animate-in slide-in-from-top-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-black uppercase text-indigo-400">Conteúdo Ativo</span>
                                        <div className="flex gap-1">
                                            <button onClick={handleEditContent} className="p-2 bg-white text-indigo-600 rounded-xl shadow-sm hover:bg-indigo-600 hover:text-white transition-all" title="Editar planejamento"><Edit3 size={14} /></button>
                                            <button onClick={handleDeleteContent} className="p-2 bg-white text-red-500 rounded-xl shadow-sm hover:bg-red-500 hover:text-white transition-all" title="Excluir planejamento"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                    <p className="text-xs font-bold text-indigo-900 leading-relaxed line-clamp-6">{currentClassContent.textContent}</p>
                                    {currentClassContent.lastEditedBy && (
                                        <p className="text-[8px] text-indigo-400 font-bold mt-2 text-right">Última edição: {currentClassContent.lastEditedBy}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Materiais */}
                        <div className={`bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4 ${!currentPerms.canManageMaterials ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                            <h3 className="font-black text-slate-800 text-xs flex items-center gap-2 uppercase tracking-widest"><Paperclip size={16} className="text-blue-500" /> Materiais</h3>
                            <div className="max-h-40 overflow-y-auto space-y-2 mb-2">
                                {currentClassContent?.files.map(f => (
                                    <div key={f.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-600 group">
                                        <span className="truncate max-w-[150px]">
                                            {f.name}
                                            {f.createdBy && <span className="text-[8px] text-slate-400 block font-normal">por {f.createdBy}</span>}
                                        </span>
                                        <button onClick={() => handleRemoveFile(f.id)} className="text-red-400 p-1 hover:bg-white rounded transition-all"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                            <select value={materialTarget} onChange={(e) => setMaterialTarget(e.target.value as any)} className="w-full p-2.5 text-[10px] font-black bg-slate-100 border border-slate-200 rounded-xl outline-none">
                                <option value="CLASS">Para a Turma Toda</option>
                                <option value="SELECTED">Alunos Selecionados ({selectedIds.size})</option>
                            </select>
                            <label className="cursor-pointer flex flex-col items-center justify-center gap-2 py-5 border-2 border-dashed border-slate-200 rounded-3xl hover:bg-slate-50 transition-all">
                                <Upload size={20} className="text-slate-400" />
                                <span className="text-[10px] font-black uppercase text-slate-400">Subir Material</span>
                                <input type="file" className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>

                        {/* Mural */}
                        <div ref={muralSectionRef} className={`bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4 ${!currentPerms.canManageMural ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                            <h3 className="font-black text-slate-800 text-xs flex items-center gap-2 uppercase tracking-widest"><Bell size={16} className="text-amber-500" /> Mural de Avisos</h3>
                            <div className="space-y-2">
                                <select value={reminderTarget} onChange={(e) => setReminderTarget(e.target.value as any)} className="w-full p-2.5 text-[10px] font-black bg-slate-100 border border-slate-200 rounded-xl outline-none">
                                    <option value="CLASS">Para a Turma Toda</option>
                                    <option value="SELECTED">Alunos Selecionados ({selectedIds.size})</option>
                                </select>
                                <input ref={reminderInputRef} type="text" value={newReminder} onChange={(e) => setNewReminder(e.target.value)} className="w-full p-3 text-xs font-bold border border-slate-200 rounded-xl outline-none" placeholder="Texto do aviso..." />
                                <div className="flex gap-2">
                                    <input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} className="flex-1 p-2.5 text-[10px] font-black border border-slate-200 rounded-xl" />
                                    <button onClick={handleAddReminder} className="bg-amber-500 text-white p-2.5 rounded-xl shadow-lg hover:bg-amber-600 transition-all"><Plus size={18} /></button>
                                </div>
                            </div>
                            <div className="max-h-40 overflow-y-auto space-y-2">
                                {currentClassContent?.reminders.map(r => (
                                    <div key={r.id} className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex justify-between items-start group">
                                        <div className="flex-1">
                                            <p className="text-[11px] font-bold text-amber-900 leading-tight">{r.text}</p>
                                            {r.createdBy && <span className="text-[8px] text-amber-600/60 block mt-1">por {r.createdBy}</span>}
                                        </div>
                                        <button onClick={() => handleRemoveReminder(r.id)} className="text-amber-400 p-1 hover:bg-white rounded opacity-0 group-hover:opacity-100 transition-all"><X size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Editar/Novo Estudante */}
            {
                (isEditStudentOpen || isNewStudentOpen) && (
                    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl overflow-y-auto max-h-[90vh]">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-600"><UserPlus size={24} /></div>
                                    <h3 className="font-black text-slate-800 text-lg">{isNewStudentOpen ? 'Novo Cadastro' : 'Editar Cadastro'}</h3>
                                </div>
                                <button onClick={() => { setIsEditStudentOpen(false); setIsNewStudentOpen(false); }} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X /></button>
                            </div>
                            <form onSubmit={isNewStudentOpen ? handleCreateStudent : handleUpdateStudent} className="p-8 space-y-5">

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
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Senha {isNewStudentOpen ? '(Obrigatória)' : '(Opcional)'}</label>
                                        <input
                                            value={editPassword}
                                            onChange={e => setEditPassword(e.target.value)}
                                            type="text"
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                                            required={isNewStudentOpen}
                                            placeholder={isNewStudentOpen ? "Senha de acesso" : "Deixe em branco para manter a atual"}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Turma</label>
                                            <select value={editClass} onChange={e => setEditClass(e.target.value as any)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none transition-all focus:ring-4 focus:ring-emerald-500/10 active:scale-[0.98]">
                                                {Object.entries(CLASS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Sexo Biológico</label>
                                            <select value={editBiologicalSex} onChange={e => setEditBiologicalSex(e.target.value as any)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none transition-all focus:ring-4 focus:ring-emerald-500/10 active:scale-[0.98]">
                                                <option value="M">Masculino</option>
                                                <option value="F">Feminino</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Data Nasc.</label>
                                            <input type="date" value={editBirthDate} onChange={e => setEditBirthDate(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" required />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Residência</label>
                                            <select value={editResidence} onChange={e => setEditResidence(e.target.value as any)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none transition-all focus:ring-4 focus:ring-emerald-500/10 active:scale-[0.98]">
                                                {Object.entries(RESIDENCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-[2rem] flex items-center justify-between group/monitor">
                                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                                            <input
                                                type="checkbox"
                                                checked={editIsMonitor}
                                                onChange={e => setEditIsMonitor(e.target.checked)}
                                                className="w-6 h-6 text-emerald-600 rounded-xl transition-all accent-emerald-500"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-emerald-900 uppercase">Estudante Monitor</span>
                                                <span className="text-[8px] font-bold text-emerald-600">Acesso ao portal administrativo</span>
                                            </div>
                                        </label>
                                        <ShieldCheck size={20} className={`transition-all ${editIsMonitor ? 'text-emerald-500 opacity-100' : 'text-slate-300 opacity-30'}`} />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-[2rem] shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-1 active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                                    >
                                        <Save size={20} className="animate-pulse" /> Finalizar e Salvar
                                    </button>
                                    <p className="text-[8px] text-center text-slate-400 mt-4 font-bold uppercase tracking-widest leading-relaxed">
                                        Garantindo a integridade dos dados e o respeito à<br />identidade de todos os estudantes.
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {editingGrade && <GradeModal isOpen={true} readOnlyMetadata={true} onClose={() => setEditingGrade(null)} onSubmit={(act) => { updateActivityGrade(editingGrade.student.id, activeBimester, act); setEditingGrade(null); refreshData(); }} studentName={editingGrade.student.name} activity={editingGrade.activity} bimester={activeBimester} />}

            {/* Modal de Confirmação de Exclusão */}
            {
                confirmDeleteId && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="p-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Trash2 size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800">Apagar Mensagem?</h3>
                                <p className="text-sm font-medium text-slate-500">Esta ação não pode ser desfeita. A mensagem será removida permanentemente do fórum.</p>
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
                )
            }

            {/* Modal de Confirmação de Exclusão de Planejamento */}
            {
                isConfirmDeleteContentOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="p-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Trash2 size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800">Apagar Planejamento?</h3>
                                <p className="text-sm font-medium text-slate-500">Isso removerá o conteúdo do {currentClassContent?.bimester} para esta turma. Esta ação não pode ser desfeita.</p>
                            </div>
                            <div className="p-6 bg-slate-50 flex gap-3">
                                <button
                                    onClick={() => setIsConfirmDeleteContentOpen(false)}
                                    className="flex-1 py-4 bg-white text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDeleteContent}
                                    className="flex-1 py-4 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
                                >
                                    Apagar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal de Confirmação de Exclusão de Estudante */}
            {
                studentToDelete && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="p-8 text-center space-y-4">
                                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-sm shadow-red-500/10">
                                    <Trash2 size={40} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800">Remover Estudante?</h3>
                                <p className="text-sm font-bold text-slate-500 px-4 leading-relaxed">
                                    Você está prestes a excluir <span className="text-red-600 font-black underline decoration-red-200 underline-offset-4">{studentToDelete.name}</span>. Todos os dados e acessos serão perdidos.
                                </p>
                            </div>
                            <div className="p-6 bg-slate-50 flex gap-3">
                                <button
                                    onClick={handleDeleteStudent}
                                    className="flex-1 py-4 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
                                >
                                    Excluir Agora
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal de Detalhes do Estudante */}
            {
                viewingStudent && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[300] flex items-center justify-center p-4 animate-in fade-in duration-500">
                        <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                            {/* Header Modal */}
                            <div className="bg-slate-900 p-8 flex justify-between items-start relative overflow-hidden shrink-0">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                                <div className="relative z-10 flex items-center gap-6">
                                    <div className={`w-24 h-24 flex items-center justify-center text-white shadow-2xl rounded-[2.5rem] border-4 border-white/10 ${getAvatarStyles(viewingStudent.schoolClass)}`}>
                                        <span className="font-black text-3xl italic">{getInitials(viewingStudent.name)}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-black text-white tracking-tight">{viewingStudent.name}</h2>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/20 ${getClassColor(viewingStudent.schoolClass)}`}>
                                                {CLASS_LABELS[viewingStudent.schoolClass]}
                                            </span>
                                            <span className="text-slate-400 text-xs font-bold font-mono">{viewingStudent.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setViewingStudent(null)} className="p-3 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all active:scale-95 relative z-10">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Content Modal */}
                            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-slate-50/50">
                                {/* Grid de Informações */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Sexo Biológico</span>
                                        <p className="text-sm font-black text-slate-800 uppercase">{viewingStudent.biologicalSex === 'M' ? 'Masculino' : 'Feminino'}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Residência</span>
                                        <p className="text-sm font-black text-slate-800 uppercase">{RESIDENCE_LABELS[viewingStudent.residenceType]}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-1">
                                        <span className="text-[10px) font-black text-slate-400 uppercase tracking-widest block">Data de Nascimento</span>
                                        <p className="text-sm font-black text-slate-800">{new Date(viewingStudent.birthDate + 'T00:00:00').toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Tabela de Notas Completa */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Histórico de Resultados - Biologia</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {BIMESTERS.map(bim => {
                                            const grades = viewingStudent.bimesterGrades[bim] || [];
                                            const validGrades = grades.filter(g => g.score !== null);
                                            const sum = validGrades.reduce((acc, curr) => {
                                                const scoreToUse = (curr.recoveryScore !== null && curr.recoveryScore > (curr.score || 0)) ? curr.recoveryScore : (curr.score || 0);
                                                return acc + scoreToUse;
                                            }, 0);
                                            const average = validGrades.length >= 3 ? (sum / 3).toFixed(1) : '-';

                                            return (
                                                <div key={bim} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-emerald-200 transition-all duration-300">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider">{bim}</h4>
                                                        <div className={`text-xl font-black ${average !== '-' ? (parseFloat(average) < 6 ? 'text-red-500' : 'text-emerald-500') : 'text-slate-300'}`}>
                                                            {average}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {grades.map(g => (
                                                            <div key={g.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                                                <span className="text-[11px] font-bold text-slate-500">{g.title}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-black text-slate-800">{g.score ?? '-'}</span>
                                                                    {g.recoveryScore !== null && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 rounded-md">R: {g.recoveryScore}</span>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Footer Modal */}
                            <div className="p-8 bg-white border-t border-slate-100 flex gap-4 shrink-0">
                                <button
                                    onClick={() => { setIsEditStudentOpen(true); openEditStudentModal(viewingStudent); setViewingStudent(null); }}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Edit3 size={18} /> Editar Cadastro
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 py-4 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Printer size={18} /> Exportar Boletim (PDF)
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }


            {/* Impressão - Boletim Individual */}
            {viewingStudent && <GradeBulletin student={viewingStudent} teacher={user as any} activeBimester={activeBimester} />}

            {/* Impressão - Médias da Turma */}
            {
                selectedClassFilter !== 'ALL' && !viewingStudent && (
                    <ClassAveragesExport
                        students={filteredStudents}
                        schoolClass={selectedClassFilter}
                        activeBimester={activeBimester}
                    />
                )
            }

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #grade-bulletin-print, #grade-bulletin-print *, #class-averages-print, #class-averages-print * {
                        visibility: visible;
                    }
                    #grade-bulletin-print, #class-averages-print {
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
        </div >
    );
};
