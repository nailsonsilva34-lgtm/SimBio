
import { Student, Teacher, SchoolClass, ResidenceType, Bimester, BIMESTERS, Activity, ClassContent, FileAttachment, Reminder, Notification, NotificationType, MonitorPermissions, BIMESTER_DATES, ClassActivityConfig, ClassSettings, ForumPost, ForumSettings, User, UserRole, BiologicalSex } from '../types';
import { authService } from './authService';

const STUDENTS_KEY = 'biograde_students_2026_v2';
const TEACHERS_KEY = 'biograde_teachers_2026_v2';
const CONTENT_KEY = 'biograde_content_2026_v2';
const NOTIFICATIONS_KEY = 'biograde_notifications_2026_v2';
const MONITOR_PERMS_KEY = 'biograde_monitor_perms_2026';
const ACTIVITY_CONFIGS_KEY = 'biograde_activity_configs_2026';
const CLASS_SETTINGS_KEY = 'biograde_class_settings_2026';
const FORUM_POSTS_KEY = 'biograde_forum_posts_2026';
const FORUM_SETTINGS_KEY = 'biograde_forum_settings_2026';

const createDefaultActivities = (): Activity[] => [
  { id: 1, title: 'Atividade 1', description: '', score: null, maxScore: 10, hasRecovery: false, recoveryScore: null },
  { id: 2, title: 'Atividade 2', description: '', score: null, maxScore: 10, hasRecovery: false, recoveryScore: null },
  { id: 3, title: 'Atividade 3', description: '', score: null, maxScore: 10, hasRecovery: false, recoveryScore: null },
];

export const initData = () => {
  if (!localStorage.getItem(STUDENTS_KEY)) localStorage.setItem(STUDENTS_KEY, JSON.stringify([]));
  if (!localStorage.getItem(TEACHERS_KEY)) localStorage.setItem(TEACHERS_KEY, JSON.stringify([]));
  if (!localStorage.getItem(CONTENT_KEY)) localStorage.setItem(CONTENT_KEY, JSON.stringify([]));
  if (!localStorage.getItem(NOTIFICATIONS_KEY)) localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
  if (!localStorage.getItem(MONITOR_PERMS_KEY)) localStorage.setItem(MONITOR_PERMS_KEY, JSON.stringify({
    canEditGrades: false,
    canManageContent: false,
    canManageMaterials: false,
    canManageMural: false,
    canLogin: false
  }));
  if (!localStorage.getItem(ACTIVITY_CONFIGS_KEY)) localStorage.setItem(ACTIVITY_CONFIGS_KEY, JSON.stringify({}));
  if (!localStorage.getItem(FORUM_POSTS_KEY)) localStorage.setItem(FORUM_POSTS_KEY, JSON.stringify([]));
  if (!localStorage.getItem(FORUM_SETTINGS_KEY)) localStorage.setItem(FORUM_SETTINGS_KEY, JSON.stringify({}));
};

export const getCurrentBimester = (): Bimester => {
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  for (const [key, dates] of Object.entries(BIMESTER_DATES)) {
    if (now >= dates.rawStart && now <= dates.rawEnd) {
      return key as Bimester;
    }
  }
  return '1º Bimestre';
};

export const getMonitorPermissions = (): MonitorPermissions => {
  const data = localStorage.getItem(MONITOR_PERMS_KEY);
  return data ? JSON.parse(data) : { canEditGrades: false, canManageContent: false, canManageMaterials: false, canManageMural: false, canLogin: false };
};

export const saveMonitorPermissions = (perms: MonitorPermissions) => {
  localStorage.setItem(MONITOR_PERMS_KEY, JSON.stringify(perms));
  // Note: Add Supabase sync for perms if needed
};

export const getNotifications = (): Notification[] => {
  const data = localStorage.getItem(NOTIFICATIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const addNotification = (
  type: NotificationType,
  targetType: 'CLASS' | 'STUDENT',
  targetId: string,
  message: string,
  targetSection?: Notification['targetSection'],
  refId?: string
) => {
  const notifications = getNotifications();
  const isSpam = notifications.slice(0, 3).some(n => n.message === message && n.targetId === targetId);
  if (isSpam) return;

  const newNotif: Notification = {
    id: Math.random().toString(36).substr(2, 9),
    type,
    targetType,
    targetId,
    message,
    targetSection,
    refId,
    createdAt: new Date().toISOString(),
    readBy: []
  };
  notifications.unshift(newNotif);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications.slice(0, 50)));
};

