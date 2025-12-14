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
      
      // Pick skills from the first two clusters (assume ordered by difficulty)
      const clusters = Object.keys(clusterGroups).slice(0, 2);
      clusters.forEach(cluster => {
        const clusterSkillIds = clusterGroups[cluster].slice(0, 2); // Max 2 skills per cluster
        weakSkillIds.push(...clusterSkillIds);
      });
    }
  });
  
  return weakSkillIds.slice(0, 5); // Return max 5 skills
}