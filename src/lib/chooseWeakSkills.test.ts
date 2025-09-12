import { describe, it, expect } from 'vitest';
import { chooseWeakSkills, BaselineDiagnostic, ProgressData, Skill } from './chooseWeakSkills';

const mockSkills: Skill[] = [
  { id: 'skill1', subject: 'math', cluster: 'algebra', name: 'Linear Equations' },
  { id: 'skill2', subject: 'math', cluster: 'algebra', name: 'Quadratic Equations' },
  { id: 'skill3', subject: 'math', cluster: 'geometry', name: 'Triangles' },
  { id: 'skill4', subject: 'math', cluster: 'geometry', name: 'Circles' },
  { id: 'skill5', subject: 'english', cluster: 'grammar', name: 'Subject-Verb Agreement' },
  { id: 'skill6', subject: 'english', cluster: 'grammar', name: 'Punctuation' },
];

describe('chooseWeakSkills', () => {
  it('returns empty array when no sparse progress', () => {
    const baseline: BaselineDiagnostic[] = [
      { section: 'math', score: 0.5, source: 'diagnostic' }
    ];
    const progress: ProgressData[] = [
      { skill_id: 'skill1', seen: 25, mastery_level: 2, correct: 20 }
    ];
    
    const result = chooseWeakSkills(baseline, progress, mockSkills);
    expect(result).toEqual([]);
  });

  it('returns empty array when no baseline diagnostics', () => {
    const baseline: BaselineDiagnostic[] = [];
    const progress: ProgressData[] = [
      { skill_id: 'skill1', seen: 10, mastery_level: 1, correct: 5 }
    ];
    
    const result = chooseWeakSkills(baseline, progress, mockSkills);
    expect(result).toEqual([]);
  });

  it('returns empty array when baseline scores are high', () => {
    const baseline: BaselineDiagnostic[] = [
      { section: 'math', score: 0.8, source: 'diagnostic' }
    ];
    const progress: ProgressData[] = [
      { skill_id: 'skill1', seen: 10, mastery_level: 1, correct: 5 }
    ];
    
    const result = chooseWeakSkills(baseline, progress, mockSkills);
    expect(result).toEqual([]);
  });

  it('returns weak skills from bottom two clusters when baseline is low', () => {
    const baseline: BaselineDiagnostic[] = [
      { section: 'math', score: 0.5, source: 'diagnostic' }
    ];
    const progress: ProgressData[] = [
      { skill_id: 'skill1', seen: 10, mastery_level: 1, correct: 5 }
    ];
    
    const result = chooseWeakSkills(baseline, progress, mockSkills);
    
    // Should include skills from first two clusters (algebra, geometry)
    expect(result).toHaveLength(4);
    expect(result).toContain('skill1'); // algebra
    expect(result).toContain('skill2'); // algebra
    expect(result).toContain('skill3'); // geometry
    expect(result).toContain('skill4'); // geometry
  });

  it('handles multiple sections with low scores', () => {
    const baseline: BaselineDiagnostic[] = [
      { section: 'math', score: 0.4, source: 'diagnostic' },
      { section: 'english', score: 0.3, source: 'self' }
    ];
    const progress: ProgressData[] = [
      { skill_id: 'skill1', seen: 15, mastery_level: 0, correct: 3 },
      { skill_id: 'skill5', seen: 8, mastery_level: 1, correct: 2 }
    ];
    
    const result = chooseWeakSkills(baseline, progress, mockSkills);
    
    // Should include skills from both math and english sections
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(id => mockSkills.find(s => s.id === id)?.subject === 'math')).toBe(true);
    expect(result.some(id => mockSkills.find(s => s.id === id)?.subject === 'english')).toBe(true);
  });

  it('limits output to maximum 5 skills', () => {
    const largeSkillSet: Skill[] = Array.from({ length: 20 }, (_, i) => ({
      id: `skill${i}`,
      subject: 'math',
      cluster: `cluster${Math.floor(i / 3)}`,
      name: `Skill ${i}`
    }));

    const baseline: BaselineDiagnostic[] = [
      { section: 'math', score: 0.2, source: 'diagnostic' }
    ];
    const progress: ProgressData[] = [
      { skill_id: 'skill1', seen: 5, mastery_level: 0, correct: 1 }
    ];
    
    const result = chooseWeakSkills(baseline, progress, largeSkillSet);
    expect(result).toHaveLength(5);
  });

  it('only includes skills from sections with low baseline scores', () => {
    const baseline: BaselineDiagnostic[] = [
      { section: 'math', score: 0.4, source: 'diagnostic' },
      { section: 'english', score: 0.8, source: 'diagnostic' } // High score
    ];
    const progress: ProgressData[] = [
      { skill_id: 'skill1', seen: 10, mastery_level: 1, correct: 5 }
    ];
    
    const result = chooseWeakSkills(baseline, progress, mockSkills);
    
    // Should only include math skills (english score was high)
    const resultSubjects = result.map(id => mockSkills.find(s => s.id === id)?.subject);
    expect(resultSubjects.every(subject => subject === 'math')).toBe(true);
  });
});