export const markNotificationAsRead = (studentId: string, notificationId: string) => {
  const notifications = getNotifications();
  const index = notifications.findIndex(n => n.id === notificationId);
  if (index !== -1 && !notifications[index].readBy.includes(studentId)) {
    notifications[index].readBy.push(studentId);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }
};

export const removeNotificationByRef = (refId: string) => {
  const notifications = getNotifications();
  const filtered = notifications.filter(n => n.refId !== refId);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
};

export const markAllNotificationsAsRead = (studentId: string) => {
  const notifications = getNotifications();
  let changed = false;
  notifications.forEach(n => {
    // Nota: targetId pode ser o ID do estudante ou o ID da turma
    if (!n.readBy.includes(studentId)) {
      n.readBy.push(studentId);
      changed = true;
    }
  });
  if (changed) {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }
};

import { syncService } from './syncService';

export const getStudents = (): Student[] => {
  const data = localStorage.getItem(STUDENTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveStudents = (students: Student[]) => {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  syncService.syncStudents(students).catch(console.error);
};

// Activity Config Methods
export const getClassActivityConfigs = (schoolClass: SchoolClass, bimester: Bimester): ClassActivityConfig[] => {
  const data = localStorage.getItem(ACTIVITY_CONFIGS_KEY);
  const allConfigs = data ? JSON.parse(data) : {};
  const key = `${schoolClass}_${bimester}`;

  if (allConfigs[key]) {
    return allConfigs[key];
  }

  return [
    { id: 1, title: 'Atividade 1', description: '', maxScore: 10, hasRecovery: false },
    { id: 2, title: 'Atividade 2', description: '', maxScore: 10, hasRecovery: false },
    { id: 3, title: 'Atividade 3', description: '', maxScore: 10, hasRecovery: false },
  ];
};

export const saveClassActivityConfigs = (schoolClass: SchoolClass, bimester: Bimester, configs: ClassActivityConfig[]) => {
  // 1. Save Configs
  const data = localStorage.getItem(ACTIVITY_CONFIGS_KEY);
  const allConfigs = data ? JSON.parse(data) : {};
  const key = `${schoolClass}_${bimester}`;
  allConfigs[key] = configs;
  localStorage.setItem(ACTIVITY_CONFIGS_KEY, JSON.stringify(allConfigs));

  // 2. Update existing students in this class/bimester
  const students = getStudents();
  let updated = false;

  const updatedStudents = students.map(student => {
    if (student.schoolClass === schoolClass) {
      updated = true;
      const currentActivities = student.bimesterGrades[bimester];

      const newActivities = currentActivities.map(act => {
        const config = configs.find(c => c.id === act.id);
        if (config) {
          // Update metadata but keep the score
          return {
            ...act,
            title: config.title,
            description: config.description,
            maxScore: config.maxScore,
            hasRecovery: config.hasRecovery
          };
        }
        return act;
      });

      return {
        ...student,
        bimesterGrades: {
          ...student.bimesterGrades,
          [bimester]: newActivities
        }
      };
    }
    return student;
  });

  if (updated) {
    saveStudents(updatedStudents);
  }

  // Sync activity configs to Supabase
  syncService.syncActivityConfigs?.(schoolClass, bimester, configs).catch(console.error);
};

export const getClassSettings = (schoolClass: SchoolClass, bimester: Bimester): ClassSettings => {
  const data = localStorage.getItem(CLASS_SETTINGS_KEY);
  const allSettings = data ? JSON.parse(data) : {};
  const key = `${schoolClass}_${bimester}`;
  return allSettings[key] || { showAverage: false };
};

export const saveClassSettings = (schoolClass: SchoolClass, bimester: Bimester, settings: ClassSettings) => {
  const data = localStorage.getItem(CLASS_SETTINGS_KEY);
  const allSettings = data ? JSON.parse(data) : {};
  const key = `${schoolClass}_${bimester}`;

  const oldSettings = allSettings[key];
  if (!oldSettings?.showAverage && settings.showAverage) {
    addNotification('GRADE', 'CLASS', schoolClass, `As médias do ${bimester} já estão disponíveis.`, 'GRADES');
  }

  allSettings[key] = settings;
  localStorage.setItem(CLASS_SETTINGS_KEY, JSON.stringify(allSettings));

  // Sync class settings to Supabase
  syncService.syncClassSettings?.(schoolClass, bimester, settings).catch(console.error);
};

export const getClassContent = (schoolClass: SchoolClass, bimester: Bimester): ClassContent => {
  const data = localStorage.getItem(CONTENT_KEY);
  const allContent: ClassContent[] = data ? JSON.parse(data) : [];
  const found = allContent.find(c => c.schoolClass === schoolClass && c.bimester === bimester);
  if (found) return found;
  return { schoolClass, bimester, textContent: '', files: [], reminders: [] };
};

export const saveClassContent = (content: ClassContent) => {
  const data = localStorage.getItem(CONTENT_KEY);
  let allContent: ClassContent[] = data ? JSON.parse(data) : [];
  const oldContent = allContent.find(c => c.schoolClass === content.schoolClass && c.bimester === content.bimester);
  const index = allContent.findIndex(c => c.schoolClass === content.schoolClass && c.bimester === content.bimester);

  const contentRefId = `CONTENT_${content.schoolClass}_${content.bimester}`;

  if (content.textContent.trim() !== "" && (!oldContent || content.textContent.trim() !== oldContent.textContent.trim())) {
    addNotification('CONTENT', 'CLASS', content.schoolClass, `Novo planejamento disponível para ${content.bimester}.`, 'CONTENT', contentRefId);
  } else if (content.textContent.trim() === "" && oldContent && oldContent.textContent.trim() !== "") {
    removeNotificationByRef(contentRefId);
  }

  // Cleanup localizadamente para arquivos e avisos
  if (oldContent) {
    oldContent.files.forEach(f => {
      if (!content.files.find(cf => cf.id === f.id)) removeNotificationByRef(`FILE_${f.id}`);
    });
    oldContent.reminders.forEach(r => {
      if (!content.reminders.find(cr => cr.id === r.id)) removeNotificationByRef(`REMINDER_${r.id}`);
    });
  }

  if (content.files.length > (oldContent?.files.length || 0)) {
    const newFile = content.files[content.files.length - 1];
    addNotification('MATERIAL', 'CLASS', content.schoolClass, `Novo material: ${newFile.name}`, 'MATERIALS', `FILE_${newFile.id}`);
  }
  if (content.reminders.length > (oldContent?.reminders.length || 0)) {
    const newReminder = content.reminders[content.reminders.length - 1];
    addNotification('REMINDER', 'CLASS', content.schoolClass, `Novo aviso no mural: ${newReminder.text.substring(0, 20)}${newReminder.text.length > 20 ? '...' : ''}`, 'CALENDAR', `REMINDER_${newReminder.id}`);
  }

  if (index >= 0) allContent[index] = content;
  else allContent.push(content);
  localStorage.setItem(CONTENT_KEY, JSON.stringify(allContent));
  syncService.syncClassContent(content).catch(console.error);
};

export const updateActivityGrade = (studentId: string, bimester: Bimester, activity: Activity) => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === studentId);
  if (index > -1) {
    const oldScore = students[index].bimesterGrades[bimester].find(a => a.id === activity.id)?.score;
    students[index].bimesterGrades[bimester] = students[index].bimesterGrades[bimester].map(a => a.id === activity.id ? activity : a);
    saveStudents(students);

    if (oldScore !== activity.score && activity.score !== null) {
      addNotification('GRADE', 'STUDENT', studentId, `Sua nota em ${activity.title} foi atualizada.`, 'GRADES');
    } else {
      const oldRecovery = students[index].bimesterGrades[bimester].find(a => a.id === activity.id)?.recoveryScore;
      if (oldRecovery !== activity.recoveryScore && activity.recoveryScore !== null) {
        addNotification('GRADE', 'STUDENT', studentId, `Sua nota de recuperação em ${activity.title} foi atualizada.`, 'GRADES');
      }
    }
    const updatedStudent = students[index];

    // Sync with auth session if needed
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.id === studentId && currentUser.role === UserRole.STUDENT) {
      authService.persistUser({ ...currentUser, studentData: updatedStudent });
    }

    return updatedStudent;
  }
  throw new Error('Estudante não encontrado');
};

