// Temporary script to import lesson E1.C
import { supabase } from '@/integrations/supabase/client';

export async function importLessonE1C() {
  const lessonData = {
    skill_code: 'E1.C',
    overview_html: 'By the end of this lesson, you will choose the correct verb form, keep voice (active vs passive) clear, and avoid common ACT verb errors like tense shifts, weak passive, and subject-verb mismatch.',
    concept_explanation: `<h3>Core idea 1: Verb tense must match time</h3>
<p>Do not change tense unless the timeline actually changes.</p>
<p><strong>Simple past:</strong> finished in the past. "She walked."</p>
<p><strong>Simple present:</strong> general truth or routine. "She walks every day."</p>
<p><strong>Present perfect:</strong> has/have + past participle for something that began in the past and still matters now. "She has lived here for five years."</p>
<p><strong>Past perfect:</strong> had + past participle to mark an earlier past event before a later past event. "She had left before we arrived."</p>
<p><strong>Signal words:</strong> "yesterday," "last year" → past. "now," "today," "usually" → present. "by the time," "already" (in past narration) → past perfect.</p>

<h3>Core idea 2: Voice (active vs passive)</h3>
<p><strong>Active voice:</strong> subject does the action. "The coach praised the team."</p>
<p><strong>Passive voice:</strong> subject receives the action. "The team was praised by the coach."</p>
<p>ACT usually prefers active voice because it is shorter and clearer. Passive is acceptable if the doer is unknown or irrelevant ("The window was broken") or if the focus is on the receiver ("The suspect was arrested at 8 p.m."). Red flag for passive: was / were + past participle + "by …"</p>

<h3>Core idea 3: Consistency across clauses</h3>
<p>All verbs that describe the same time frame should match.</p>
<p><strong>Wrong:</strong> "The committee approves the plan and was announcing it yesterday."</p>
<p><strong>Fix:</strong> "The committee announced the plan and issued permits yesterday." (all past)</p>
<p><strong>Or:</strong> "The committee approves the plan and announces it today." (all present)</p>

<h3>Core idea 4: Subject-verb agreement in present tense</h3>
<p><strong>Singular subject → singular verb:</strong> "The list is long."</p>
<p><strong>Plural subject → plural verb:</strong> "The lists are long."</p>
<p>Do not let interrupting phrases confuse you. "The results of the experiment show…" (not "shows").</p>`,
    objectives: [
      'Maintain consistent tense across and within sentences',
      'Choose active vs passive voice for clarity',
      'Apply subject-verb agreement even with distracting phrases',
      'Use past perfect only when comparing two past moments',
      'Recognize and fix weak or wordy passive voice'
    ],
    guided_practice: `<h4>Worked example 1</h4>
<p><strong>Incorrect:</strong> "The researchers collect data last summer and published their findings in August."</p>
<p><strong>Correct:</strong> "The researchers collected data last summer and published their findings in August."</p>
<p><strong>Why:</strong> "last summer" = past. Both verbs must be past. "collect" → "collected."</p>

<h4>Worked example 2</h4>
<p><strong>Incorrect:</strong> "By the time we arrived, the show has already started."</p>
<p><strong>Correct:</strong> "By the time we arrived, the show had already started."</p>
<p><strong>Why:</strong> Two past actions. Past perfect ("had started") marks the earlier one.</p>

<h4>Worked example 3</h4>
<p><strong>Incorrect:</strong> "The bridge was repaired by the crew overnight."</p>
<p><strong>Better:</strong> "The crew repaired the bridge overnight."</p>
<p><strong>Why:</strong> Active is shorter and names who acted. ACT prefers this if the subject matters.</p>

<h4>Worked example 4</h4>
<p><strong>Incorrect:</strong> "The city announces a new policy and was issuing permits yesterday."</p>
<p><strong>Correct:</strong> "The city announced a new policy and issued permits yesterday."</p>
<p><strong>Why:</strong> "yesterday" locks you into past tense for both verbs.</p>

<h4>Worked example 5</h4>
<p><strong>Incorrect:</strong> "Each of the players are required to attend practice."</p>
<p><strong>Correct:</strong> "Each of the players is required to attend practice."</p>
<p><strong>Why:</strong> The real subject is "Each," which is singular.</p>`,
    error_analysis: `<p><strong>Fake tense shifts:</strong> "The experiment was successful and shows that the treatment works." Problem: "was" (past) vs "shows" (present). Fix: "was successful and showed that the treatment worked."</p>
<p><strong>Unnecessary passive:</strong> "The award was presented by the committee to the student." Cleaner: "The committee presented the award to the student." ACT favors direct, named subject when possible.</p>
<p><strong>Past perfect abuse:</strong> "She had finished her homework and then watched TV." If events happened in normal order, simple past is enough: "She finished her homework and then watched TV." Use "had" only to mark an earlier past before a later past.</p>
<p><strong>Interrupter confusion:</strong> "The pile of boxes were blocking the door." Real subject is "pile" (singular). Correct: "The pile of boxes was blocking the door."</p>
<p><strong>Passive with missing agent:</strong> "The rules were changed." On ACT, if blame or credit matters, they want who did it: "The board changed the rules."</p>`,
    common_traps: `<ul>
<li>Mixing past and present in the same sentence when nothing in the timeline changes.</li>
<li>Letting a long prepositional phrase trick you about the subject number. ("The results of the trial shows…" is wrong. The subject is "results," plural.)</li>
<li>Writing passive voice just because it "sounds formal." Wordy passive is usually not the best answer choice.</li>
<li>Throwing in "had" for no reason. Past perfect is only for earlier past vs later past.</li>
<li>Clinging to progressive forms like "was being approve." That is not grammatical. Correct: "was approved."</li>
</ul>`,
    independent_practice: `<p>1. The professor (explains / explained) the grading policy yesterday.</p>
<p>2. The sculptures (was / were) photographed by tourists all afternoon.</p>
<p>3. By the time the concert started, we (have / had) already found our seats.</p>
<p>4. The committee (announce / announces / announced) its decision every Friday.</p>
<p>5. The results of the study (shows / show) a clear trend.</p>
<p>6. The letter (is delivered / was delivered / has delivered) this morning and is on your desk.</p>
<p>7. The athlete (has trained / had trained) for months and is finally competing today.</p>
<p>8. The cars in the lot (belongs / belong) to the new employees.</p>
<p>9. The mural was painted overnight by local artists. Rewrite in active voice.</p>
<p>10. The town (was rebuilding / rebuilt / has rebuilding) the bridge last summer.</p>`,
    independent_practice_answers: `<p>1. explained. "Yesterday" = past.</p>
<p>2. were. Plural "sculptures." Passive is fine.</p>
<p>3. had. Past perfect for earlier past.</p>
<p>4. announces. Routine present. "Committee" acts as one unit.</p>
<p>5. show. Subject is "results" (plural).</p>
<p>6. was delivered. Completed earlier today.</p>
<p>7. has trained. Ongoing up to now.</p>
<p>8. belong. Subject is "cars" (plural).</p>
<p>9. Local artists painted the mural overnight.</p>
<p>10. rebuilt. Completed past action last summer.</p>`,
    checkpoint_quiz_q1: 'The historian (writes / wrote / has wrote / had wrote) three articles about the discovery last year. || A) writes || B) wrote || C) has wrote || D) had wrote || ANSWER: B || "last year" = completed past so "wrote." || medium',
    checkpoint_quiz_q2: 'The volunteers were given gloves and trash bags by the organizer. Which is the clearest rewrite? || A) The organizer gave the volunteers gloves and trash bags. || B) Gloves and trash bags are what the organizer was giving to the volunteers. || C) The volunteers had been given gloves and trash bags. || D) The organizer is giving gloves and trash bags to the volunteers. || ANSWER: A || Active voice is shorter and clearer. || medium',
    checkpoint_quiz_q3: 'The students (has finished / had finished / finished) the test before the bell rang. || A) has finished || B) had finished || C) finished || D) had finishing || ANSWER: B || Past perfect "had finished" marks the earlier past action. || medium',
    checkpoint_quiz_q4: 'The pile of notes on the desk (was / were) getting taller. || A) was || B) were || C) are || D) have been || ANSWER: A || True subject is "pile," singular, so "was." || medium',
    checkpoint_quiz_q5: 'The new policy (is announced / was announced / has announcing) by the mayor this morning. || A) is announced || B) was announced || C) has announcing || D) has announce || ANSWER: B || "this morning" is a finished past event so "was announced." || medium',
    checkpoint_quiz_q6: 'Which version avoids unnecessary passive voice? || A) The decision was reached by the panel after hours of debate. || B) The panel reached a decision after hours of debate. || C) A decision had been being reached by the panel. || D) The decision is being reached by the panel. || ANSWER: B || Choice B is active and direct. || medium',
    checkpoint_quiz_q7: 'The team (celebrates / celebrated / has celebrating) their win yesterday. || A) celebrates || B) celebrated || C) has celebrating || D) has celebrate || ANSWER: B || "yesterday" forces simple past "celebrated." || medium',
    checkpoint_quiz_q8: 'By the time the sun came up, the hikers (have found / had found / were found) a safe campsite. || A) have found || B) had found || C) were found || D) had finding || ANSWER: B || Past perfect shows an earlier action before another past moment. || medium',
    checkpoint_quiz_q9: 'The chef prepares meals and delivered them to the shelter. Which choice fixes the error in verb tense consistency? || A) The chef prepared meals and delivered them to the shelter. || B) The chef prepares meals and delivers them to the shelter. || C) Meals are prepared by the chef and delivered to the shelter. || D) The chef had prepared meals and delivers them to the shelter. || ANSWER: B || Both actions are routine ongoing actions so present tense "prepares and delivers" matches. || medium',
    checkpoint_quiz_q10: 'The data (shows / show) that air quality improved this year. || A) shows || B) show || C) showing || D) have shown || ANSWER: A || On ACT-style tests "data" is commonly treated as singular so "shows" is acceptable. || medium',
    recap: 'To get these fast: 1) Lock the time frame using clues like "yesterday" or "by the time." 2) Keep all verbs in that sentence in the same tense unless the time actually changes. 3) Prefer active voice because it is shorter and clearer unless the doer is irrelevant. 4) Make the verb agree with the real subject not the distracting phrase in the middle.',
    estimated_minutes: 25,
    difficulty: 'medium' as const
  };

  const { data, error } = await supabase.functions.invoke('import-lesson-content', {
    body: lessonData
  });

  if (error) {
    console.error('Import error:', error);
    throw error;
  }

  console.log('Import result:', data);
  return data;
}
