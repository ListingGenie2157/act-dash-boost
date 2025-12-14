-- =====================================================
-- Phase 2: Science Content Population
-- =====================================================
-- This file contains SQL INSERT statements to populate:
-- 1. D2SCI: 15 Science Diagnostic questions
-- 2. DR_SC: 25 Science Drill questions
-- 
-- To execute: Copy and paste into Supabase SQL Editor
-- =====================================================

-- =====================================================
-- D2SCI: Science Diagnostic (15 questions)
-- =====================================================

INSERT INTO staging_items (form_id, section, ord, skill_code, difficulty, question, choice_a, choice_b, choice_c, choice_d, answer, explanation, passage_text)
VALUES 
  -- Question 1
  ('D2SCI', 'Science', 1, 'S1.A', 'Easy', 'At which temperature is the reaction rate highest?', '10°C', '20°C', '30°C', '40°C', 'C', 'Max value 9 at 30°C.', 'Table: Temperature (°C) → 10,20,30,40,50; Reaction rate (µmol/min) → 2,5,9,8,3. Conditions: pH 7, constant enzyme concentration.'),
  
  -- Question 2
  ('D2SCI', 'Science', 2, 'S1.B', 'Medium', 'From 20°C to 40°C, the reaction rate changes by ___.', '3', '4', '−2', '1', 'A', '8 − 5 = +3 µmol/min.', 'Table: Temperature (°C) → 10,20,30,40,50; Reaction rate (µmol/min) → 2,5,9,8,3. Conditions: pH 7, constant enzyme concentration.'),
  
  -- Question 3
  ('D2SCI', 'Science', 3, 'S1.C', 'Hard', 'Which conclusion is supported by the data?', 'Enzyme denatures above 40°C.', 'Rate decreases above 40°C, but mechanism is not shown.', 'Enzyme works best at pH 9.', 'Rate is proportional to temperature.', 'B', 'Data only show a decrease; no mechanism or pH 9 info.', 'Table: Temperature (°C) → 10,20,30,40,50; Reaction rate (µmol/min) → 2,5,9,8,3. Conditions: pH 7, constant enzyme concentration.'),
  
  -- Question 4
  ('D2SCI', 'Science', 4, 'S1.D', 'Medium', 'If pH were changed from 7 to 9 at 30°C, the table allows you to predict ____.', 'that the rate would increase', 'that the rate would decrease', 'that the rate would stay the same', 'neither direction nor magnitude', 'D', 'pH wasn''t varied; no prediction from given data.', 'Table: Temperature (°C) → 10,20,30,40,50; Reaction rate (µmol/min) → 2,5,9,8,3. Conditions: pH 7, constant enzyme concentration.'),
  
  -- Question 5
  ('D2SCI', 'Science', 5, 'S1.E', 'Medium', 'The rate at 10°C is what fraction of the rate at 50°C?', '2/3', '3/2', '1/3', '2/5', 'A', '2 ÷ 3 = 2/3.', 'Table: Temperature (°C) → 10,20,30,40,50; Reaction rate (µmol/min) → 2,5,9,8,3. Conditions: pH 7, constant enzyme concentration.'),
  
  -- Question 6
  ('D2SCI', 'Science', 6, 'S2.A', 'Medium', 'What is the independent variable in Experiment 1?', 'Plant height', 'Amount of nitrogen', 'Light level', 'Time', 'B', 'Exp 1 manipulates nitrogen amount.', 'Exp 1 varied nitrogen (0,10,20,30 g/plant) at constant light/water; mean height at 6 weeks (cm): 12,18,27,26. Exp 2 fixed N=20 g and varied light (Low, Med, High); mean height (cm): 15,24,30.'),
  
  -- Question 7
  ('D2SCI', 'Science', 7, 'S2.B', 'Easy', 'The dependent variable in both experiments is ____.', 'plant height at 6 weeks', 'nitrogen amount', 'light level', 'number of plants', 'A', 'Both measure height at 6 weeks.', 'Exp 1 varied nitrogen (0,10,20,30 g/plant) at constant light/water; mean height at 6 weeks (cm): 12,18,27,26. Exp 2 fixed N=20 g and varied light (Low, Med, High); mean height (cm): 15,24,30.'),
  
  -- Question 8
  ('D2SCI', 'Science', 8, 'S2.C', 'Hard', 'Which combination would most likely maximize height?', '0 g N and High light', '30 g N and Low light', '20 g N and High light', '10 g N and Med light', 'C', 'Best N is ~20 g; best light is High → 30 cm observed.', 'Exp 1 varied nitrogen (0,10,20,30 g/plant) at constant light/water; mean height at 6 weeks (cm): 12,18,27,26. Exp 2 fixed N=20 g and varied light (Low, Med, High); mean height (cm): 15,24,30.'),
  
  -- Question 9
  ('D2SCI', 'Science', 9, 'S2.D', 'Medium', 'Based on Exp 1, plant height at 40 g N would most likely be ____.', 'greater than at 30 g', 'about the same as at 0 g', 'less than at 30 g but more than at 0 g', 'exactly 27 cm', 'C', 'Trend peaks near 20–30 g, then declines.', 'Exp 1 varied nitrogen (0,10,20,30 g/plant) at constant light/water; mean height at 6 weeks (cm): 12,18,27,26. Exp 2 fixed N=20 g and varied light (Low, Med, High); mean height (cm): 15,24,30.'),
  
  -- Question 10
  ('D2SCI', 'Science', 10, 'S2.E', 'Medium', 'Which was held constant in Experiment 1?', 'Light level', 'Nitrogen', 'Plant height', 'Time', 'A', 'Light and water were controlled in Exp 1.', 'Exp 1 varied nitrogen (0,10,20,30 g/plant) at constant light/water; mean height at 6 weeks (cm): 12,18,27,26. Exp 2 fixed N=20 g and varied light (Low, Med, High); mean height (cm): 15,24,30.'),
  
  -- Question 11
  ('D2SCI', 'Science', 11, 'S2.F', 'Hard', 'Which conclusion is best supported?', 'Both nitrogen and light affect growth; nitrogen shows diminishing returns beyond ~20–30 g.', 'Light alone determines growth; nitrogen has no effect.', 'Nitrogen alone determines growth; light has no effect.', 'Neither factor affects growth.', 'A', 'Heights rise with N then level/slightly drop; higher light increases height.', 'Exp 1 varied nitrogen (0,10,20,30 g/plant) at constant light/water; mean height at 6 weeks (cm): 12,18,27,26. Exp 2 fixed N=20 g and varied light (Low, Med, High); mean height (cm): 15,24,30.'),
  
  -- Question 12
  ('D2SCI', 'Science', 12, 'S1.F', 'Easy', 'At 40°C, which salt is more soluble?', 'Salt A', 'Salt B', 'Equal', 'Cannot determine', 'A', 'A: 36 vs B: 33 → Salt A.', 'Table shows Solubility (g/100 mL water) vs Temperature (°C). Temp: 10, 20, 30, 40, 50. Salt A: 12, 18, 27, 36, 47. Salt B: 30, 32, 33, 33, 32.'),
  
  -- Question 13
  ('D2SCI', 'Science', 13, 'S1.G', 'Medium', 'From 20°C to 50°C, Salt A increases by __ g/100 mL.', '14', '29', '18', '47', 'B', 'Read values: 47 − 18 = 29.', 'Table shows Solubility (g/100 mL water) vs Temperature (°C). Temp: 10, 20, 30, 40, 50. Salt A: 12, 18, 27, 36, 47. Salt B: 30, 32, 33, 33, 32.'),
  
  -- Question 14
  ('D2SCI', 'Science', 14, 'S1.H', 'Medium', 'Which statement best describes Salt B''s pattern?', 'Increases rapidly', 'Increases then levels off', 'Decreases steadily', 'Remains exactly constant', 'B', '30→32→33→33→32: rises then plateaus/slight dip.', 'Table shows Solubility (g/100 mL water) vs Temperature (°C). Temp: 10, 20, 30, 40, 50. Salt A: 12, 18, 27, 36, 47. Salt B: 30, 32, 33, 33, 32.'),
  
  -- Question 15
  ('D2SCI', 'Science', 15, 'S1.I', 'Medium', 'Estimated solubility of Salt A at 35°C is closest to __.', '30', '24', '33', '40', 'C', 'Between 30°C (27) and 40°C (36); about 31.5–32.5; 33 is closest.', 'Table shows Solubility (g/100 mL water) vs Temperature (°C). Temp: 10, 20, 30, 40, 50. Salt A: 12, 18, 27, 36, 47. Salt B: 30, 32, 33, 33, 32.');


