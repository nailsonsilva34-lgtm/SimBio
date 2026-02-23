import { supabase } from './supabaseClient';
import { Student, Teacher, Activity, Bimester, ClassContent, ForumPost, NotificationType, ClassActivityConfig, ClassSettings, ForumSettings, SchoolClass, UserRole } from '../types';

export const syncService = {
    syncStudents: async (students: Student[]) => {
        // Para simplificar a migração e garantir a integridade dos atributos aninhados (notas, avisos),
        // atualizaremos sequencialmente
        for (const student of students) {
            // Atualiza a tabela relacional students base
            const { error: studentError } = await supabase
                .from('students')
                .upsert({
                    id: student.id,
                    school_class: student.schoolClass,
                    birth_date: student.birthDate,
                    biological_sex: student.biologicalSex,
                    residence_type: student.residenceType,
                    is_monitor: student.isMonitor,
                    avatar_url: student.avatarUrl,
                    biological_level: student.biologicalLevel || 'ORGANELLE',
                    personal_reminders: student.personalReminders || [],
                    personal_materials: student.personalMaterials || []
                });

            if (studentError) {
                console.error('Fast-Sync Error (Student):', studentError);
            }

            // Atualiza as notas no formato relacional
            for (const [bimester, grades] of Object.entries(student.bimesterGrades)) {
                for (const grade of grades) {
                    await supabase
                        .from('bimester_grades')
                        .upsert({
                            student_id: student.id,
                            bimester: bimester,
                            activity_id: grade.id,
                            title: grade.title,
                            score: grade.score,
                            max_score: grade.maxScore,
                            has_recovery: grade.hasRecovery,
                            recovery_score: grade.recoveryScore
                        }, {
                            onConflict: 'student_id,bimester,activity_id'
                        });
                }
            }
        }
    },

    syncClassContent: async (content: ClassContent) => {
        await supabase.from('planning_content').upsert({
            school_class: content.schoolClass,
            bimester: content.bimester,
            title: 'Planejamento',
            description: content.textContent,
            reminders: content.reminders || [],
            files: content.files || []
        }, {
            onConflict: 'school_class,bimester'
        });
    },

    syncForumPost: async (post: ForumPost) => {
        await supabase.from('forum_messages').upsert({
            id: post.id,
            message: post.content,
            user_id: post.authorId,
            bimester: post.bimester,
            school_class: post.schoolClass,
            created_at: post.timestamp
        });
    },

    syncDeleteForumPost: async (postId: string) => {
        await supabase.from('forum_messages').delete().eq('id', postId);
    },

    syncActivityConfigs: async (schoolClass: SchoolClass, bimester: Bimester, configs: ClassActivityConfig[]) => {
        for (const config of configs) {
            await supabase.from('activity_configs').upsert({
                school_class: schoolClass,
                bimester: bimester,
                activity_id: config.id,
                title: config.title,
                description: config.description,
                max_score: config.maxScore,
                has_recovery: config.hasRecovery
            });
        }
    },

    syncClassSettings: async (schoolClass: SchoolClass, bimester: Bimester, settings: ClassSettings) => {
        await supabase.from('class_settings').upsert({
            school_class: schoolClass,
            bimester: bimester,
            show_average: settings.showAverage
        });
    },

    syncForumSettings: async (schoolClass: SchoolClass, bimester: Bimester, settings: ForumSettings) => {
        await supabase.from('forum_settings').upsert({
            school_class: schoolClass,
            bimester: bimester,
            is_enabled: settings.isEnabled
        });
    },

    // Busca inicial dos dados do App Load
    pullInitialData: async () => {
        try {
            console.log('Supabase Sync starting...');
            const { data: studentsData, error: sErr } = await supabase.from('students').select(`
              *,
              profiles (name, email)
          `);

            if (studentsData && studentsData.length > 0) {
                const localStudents: Student[] = studentsData.map(row => {
                    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
                    return {
                        id: row.id,
                        name: profile?.name || 'Sem Nome',
                        email: profile?.email || '',
                        password: '',
                        schoolClass: row.school_class,
                        birthDate: row.birth_date,
                        biologicalSex: row.biological_sex,
                        residenceType: row.residence_type,
                        isMonitor: row.is_monitor,
                        avatarUrl: row.avatar_url,
                        biologicalLevel: row.biological_level || 'ORGANELLE',
                        personalReminders: row.personal_reminders || [],
                        personalMaterials: row.personal_materials || [],
                        bimesterGrades: {
                            '1º Bimestre': [
                                { id: 1, title: 'Atividade 1', score: null, maxScore: 10, hasRecovery: false, recoveryScore: null },
                                { id: 2, title: 'Atividade 2', score: null, maxScore: 10, hasRecovery: false, recoveryScore: null },
                                { id: 3, title: 'Atividade 3', score: null, maxScore: 10, hasRecovery: false, recoveryScore: null },
                            ],
                            '2º Bimestre': [
                                { id: 1, title: 'Atividade 1', score: null, maxScore: 10, hasRecovery: false, recoveryScore: null },
                                { id: 2, title: 'Atividade 2', score: null, maxScore: 10, hasRecovery: false, recoveryScore: null },
                                { id: 3, title: 'Atividade 3', score: null, maxScore: 10, hasRecovery: false, recoveryScore: null },
                            ],
                            '3º Bimestre': [
                                { id: 1, title: 'Atividade 1', score: null, maxScore: 10, hasRecovery: false, recoveryScore: null },
                                { id: 2, title: 'Atividade 2', score: null, maxScore: 10, hasRecovery: false, recoveryScore: null },
                                { id: 3, title: 'Atividade 3', score: null, maxScore: 10, hasRecovery: false, recoveryScore: null },
                            ],
                            '4º Bimestre': [
                                { id: 1, title: 'Atividade 1', score: null, maxScore: 10, hasRecovery: false, recoveryScore: null },
                                { id: 2, title: 'Atividade 2', score: null, maxScore: 10, hasRecovery: false, recoveryScore: null },
                                { id: 3, title: 'Atividade 3', score: null, maxScore: 10, hasRecovery: false, recoveryScore: null },
                            ]
                        }
                    };
                });

                const { data: gradesData } = await supabase.from('bimester_grades').select('*');
                if (gradesData) {
                    for (const grade of gradesData) {
                        const student = localStudents.find(s => s.id === grade.student_id);
                        if (student && student.bimesterGrades && student.bimesterGrades[grade.bimester as Bimester]) {
                            const bimGrades = student.bimesterGrades[grade.bimester as Bimester];
                            const activityIndex = (grade.activity_id as number) - 1;
                            if (bimGrades[activityIndex]) {
                                bimGrades[activityIndex] = {
                                    id: grade.activity_id as any,
                                    title: grade.title || bimGrades[activityIndex].title,
                                    description: grade.description || '',
                                    score: grade.score,
                                    recoveryScore: grade.recovery_score,
                                    maxScore: grade.max_score || 10,
                                    hasRecovery: grade.has_recovery || false
                                };
                            }
                        }
                    }
                }

                const STUDENTS_KEY = 'biograde_students_2026_v2';
                localStorage.setItem(STUDENTS_KEY, JSON.stringify(localStudents));
                console.log('Students synced');
            }

            // Sync other tables
            const { data: contentData } = await supabase.from('planning_content').select('*');
            if (contentData) {
                const CONTENT_KEY = 'biograde_content_2026_v2';
                const localContent = contentData.map(c => ({
                    schoolClass: c.school_class,
                    bimester: c.bimester,
                    week: c.week,
                    title: c.title,
                    description: c.description,
                    textContent: c.description,
                    files: c.files || [],
                    reminders: c.reminders || []
                }));
                localStorage.setItem(CONTENT_KEY, JSON.stringify(localContent));
            }

            const { data: configData } = await supabase.from('activity_configs').select('*');
            if (configData) {
                const ACTIVITY_CONFIGS_KEY = 'biograde_activity_configs_2026';
                const configs: Record<string, any> = {};
                configData.forEach(c => {
                    const key = `${c.school_class}_${c.bimester}`;
                    if (!configs[key]) configs[key] = [];
                    configs[key].push({
                        id: c.activity_id,
                        title: c.title,
                        description: c.description,
                        maxScore: c.max_score,
                        hasRecovery: c.has_recovery
                    });
                });
                localStorage.setItem(ACTIVITY_CONFIGS_KEY, JSON.stringify(configs));
            }

            const { data: forumData } = await supabase.from('forum_messages').select('*, profiles(name, role)');
            if (forumData) {
                const FORUM_POSTS_KEY = 'biograde_forum_posts_2026';
                const posts = forumData.map(f => {
                    const profile = Array.isArray(f.profiles) ? f.profiles[0] : f.profiles;
                    return {
                        id: f.id,
                        authorId: f.user_id,
                        authorName: profile?.name || 'Sistema',
                        authorRole: (profile?.role === 'teacher' ? UserRole.TEACHER : UserRole.STUDENT),
                        content: f.message,
                        timestamp: f.created_at,
                        bimester: f.bimester,
                        schoolClass: f.school_class
                    };
                });
                localStorage.setItem(FORUM_POSTS_KEY, JSON.stringify(posts));
            }

            console.log('Supabase Sync complete!');
            return true;
        } catch (e) {
            console.error('CRITICAL: Error fetching Supabase Sync:', e);
            throw e; // Rethrow to let App.tsx handle it with screen error
        }
    }
};