export const bulkUpdateGrades = (updates: { studentId: string, bimester: Bimester, activityId: number, score: number | null }[]) => {
  const students = getStudents();
  let updatedCount = 0;

  updates.forEach(update => {
    const index = students.findIndex(s => s.id === update.studentId);
    if (index > -1) {
      const activityIndex = students[index].bimesterGrades[update.bimester].findIndex(a => a.id === update.activityId);
      if (activityIndex > -1) {
        const oldScore = students[index].bimesterGrades[update.bimester][activityIndex].score;
        students[index].bimesterGrades[update.bimester][activityIndex].score = update.score;

        if (oldScore !== update.score && update.score !== null) {
          addNotification('GRADE', 'STUDENT', update.studentId, `Sua nota em ${students[index].bimesterGrades[update.bimester][activityIndex].title} foi atualizada.`, 'GRADES');
        }
        updatedCount++;
      }
    }
  });

  if (updatedCount > 0) {
    saveStudents(students);
  }
  return updatedCount;
};

export const registerStudent = (name: string, email: string, password: string, schoolClass: SchoolClass, birthDate: string, biologicalSex: BiologicalSex, residenceType: ResidenceType, isMonitor: boolean = false, avatarUrl?: string) => {
  const students = getStudents();
  if (students.find(s => s.email === email)) throw new Error("Email já cadastrado.");

  // Initialize grades using the current class configuration if available
  const bimesterGrades: Record<Bimester, Activity[]> = {
    '1º Bimestre': createDefaultActivities(),
    '2º Bimestre': createDefaultActivities(),
    '3º Bimestre': createDefaultActivities(),
    '4º Bimestre': createDefaultActivities(),
  };

  // Apply existing configurations for the class to the new student
  BIMESTERS.forEach(bim => {
    const configs = getClassActivityConfigs(schoolClass, bim);
    if (configs) {
      bimesterGrades[bim] = bimesterGrades[bim].map(act => {
        const conf = configs.find(c => c.id === act.id);
        return conf ? { ...act, title: conf.title, description: conf.description, maxScore: conf.maxScore, hasRecovery: conf.hasRecovery } : act;
      });
    }
  });

  const newStudent: Student = {
    id: Math.random().toString(36).substr(2, 9),
    name, email, password, schoolClass, birthDate, biologicalSex, residenceType, isMonitor, avatarUrl,
    biologicalLevel: 'ORGANELLE',
    personalReminders: [], personalMaterials: [], bimesterGrades
  };
  students.push(newStudent);
  saveStudents(students);
  return newStudent;
};

