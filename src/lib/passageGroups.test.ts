import { describe, it, expect } from 'vitest';
import { sharePassages } from './passageGroups';

describe('sharePassages', () => {
  it('gives every question in a group the passage stored on one of them', () => {
    const out = sharePassages([
      { id: '1', passage_id: 'P1', passage_title: 'Night Cycle', passage_text: 'Text 1' },
      { id: '2', passage_id: 'P1', passage_title: null, passage_text: null },
      { id: '3', passage_id: 'P2', passage_title: undefined, passage_text: '' },
      { id: '4', passage_id: 'P2', passage_title: 'Buses', passage_text: 'Text 2' },
    ]);
    expect(out.map(q => q.passage_text)).toEqual(['Text 1', 'Text 1', 'Text 2', 'Text 2']);
    expect(out.map(q => q.passage_title)).toEqual(['Night Cycle', 'Night Cycle', 'Buses', 'Buses']);
  });

  it('leaves standalone questions and placeholder ids alone', () => {
    const out = sharePassages([
      { id: '1', passage_id: null, passage_text: null },
      { id: '2', passage_id: 'nan', passage_text: 'own text' },
      { id: '3', passage_id: 'nan', passage_text: null },
    ]);
    expect(out.map(q => q.passage_text)).toEqual([null, 'own text', null]);
  });
});