-- =====================================================
-- DR_SC: Science Drill (25 questions)
-- =====================================================

INSERT INTO staging_items (form_id, section, ord, skill_code, difficulty, question, choice_a, choice_b, choice_c, choice_d, answer, explanation, passage_text)
VALUES 
  -- Question 1
  ('DR_SC', 'Science', 1, 'S1.J', 'Hard', 'Which conclusion is justified?', 'Salt A will be twice as soluble as Salt B at 60°C.', 'Salt B''s solubility is independent of temperature.', 'At some higher temperature, Salt A may surpass Salt B.', 'Salt A is always less soluble than Salt B.', 'C', 'Data show A approaches and overtakes B by 40–50°C; extrapolation beyond given data is uncertain but "may surpass" is supported by trend (and already true at 50°C).', 'Table shows Solubility (g/100 mL water) vs Temperature (°C). Temp: 10, 20, 30, 40, 50. Salt A: 12, 18, 27, 36, 47. Salt B: 30, 32, 33, 33, 32.'),
  
  -- Question 2
  ('DR_SC', 'Science', 2, 'S2.G', 'Easy', 'What is the dependent variable in both experiments?', 'Light intensity', 'CO₂ concentration', 'Photosynthesis rate', 'Chlorophyll mass', 'C', 'Both measure rate of photosynthesis.', 'Exp 1: Photosynthesis rate (µmol CO₂/min) vs Light (µmol m⁻² s⁻¹): 0→0, 100→4, 200→7, 300→8, 400→8 (CO₂ fixed at 400 ppm). Exp 2: Photosynthesis vs CO₂ (ppm): 200→4, 400→7, 600→9, 800→10 (Light fixed at 300).'),
  
  -- Question 3
  ('DR_SC', 'Science', 3, 'S2.H', 'Medium', 'In Exp 1, which variable is controlled but not manipulated?', 'Light intensity', 'CO₂ concentration', 'Time', 'Photosynthesis rate', 'B', 'CO₂ held constant at 400 ppm in Exp 1.', 'Exp 1: Photosynthesis rate (µmol CO₂/min) vs Light (µmol m⁻² s⁻¹): 0→0, 100→4, 200→7, 300→8, 400→8 (CO₂ fixed at 400 ppm). Exp 2: Photosynthesis vs CO₂ (ppm): 200→4, 400→7, 600→9, 800→10 (Light fixed at 300).'),
  
  -- Question 4
  ('DR_SC', 'Science', 4, 'S2.I', 'Medium', 'Based on Exp 1, increasing light above 300 most likely ____.', 'increases rate substantially', 'has no further effect', 'decreases rate immediately', 'saturates around the same rate', 'D', 'Rates at 300 and 400 are both 8 → saturation.', 'Exp 1: Photosynthesis rate (µmol CO₂/min) vs Light (µmol m⁻² s⁻¹): 0→0, 100→4, 200→7, 300→8, 400→8 (CO₂ fixed at 400 ppm). Exp 2: Photosynthesis vs CO₂ (ppm): 200→4, 400→7, 600→9, 800→10 (Light fixed at 300).'),
  
  -- Question 5
  ('DR_SC', 'Science', 5, 'S2.J', 'Hard', 'To maximize rate, which combo is best among tested ranges?', 'Light 200; CO₂ 200', 'Light 300; CO₂ 800', 'Light 400; CO₂ 600', 'Light 100; CO₂ 800', 'B', 'Near-saturation light (300–400) and highest CO₂ (800) give the largest observed rate (≈10).', 'Exp 1: Photosynthesis rate (µmol CO₂/min) vs Light (µmol m⁻² s⁻¹): 0→0, 100→4, 200→7, 300→8, 400→8 (CO₂ fixed at 400 ppm). Exp 2: Photosynthesis vs CO₂ (ppm): 200→4, 400→7, 600→9, 800→10 (Light fixed at 300).'),
  
  -- Question 6
  ('DR_SC', 'Science', 6, 'S2.K', 'Medium', 'From CO₂ 400 to 800 at Light 300, the rate increases by __%.', '~30%', '~43%', '~71%', '~100%', 'B', '7→10 is +3 on 7 ≈ 42.9%.', 'Exp 1: Photosynthesis rate (µmol CO₂/min) vs Light (µmol m⁻² s⁻¹): 0→0, 100→4, 200→7, 300→8, 400→8 (CO₂ fixed at 400 ppm). Exp 2: Photosynthesis vs CO₂ (ppm): 200→4, 400→7, 600→9, 800→10 (Light fixed at 300).'),
  
  -- Question 7
  ('DR_SC', 'Science', 7, 'S2.L', 'Medium', 'Which change best tests whether light truly saturates above 300?', 'Add more CO₂ levels at 300 light', 'Test additional light levels above 400 at fixed CO₂', 'Measure chlorophyll concentration', 'Run trials at multiple temperatures', 'B', 'Extend light range while holding CO₂ constant to probe saturation.', 'Exp 1: Photosynthesis rate (µmol CO₂/min) vs Light (µmol m⁻² s⁻¹): 0→0, 100→4, 200→7, 300→8, 400→8 (CO₂ fixed at 400 ppm). Exp 2: Photosynthesis vs CO₂ (ppm): 200→4, 400→7, 600→9, 800→10 (Light fixed at 300).'),
  
  -- Question 8
  ('DR_SC', 'Science', 8, 'S1.K', 'Easy', 'At which distance is nitrate lowest?', '0 km', '4 km', '6 km', '8 km', 'D', 'Minimum nitrate is 4.6 mg/L at 8 km.', 'Table: Distance downstream (km): 0,2,4,6,8; Nitrate (mg/L): 9.0,7.2,5.5,4.8,4.6; Dissolved O₂ (mg/L): 5.0,6.2,7.1,7.5,7.6.'),
  
  -- Question 9
  ('DR_SC', 'Science', 9, 'S1.L', 'Medium', 'From 0 to 6 km, dissolved O₂ changes by __ mg/L.', '2.5', '1.2', '−2.5', '0', 'A', '7.5 − 5.0 = +2.5.', 'Table: Distance downstream (km): 0,2,4,6,8; Nitrate (mg/L): 9.0,7.2,5.5,4.8,4.6; Dissolved O₂ (mg/L): 5.0,6.2,7.1,7.5,7.6.'),
  
  -- Question 10
  ('DR_SC', 'Science', 10, 'S1.M', 'Medium', 'As nitrate decreases downstream, dissolved O₂ generally ____.', 'decreases', 'increases', 'stays constant', 'oscillates randomly', 'B', 'Inverse trend in the table.', 'Table: Distance downstream (km): 0,2,4,6,8; Nitrate (mg/L): 9.0,7.2,5.5,4.8,4.6; Dissolved O₂ (mg/L): 5.0,6.2,7.1,7.5,7.6.'),
  
  -- Question 11
  ('DR_SC', 'Science', 11, 'S1.N', 'Hard', 'If nitrate at 10 km is 4.5 mg/L, this is most consistent with ____.', 'a sudden upstream spill', 'a continuing but slowing decrease', 'a sharp increase at 10 km', 'random variation with no trend', 'B', 'Values level off near 8 km; 4.5 is a slight further drop.', 'Table: Distance downstream (km): 0,2,4,6,8; Nitrate (mg/L): 9.0,7.2,5.5,4.8,4.6; Dissolved O₂ (mg/L): 5.0,6.2,7.1,7.5,7.6.'),
  
  -- Question 12
  ('DR_SC', 'Science', 12, 'S1.O', 'Medium', 'Nitrate drops by how much between 2 km and 6 km?', '0.9 mg/L', '2.4 mg/L', '1.7 mg/L', '3.4 mg/L', 'B', 'Subtract: 7.2 − 4.8 = 2.4 mg/L.', 'Table: Distance downstream (km): 0,2,4,6,8; Nitrate (mg/L): 9.0,7.2,5.5,4.8,4.6; Dissolved O₂ (mg/L): 5.0,6.2,7.1,7.5,7.6.'),
  
  -- Question 13
  ('DR_SC', 'Science', 13, 'S2.M', 'Easy', 'What is the independent variable in Experiment 1?', 'Enzyme activity', 'Inhibitor concentration', 'Temperature', 'Time', 'B', 'Exp 1 manipulates inhibitor concentration.', 'Exp 1: Inhibitor (µM) 0,2,4,6 at 30°C; Activity (units/min) 12,9,6,4. Exp 2: Temperature (°C) 20,30,40 at inhibitor 2 µM; Activity 5,9,7.'),
  
  -- Question 14
  ('DR_SC', 'Science', 14, 'S2.N', 'Easy', 'The dependent variable in both experiments is ____.', 'enzyme activity', 'inhibitor concentration', 'temperature', 'pH', 'A', 'Both measure activity (units/min).', 'Exp 1: Inhibitor (µM) 0,2,4,6 at 30°C; Activity (units/min) 12,9,6,4. Exp 2: Temperature (°C) 20,30,40 at inhibitor 2 µM; Activity 5,9,7.'),
  
  -- Question 15
  ('DR_SC', 'Science', 15, 'S2.O', 'Medium', 'In Exp 2, the highest activity occurs at ____.', '20°C', '30°C', '40°C', 'All equal', 'B', 'Activities: 5, 9, 7 → peak at 30°C.', 'Exp 1: Inhibitor (µM) 0,2,4,6 at 30°C; Activity (units/min) 12,9,6,4. Exp 2: Temperature (°C) 20,30,40 at inhibitor 2 µM; Activity 5,9,7.'),
  
  -- Question 16
  ('DR_SC', 'Science', 16, 'S2.P', 'Medium', 'Increasing inhibitor from 6 to 8 µM at 30°C would most likely ____.', 'increase activity', 'decrease activity', 'leave activity unchanged', 'make results uninterpretable', 'B', 'Activity fell as inhibitor rose; trend suggests further decrease.', 'Exp 1: Inhibitor (µM) 0,2,4,6 at 30°C; Activity (units/min) 12,9,6,4. Exp 2: Temperature (°C) 20,30,40 at inhibitor 2 µM; Activity 5,9,7.'),
  
  -- Question 17
  ('DR_SC', 'Science', 17, 'S2.Q', 'Medium', 'Which variable is held constant in Exp 2?', 'Inhibitor concentration', 'Temperature', 'Enzyme activity', 'Substrate type', 'A', 'Inhibitor fixed at 2 µM in Exp 2.', 'Exp 1: Inhibitor (µM) 0,2,4,6 at 30°C; Activity (units/min) 12,9,6,4. Exp 2: Temperature (°C) 20,30,40 at inhibitor 2 µM; Activity 5,9,7.'),
  
  -- Question 18
  ('DR_SC', 'Science', 18, 'S2.R', 'Hard', 'Which conclusion is best supported by both experiments?', 'Temperature alone determines activity.', 'Inhibitor has no measurable effect.', 'Both inhibitor and temperature affect activity; activity peaks near 30°C and falls as inhibitor increases.', 'Activity is maximized at 40°C and 6 µM.', 'C', 'Data show temp peak at 30°C; inhibitor increases reduce activity.', 'Exp 1: Inhibitor (µM) 0,2,4,6 at 30°C; Activity (units/min) 12,9,6,4. Exp 2: Temperature (°C) 20,30,40 at inhibitor 2 µM; Activity 5,9,7.'),
  
  -- Question 19
  ('DR_SC', 'Science', 19, 'S3.A', 'Medium', 'Who would most likely argue that banning pesticides alone will not restore colonies?', 'Sci 1', 'Sci 2', 'Sci 3', 'None of them', 'C', 'Sci 3 emphasizes interactions; a single-factor fix is insufficient.', 'Three scientists on honeybee colony declines. Scientist 1: Neonicotinoid pesticides are the primary driver; field studies show dose-response; mites are secondary. Scientist 2: Varroa mites are the primary driver; pesticide levels are typically sublethal; nutrition is minor. Scientist 3: Declines are multifactorial; interactions among mites, pesticides, and poor forage synergistically stress colonies.'),
  
  -- Question 20
  ('DR_SC', 'Science', 20, 'S3.B', 'Hard', 'New data: colonies recover when mite treatments are applied, with pesticide exposure unchanged. Whose view gains the most support?', 'Sci 1', 'Sci 2', 'Sci 3', 'Sci 1 and Sci 3', 'B', 'Recovery with mite control despite pesticides supports mites-primary view (Sci 2).', 'Three scientists on honeybee colony declines. Scientist 1: Neonicotinoid pesticides are the primary driver; field studies show dose-response; mites are secondary. Scientist 2: Varroa mites are the primary driver; pesticide levels are typically sublethal; nutrition is minor. Scientist 3: Declines are multifactorial; interactions among mites, pesticides, and poor forage synergistically stress colonies.'),
  
  -- Question 21
  ('DR_SC', 'Science', 21, 'S3.C', 'Medium', 'Which prediction follows from Scientist 1''s hypothesis?', 'In pesticide-free areas with abundant forage, colonies recover even without mite control.', 'Mite control without reducing pesticides yields full recovery.', 'Improving forage alone fully restores colonies everywhere.', 'None of the above', 'A', 'If pesticides are primary, removing them should drive recovery even if mites persist.', 'Three scientists on honeybee colony declines. Scientist 1: Neonicotinoid pesticides are the primary driver; field studies show dose-response; mites are secondary. Scientist 2: Varroa mites are the primary driver; pesticide levels are typically sublethal; nutrition is minor. Scientist 3: Declines are multifactorial; interactions among mites, pesticides, and poor forage synergistically stress colonies.'),
  
  -- Question 22
  ('DR_SC', 'Science', 22, 'S3.D', 'Medium', 'Which statement would all three most likely accept?', 'Varroa mites are irrelevant to colony health.', 'Colony declines have been observed in multiple regions.', 'Only pesticides matter.', 'Nutrition has no role anywhere.', 'B', 'The existence of regional declines is common ground.', 'Three scientists on honeybee colony declines. Scientist 1: Neonicotinoid pesticides are the primary driver; field studies show dose-response; mites are secondary. Scientist 2: Varroa mites are the primary driver; pesticide levels are typically sublethal; nutrition is minor. Scientist 3: Declines are multifactorial; interactions among mites, pesticides, and poor forage synergistically stress colonies.'),
  
  -- Question 23
  ('DR_SC', 'Science', 23, 'S3.E', 'Hard', 'Best design to test Scientist 3''s synergy claim?', 'Observe colonies in one pesticide level with no mite data.', '2×2: pesticide (low/high) × mite treatment (no/yes), forage held constant.', 'Only increase forage quality.', 'Compare two farms with unknown differences.', 'B', 'Factorial design isolates interaction between pesticides and mites while controlling forage.', 'Three scientists on honeybee colony declines. Scientist 1: Neonicotinoid pesticides are the primary driver; field studies show dose-response; mites are secondary. Scientist 2: Varroa mites are the primary driver; pesticide levels are typically sublethal; nutrition is minor. Scientist 3: Declines are multifactorial; interactions among mites, pesticides, and poor forage synergistically stress colonies.'),
  
  -- Question 24
  ('DR_SC', 'Science', 24, 'S3.F', 'Medium', 'If measured pesticide levels are below known lethal doses, Scientist 1 would most likely respond that ____.', 'pesticides must be harmless', 'sublethal/chronic effects still impair colonies', 'mites are therefore the only cause', 'nutrition is always the sole driver', 'B', 'Sci 1 argues for dose-response including sublethal effects.', 'Three scientists on honeybee colony declines. Scientist 1: Neonicotinoid pesticides are the primary driver; field studies show dose-response; mites are secondary. Scientist 2: Varroa mites are the primary driver; pesticide levels are typically sublethal; nutrition is minor. Scientist 3: Declines are multifactorial; interactions among mites, pesticides, and poor forage synergistically stress colonies.'),
  
  -- Question 25
  ('DR_SC', 'Science', 25, 'S3.G', 'Easy', 'According to Scientist 2, the most effective immediate management action is to ____.', 'reduce pesticide use', 'control Varroa mites', 'plant more flowers', 'move hives indoors', 'B', 'Sci 2 prioritizes mite control.', 'Three scientists on honeybee colony declines. Scientist 1: Neonicotinoid pesticides are the primary driver; field studies show dose-response; mites are secondary. Scientist 2: Varroa mites are the primary driver; pesticide levels are typically sublethal; nutrition is minor. Scientist 3: Declines are multifactorial; interactions among mites, pesticides, and poor forage synergistically stress colonies.');


-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- After running the above INSERTs, verify the data:

-- Check D2SCI questions
SELECT COUNT(*) as d2sci_count FROM staging_items WHERE form_id = 'D2SCI';
-- Expected: 15

-- Check DR_SC questions  
SELECT COUNT(*) as dr_sc_count FROM staging_items WHERE form_id = 'DR_SC';
-- Expected: 25

-- View skill distribution for D2SCI
SELECT skill_code, COUNT(*) as count 
FROM staging_items 
WHERE form_id = 'D2SCI' 
GROUP BY skill_code 
ORDER BY skill_code;

-- View skill distribution for DR_SC
SELECT skill_code, COUNT(*) as count 
FROM staging_items 
WHERE form_id = 'DR_SC' 
GROUP BY skill_code 
ORDER BY skill_code;