export const deleteStudent = (studentId: string) => {
  const students = getStudents();
  const updated = students.filter(s => s.id !== studentId);
  if (students.length !== updated.length) {
    saveStudents(updated);

    // Se o aluno deletado for o atual, limpa a sessão (opcional, dependendo de como o auth lida com isso)
    const currentUser = authService.getCurrentUser();
    if (currentUser?.id === studentId) {
      authService.logout();
    }
  }
};

export const updateStudent = (id: string, updates: any) => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === id);
  if (index === -1) throw new Error("Aluno não encontrado");
  students[index] = { ...students[index], ...updates };
  saveStudents(students);
  const updatedStudent = students[index];

  // Sync with Supabase Auth if sensitive data changed
  if (updates.password || updates.name || updates.email) {
    authService.updateUserAuth(id, {
      password: updates.password,
      name: updates.name,
      email: updates.email
    }).catch(console.error);
  }

  // Sync with auth session if needed
  const currentUser = authService.getCurrentUser();
  if (currentUser && currentUser.id === id && currentUser.role === UserRole.STUDENT) {
    authService.persistUser({ ...currentUser, studentData: updatedStudent });
  }

  return updatedStudent;
};

export const getTeachers = (): Teacher[] => {
  const data = localStorage.getItem(TEACHERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const registerTeacher = (name: string, email: string, password: string) => {
  const teachers = getTeachers();
  if (teachers.length > 0) throw new Error("Apenas um professor permitido.");
  const newTeacher: Teacher = { id: Math.random().toString(36).substr(2, 9), name, email, password };
  teachers.push(newTeacher);
  localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers));
  return newTeacher;
};

export const addPersonalReminder = (studentId: string, text: string, date?: string, authorName?: string) => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === studentId);
  if (index !== -1) {
    if (!students[index].personalReminders) students[index].personalReminders = [];
    students[index].personalReminders!.push({
      id: Math.random().toString(36).substr(2, 9),
      text,
      date,
      createdAt: new Date().toISOString(),
      createdBy: authorName
    });
    saveStudents(students);
    addNotification('REMINDER', 'STUDENT', studentId, `Aviso exclusivo enviado para você.`, 'CALENDAR');
  }
};

