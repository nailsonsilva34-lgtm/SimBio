
export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  MONITOR = 'MONITOR', // Novo papel para sessão ativa
}

export type SchoolClass = '1A' | '1B' | '2A' | '2B' | '3A' | '3B';

export const CLASS_LABELS: Record<SchoolClass, string> = {
  '1A': '1ª Série A',
  '1B': '1ª Série B',
  '2A': '2ª Série A',
  '2B': '2ª Série B',
  '3A': '3ª Série A',
  '3B': '3ª Série B',
};

export type ResidenceType = 'URBAN' | 'RURAL';

export const RESIDENCE_LABELS: Record<ResidenceType, string> = {
  'URBAN': 'Zona Urbana',
  'RURAL': 'Zona Rural',
};

export type Bimester = '1º Bimestre' | '2º Bimestre' | '3º Bimestre' | '4º Bimestre';

export const BIMESTERS: Bimester[] = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

export const BIMESTER_DATES: Record<Bimester, { start: string, end: string, rawStart: string, rawEnd: string }> = {
  '1º Bimestre': { start: '10/02/2026', end: '23/04/2026', rawStart: '2026-02-10', rawEnd: '2026-04-23' },
  '2º Bimestre': { start: '24/04/2026', end: '23/07/2026', rawStart: '2026-04-24', rawEnd: '2026-07-23' },
  '3º Bimestre': { start: '24/07/2026', end: '07/10/2026', rawStart: '2026-07-24', rawEnd: '2026-10-07' },
  '4º Bimestre': { start: '08/10/2026', end: '22/12/2026', rawStart: '2026-10-08', rawEnd: '2026-12-22' },
};

export interface Reminder {
  id: string;
  text: string;
  date?: string;
  createdAt: string;
  createdBy?: string; // Quem criou o aviso
}

export interface Activity {
  id: 1 | 2 | 3;
  title: string;
  description?: string;
  score: number | null;
  maxScore: number;
  hasRecovery: boolean;
  recoveryScore: number | null;
}

// Nova interface para armazenar o gabarito/configuração da atividade da turma
export interface ClassActivityConfig {
  id: 1 | 2 | 3;
  title: string;
  description: string;
  maxScore: number;
  hasRecovery: boolean;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: string;
  type: 'PDF' | 'IMAGE' | 'AUDIO' | 'OTHER';
  url: string;
  sentAt: string;
  createdBy?: string; // Quem subiu o arquivo
}

export interface MonitorPermissions {
  canEditGrades: boolean;
  canManageContent: boolean;
  canManageMaterials: boolean;
  canManageMural: boolean;
  canLogin: boolean;
}

export type BiologicalLevel = 'ATOM' | 'MOLECULE' | 'ORGANELLE' | 'CELL' | 'TISSUE' | 'ORGAN' | 'SYSTEM' | 'ORGANISM';

export const BIOLOGICAL_LEVELS: Record<BiologicalLevel, { label: string, icon: string }> = {
  'ATOM': { label: 'Átomo', icon: 'Atom' },
  'MOLECULE': { label: 'Molécula', icon: 'FlaskConical' },
  'ORGANELLE': { label: 'Organela', icon: 'Microscope' },
  'CELL': { label: 'Célula', icon: 'Circle' },
  'TISSUE': { label: 'Tecido', icon: 'Layers' },
  'ORGAN': { label: 'Órgão', icon: 'Heart' },
  'SYSTEM': { label: 'Sistema', icon: 'Network' },
  'ORGANISM': { label: 'Organismo', icon: 'Leaf' },
};

export const BIOLOGICAL_LEVEL_ORDER: BiologicalLevel[] = ['ATOM', 'MOLECULE', 'ORGANELLE', 'CELL', 'TISSUE', 'ORGAN', 'SYSTEM', 'ORGANISM'];

export interface ClassSettings {
  showAverage: boolean;
}

export type BiologicalSex = 'M' | 'F';

