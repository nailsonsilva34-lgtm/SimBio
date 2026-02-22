
import { GoogleGenAI } from "@google/genai";
import { Student, BIMESTERS } from "../types";

// Helper to generate a report for a student using Gemini
export const generateStudentReport = async (student: Student) => {
  // Always use the process.env.API_KEY directly and use named parameter
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  // Flatten grades for the prompt
  let gradesSummary = '';
  
  BIMESTERS.forEach(bim => {
    const acts = student.bimesterGrades[bim];
    const hasData = acts.some(a => a.score !== null);
    
    if (hasData) {
        gradesSummary += `\n${bim}:\n`;
        acts.forEach(a => {
            if (a.score !== null) {
                const final = a.hasRecovery ? Math.max(a.score || 0, a.recoveryScore || 0) : a.score;
                gradesSummary += `- ${a.title}: Nota Final ${final} (Original: ${a.score}${a.hasRecovery ? `, Recuperação: ${a.recoveryScore}` : ''})\n`;
            }
        });
    }
  });

  if (!gradesSummary) gradesSummary = "O aluno ainda não possui notas lançadas.";

  const prompt = `
    Você é um professor de biologia experiente no sistema de ensino da Paraíba.
    Analise o desempenho do aluno abaixo e forneça um breve relatório (máximo de 3 parágrafos) para o professor.
    Destaque os pontos fortes e áreas que precisam de atenção.
    Considere que a média para aprovação é 6.0.
    Seja construtivo e profissional.
    
    Aluno: ${student.name}
    Turma: ${student.schoolClass}
    
    Histórico de Notas:
    ${gradesSummary}
  `;

  try {
    // Correct usage: call generateContent directly on ai.models
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Use .text property directly
    return response.text;
  } catch (error) {
    console.error("Error generating report:", error);
    return "Não foi possível gerar o relatório no momento. Tente novamente mais tarde.";
  }
};