export const removePersonalReminder = (studentId: string, reminderId: string) => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === studentId);
  if (index !== -1 && students[index].personalReminders) {
    students[index].personalReminders = students[index].personalReminders!.filter(r => r.id !== reminderId);
    saveStudents(students);
  }
};

export const addPersonalMaterial = (studentId: string, material: FileAttachment, authorName?: string) => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === studentId);
  if (index !== -1) {
    if (!students[index].personalMaterials) students[index].personalMaterials = [];
    students[index].personalMaterials!.push({ ...material, createdBy: authorName });
    saveStudents(students);
    addNotification('MATERIAL', 'STUDENT', studentId, `Arquivo individual enviado para você.`, 'MATERIALS');
  }
};

export const removePersonalMaterial = (studentId: string, materialId: string) => {
  const students = getStudents();
  const index = students.findIndex(s => s.id === studentId);
  if (index !== -1 && students[index].personalMaterials) {
    students[index].personalMaterials = students[index].personalMaterials!.filter(m => m.id !== materialId);
    saveStudents(students);
  }
};

// Forum Methods
export const getForumPosts = (schoolClass: SchoolClass, bimester: Bimester): ForumPost[] => {
  const data = localStorage.getItem(FORUM_POSTS_KEY);
  const allPosts: ForumPost[] = data ? JSON.parse(data) : [];
  return allPosts.filter(p => p.schoolClass === schoolClass && p.bimester === bimester).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const saveForumPost = (post: ForumPost) => {
  const data = localStorage.getItem(FORUM_POSTS_KEY);
  const allPosts: ForumPost[] = data ? JSON.parse(data) : [];
  allPosts.push(post);
  localStorage.setItem(FORUM_POSTS_KEY, JSON.stringify(allPosts));
  syncService.syncForumPost(post).catch(console.error);
};

export const deleteForumPost = (postId: string) => {
  const data = localStorage.getItem(FORUM_POSTS_KEY);
  if (!data) return;

  try {
    const allPosts: ForumPost[] = JSON.parse(data);
    const initialCount = allPosts.length;

    // Convert to string and trim for safe comparison
    const targetId = String(postId).trim();
    const updated = allPosts.filter(p => String(p.id).trim() !== targetId);

    if (updated.length !== initialCount) {
      localStorage.setItem(FORUM_POSTS_KEY, JSON.stringify(updated));
      syncService.syncDeleteForumPost(postId).catch(console.error);
    }
  } catch (error) {
    console.error("[DataService] Error deleting forum post:", error);
  }
};

export const getForumSettings = (schoolClass: SchoolClass, bimester: Bimester): ForumSettings => {
  const data = localStorage.getItem(FORUM_SETTINGS_KEY);
  const allSettings = data ? JSON.parse(data) : {};
  const key = `${schoolClass}_${bimester}`;
  return allSettings[key] || { isEnabled: false };
};

export const saveForumSettings = (schoolClass: SchoolClass, bimester: Bimester, settings: ForumSettings) => {
  const data = localStorage.getItem(FORUM_SETTINGS_KEY);
  const allSettings = data ? JSON.parse(data) : {};
  const key = `${schoolClass}_${bimester}`;
  allSettings[key] = settings;
  localStorage.setItem(FORUM_SETTINGS_KEY, JSON.stringify(allSettings));
  syncService.syncForumSettings?.(schoolClass, bimester, settings).catch(console.error);
};

// Rank Helpers
export const getStudentRanksForClass = (schoolClass: SchoolClass, bimester: Bimester): Record<string, number> => {
  const students = getStudents().filter(s => s.schoolClass === schoolClass);
  const sorted = students.sort((a, b) => {
    const scoreA = a.bimesterGrades[bimester].reduce((sum, act) => sum + (act.hasRecovery ? Math.max(act.score || 0, act.recoveryScore || 0) : (act.score || 0)), 0);
    const scoreB = b.bimesterGrades[bimester].reduce((sum, act) => sum + (act.hasRecovery ? Math.max(act.score || 0, act.recoveryScore || 0) : (act.score || 0)), 0);
    return scoreB - scoreA;
  });

  const ranks: Record<string, number> = {};
  sorted.forEach((s, index) => {
    ranks[s.id] = index;
  });
  return ranks;
};
