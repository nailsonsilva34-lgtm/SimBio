import { supabase } from './supabaseClient';
import { Student, Teacher, Activity, Bimester, ClassContent, ForumPost, NotificationType } from '../types';

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
                    avatar_url: student.avatarUrl
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
                            id: student.id + '-' + bimester + '-' + grade.id,
                            student_id: student.id,
                            bimester: bimester,
                            title: grade.title,
                            score: grade.score,
                            recovery_score: grade.recoveryScore
                        });
                }
            }
        }
    },

    syncClassContent: async (content: ClassContent) => {
        await supabase.from('planning_content').upsert({
            id: `CONTENT_${content.schoolClass}_${content.bimester}`,
            class_level: content.schoolClass,
            bimester: content.bimester,
            title: 'Planejamento',
            description: content.textContent,
            updated_by_name: content.lastEditedBy || 'Professor'
        });
    },

    syncForumPost: async (post: ForumPost) => {
        await supabase.from('forum_messages').upsert({
            id: post.id,
            text: post.content,
            author_id: post.authorId,
            author_name: post.authorName,
            author_type: post.authorRole === 'TEACHER' ? 'teacher' : 'student',
            date: post.timestamp
        });
    },

    syncDeleteForumPost: async (postId: string) => {
        await supabase.from('forum_messages').delete().eq('id', postId);
    },

    // Busca inicial dos dados do App Load
    pullInitialData: async () => {
        try {
            const { data: studentsData } = await supabase.from('students').select(`
              *,
              profiles (name, email)
          `);

            if (studentsData && studentsData.length > 0) {
                const localStudents: Student[] = studentsData.map(row => ({
                    id: row.id,
                    name: row.profiles.name,
                    email: row.profiles.email,
                    password: '',
                    schoolClass: row.school_class,
                    birthDate: row.birth_date,
                    biologicalSex: row.biological_sex,
                    residenceType: row.residence_type,
                    isMonitor: row.is_monitor,
                    avatarUrl: row.avatar_url,
                    biologicalLevel: 'ATOM',
                    bimesterGrades: {
                        '1º Bimestre': [],
                        '2º Bimestre': [],
                        '3º Bimestre': [],
                        '4º Bimestre': []
                    }
                }));

                const { data: gradesData } = await supabase.from('bimester_grades').select('*');
                if (gradesData) {
                    for (const grade of gradesData) {
                        const student = localStudents.find(s => s.id === grade.student_id);
                        if (student && student.bimesterGrades[grade.bimester]) {
                            // Try to parse the ID from the concatenated string, or assign sequentially
                            const activityId = parseInt(grade.id.split('-').pop()) || 1;
                            student.bimesterGrades[grade.bimester].push({
                                id: activityId as any,
                                title: grade.title,
                                score: grade.score,
                                recoveryScore: grade.recovery_score,
                                maxScore: 10,
                                hasRecovery: false
                            });
                        }
                    }
                }

                localStorage.setItem('biograde_students_2026', JSON.stringify(localStudents));
            }

            return true;
        } catch (e) {
            console.error('Error fetching Supabase Sync:', e);
            return false;
        }
    }
};
