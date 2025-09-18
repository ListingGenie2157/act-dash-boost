// Pure helper function for choosing weak skills from baseline diagnostics
export interface BaselineDiagnostic {
  section: string;
  score: number;
  source: string;
}

export interface ProgressData {
  skill_id: string;
  seen: number;
  mastery_level: number;
  correct: number;
}

export interface Skill {
  id: string;
  subject: string;
  cluster: string;
  name: string;
}

export function chooseWeakSkills(
  baseline: BaselineDiagnostic[],
  progress: ProgressData[],
  allSkills: Skill[]
): string[] {
  const sparseProgress = progress.filter(s => s.seen < 20);
  const weakSkillIds: string[] = [];
  
  if (sparseProgress.length === 0 || baseline.length === 0) {
    return weakSkillIds;
  }
  
  // Process each diagnostic section
  baseline.forEach(diagnostic => {
    if (diagnostic.score < 0.6) { // If less than 60% accuracy
      const sectionSkills = allSkills.filter(s => s.subject === diagnostic.section);
      const clusterGroups: { [cluster: string]: string[] } = {};
      
      // Group skills by cluster
      sectionSkills.forEach(skill => {
        if (!clusterGroups[skill.cluster]) {
          clusterGroups[skill.cluster] = [];
        }
        clusterGroups[skill.cluster].push(skill.id);
      });
      
      // Distribute picks across clusters until we reach 5 total
      const clusters = Object.keys(clusterGroups);
      for (const cluster of clusters) {
        if (weakSkillIds.length >= 5) break;
        const clusterSkillIds = clusterGroups[cluster];
        for (const id of clusterSkillIds) {
          if (weakSkillIds.length >= 5) break;
          weakSkillIds.push(id);
        }
      }
    }
  });
  
  return weakSkillIds.slice(0, 5); // Return max 5 skills
}