export interface Student {
  id: string;
  name: string;
  email: string;
  schoolClass: SchoolClass;
  birthDate: string;
  biologicalSex: BiologicalSex;
  residenceType: ResidenceType;
  password: string;
  isMonitor: boolean;
  avatarUrl?: string; // Mantido para compatibilidade, mas não usado na nova UI
  biologicalLevel: BiologicalLevel; // Novo campo
  personalReminders?: Reminder[];
  personalMaterials?: FileAttachment[];
  bimesterGrades: Record<Bimester, Activity[]>;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  studentData?: Student;
  permissions?: MonitorPermissions; // Permissões caso seja monitor
}

export interface ClassContent {
  schoolClass: SchoolClass;
  bimester: Bimester;
  textContent: string;
  files: FileAttachment[];
  reminders: Reminder[];
  lastEditedBy?: string; // Quem editou o planejamento por último
}

export interface SchoolEvent {
  date: string;
  title: string;
  type: 'HOLIDAY' | 'BIMESTER_START' | 'BIMESTER_END' | 'ACADEMIC';
}

export type NotificationType = 'GRADE' | 'REMINDER' | 'MATERIAL' | 'CONTENT';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  targetType: 'CLASS' | 'STUDENT';
  targetId: string;
  createdAt: string;
  readBy: string[];
  targetSection?: 'GRADES' | 'CALENDAR' | 'MATERIALS' | 'CONTENT';
  refId?: string;
}

export interface ForumPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorLevel?: BiologicalLevel; // Para estudantes
  content: string;
  timestamp: string;
  bimester: Bimester;
  schoolClass: SchoolClass;
}

export interface ForumSettings {
  isEnabled: boolean;
}

export const SCHOOL_CALENDAR_2026: SchoolEvent[] = [
  { date: '2026-01-01', title: 'Confraternização Universal', type: 'HOLIDAY' },
  { date: '2026-02-10', title: 'Início do 1º Bimestre', type: 'BIMESTER_START' },
  { date: '2026-02-16', title: 'Carnaval', type: 'HOLIDAY' },
  { date: '2026-02-17', title: 'Carnaval', type: 'HOLIDAY' },
  { date: '2026-02-18', title: 'Cinzas', type: 'HOLIDAY' },
  { date: '2026-04-03', title: 'Sexta-feira Santa', type: 'HOLIDAY' },
  { date: '2026-04-21', title: 'Tiradentes', type: 'HOLIDAY' },
  { date: '2026-04-23', title: 'Término do 1º Bimestre', type: 'BIMESTER_END' },
  { date: '2026-04-24', title: 'Início do 2º Bimestre', type: 'BIMESTER_START' },
  { date: '2026-05-01', title: 'Dia do Trabalhador', type: 'HOLIDAY' },
  { date: '2026-06-04', title: 'Corpus Christi', type: 'HOLIDAY' },
  { date: '2026-06-24', title: 'São João', type: 'HOLIDAY' },
  { date: '2026-07-23', title: 'Término do 2º Bimestre', type: 'BIMESTER_END' },
  { date: '2026-07-24', title: 'Início do 3º Bimestre', type: 'BIMESTER_START' },
  { date: '2026-09-07', title: 'Independência do Brasil', type: 'HOLIDAY' },
  { date: '2026-10-07', title: 'Término do 3º Bimestre', type: 'BIMESTER_END' },
  { date: '2026-10-08', title: 'Início do 4º Bimestre', type: 'BIMESTER_START' },
  { date: '2026-10-12', title: 'Nossa Senhora Aparecida', type: 'HOLIDAY' },
  { date: '2026-10-15', title: 'Dia do Professor (Ponto Facultativo)', type: 'ACADEMIC' },
  { date: '2026-10-28', title: 'Dia do Servidor Público', type: 'ACADEMIC' },
  { date: '2026-11-02', title: 'Finados', type: 'HOLIDAY' },
  { date: '2026-11-20', title: 'Consciência Negra', type: 'HOLIDAY' },
  { date: '2026-12-22', title: 'Término do 4º Bimestre', type: 'BIMESTER_END' },
  { date: '2026-12-25', title: 'Natal', type: 'HOLIDAY' },
];
