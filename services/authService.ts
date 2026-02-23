import { User, UserRole } from '../types';
import { supabase, supabaseAdmin } from './supabaseClient';

const AUTH_USER_KEY = 'biograde_auth_user_2026';

export const authService = {
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(AUTH_USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Error parsing auth user', e);
      return null;
    }
  },

  login: async (email: string, password: string, role: UserRole): Promise<User> => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      throw new Error('Credenciais inválidas.');
    }

    // Buscar perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Perfil não encontrado no banco de dados.');
    }

    const profileAppRole = (profile.role === 'teacher' ? UserRole.TEACHER : UserRole.STUDENT) as any as UserRole;

    // @ts-ignore: TS doesn't think MONITOR overlaps but we check it anyway
    if (profileAppRole !== (role as any) && role !== UserRole.MONITOR) {
      // Allowed role exception for monitors who are technically students
      if (!((role as any) === UserRole.MONITOR && profileAppRole === UserRole.STUDENT)) {
        throw new Error(`Acesso negado. Você não é um ${role}.`);
      }
    }

    let user: User = {
      id: profile.id,
      name: profile.name,
      role: role, // Keep the requested role if monitor check passed
      permissions: {
        canEditGrades: false, canManageMaterials: false, canManageContent: false, canManageMural: false, canLogin: true
      }
    };

    if (profileAppRole === UserRole.TEACHER) {
      const { data: teacherMeta } = await supabase.from('teachers').select('*').eq('id', profile.id).single();
      user.permissions = {
        canEditGrades: true, canManageMaterials: true, canManageContent: true, canManageMural: true, canLogin: true
      };
    } else {
      const { data: studentMeta } = await supabase.from('students').select('*').eq('id', profile.id).single();
      if (studentMeta) {
        user.studentData = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          password: '', // do not store
          schoolClass: studentMeta.school_class,
          birthDate: studentMeta.birth_date,
          biologicalSex: studentMeta.biological_sex,
          residenceType: studentMeta.residence_type,
          isMonitor: studentMeta.is_monitor,
          avatarUrl: studentMeta.avatar_url,
          biologicalLevel: studentMeta.biological_level || 'ATOM',
          bimesterGrades: {
            '1º Bimestre': [],
            '2º Bimestre': [],
            '3º Bimestre': [],
            '4º Bimestre': []
          }
        };

        // Setup monitor permissions if applies
        let isMonitor = studentMeta.is_monitor;
        if (role === UserRole.MONITOR) {
          if (!isMonitor) throw new Error('Acesso negado. Você não é Monitor.');
          // Fake full permissions for now until we migrate settings
          user.permissions = {
            canLogin: true, canEditGrades: false, canManageMaterials: true, canManageContent: true, canManageMural: true
          };
        }
      }
    }

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    return user;
  },

  // Used when users self-register (Login screen)
  register: async (email: string, password: string, role: UserRole, name: string, studentMeta?: any): Promise<void> => {
    const dbRole = role === UserRole.TEACHER ? 'teacher' : 'student';

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: dbRole
        }
      }
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (authData.user && role === UserRole.STUDENT && studentMeta) {
      // The trigger creates the profile. We just need to insert the student record.
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          id: authData.user.id,
          school_class: studentMeta.schoolClass,
          birth_date: studentMeta.birthDate,
          biological_sex: studentMeta.biologicalSex,
          residence_type: studentMeta.residenceType,
          is_monitor: false,
          biological_level: 'ORGANELLE'
        });

      if (studentError) {
        console.error('Error inserting student metadata', studentError);
      }
    }
  },

  // Used by Teachers/Admins to create users without overriding their own session
  registerAdmin: async (email: string, password: string, role: UserRole, name: string, studentMeta?: any): Promise<void> => {
    const dbRole = role === UserRole.TEACHER ? 'teacher' : 'student';

    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: dbRole
        }
      }
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (authData.user && role === UserRole.STUDENT && studentMeta) {
      const { error: studentError } = await supabaseAdmin
        .from('students')
        .insert({
          id: authData.user.id,
          school_class: studentMeta.schoolClass,
          birth_date: studentMeta.birthDate,
          biological_sex: studentMeta.biologicalSex,
          residence_type: studentMeta.residenceType,
          is_monitor: studentMeta.isMonitor || false,
          biological_level: 'ORGANELLE'
        });

      if (studentError) {
        console.error('Error inserting student metadata via Admin', studentError);
        throw new Error('Estudante criado no Auth, mas erro ao salvar metadados.');
      }
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(AUTH_USER_KEY);
  },

  // Updates user profile in Auth (name, password, email) using Admin Client
  // This is required when a teacher updates a student's data
  updateUserAuth: async (id: string, updates: { password?: string; name?: string; email?: string }): Promise<void> => {
    const authUpdates: any = {};
    if (updates.password) authUpdates.password = updates.password;
    if (updates.email) authUpdates.email = updates.email;
    if (updates.name) {
      if (!authUpdates.data) authUpdates.data = {};
      authUpdates.data.name = updates.name;
    }

    if (Object.keys(authUpdates).length === 0) return;

    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdates);
    if (error) {
      console.error('Error updating user auth via admin:', error);
      throw new Error(`Erro ao atualizar credenciais: ${error.message}`);
    }

    // Also update profiles table if name/email changed to ensure consistency
    if (updates.name || updates.email) {
      const profileUpdates: any = {};
      if (updates.name) profileUpdates.name = updates.name;
      if (updates.email) profileUpdates.email = updates.email;

      const { error: pErr } = await supabase.from('profiles').update(profileUpdates).eq('id', id);
      if (pErr) console.error('Error updating profile table:', pErr);
    }
  },

  persistUser: (user: User) => {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  },

  checkTeacherExists: async (): Promise<boolean> => {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'teacher');

    if (error) {
      console.error('Error checking for teachers:', error);
      return false;
    }
    return (count && count > 0) ? true : false;
  }
};
