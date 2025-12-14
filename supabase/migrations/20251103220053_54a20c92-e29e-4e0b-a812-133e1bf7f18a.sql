-- Insert AP Chemistry skills for stoichiometry unit
INSERT INTO skills (id, name, subject, cluster, description, order_index) VALUES
('APCHEM4.A', 'Law of Conservation of Mass', 'Science', 'AP Chemistry - Stoichiometry', 'Understanding mass conservation in chemical reactions', 1000),
('APCHEM4.B', 'Basics of Stoichiometry (mass–mole–mass)', 'Science', 'AP Chemistry - Stoichiometry', 'Converting between mass and moles in chemical equations', 1001),
('APCHEM4.C', 'Oxidation States', 'Science', 'AP Chemistry - Stoichiometry', 'Determining oxidation numbers for elements in compounds', 1002),
('APCHEM4.D', 'Balancing Redox Equations', 'Science', 'AP Chemistry - Stoichiometry', 'Balancing oxidation-reduction reactions', 1003),
('APCHEM4.E', 'Limiting Reactant & Theoretical Yield', 'Science', 'AP Chemistry - Stoichiometry', 'Identifying limiting reactants and calculating theoretical yields', 1004),
('APCHEM4.F', 'Percent Yield & Percent Purity', 'Science', 'AP Chemistry - Stoichiometry', 'Calculating percent yield and purity in reactions', 1005),
('APCHEM4.G', 'Solution Stoichiometry (Molarity)', 'Science', 'AP Chemistry - Stoichiometry', 'Working with molarity and solution concentrations', 1006),
('APCHEM4.H', 'Titrations (Acid–Base & Redox)', 'Science', 'AP Chemistry - Stoichiometry', 'Performing titration calculations for acids, bases, and redox', 1007),
('APCHEM4.I', 'Empirical & Molecular Formulas', 'Science', 'AP Chemistry - Stoichiometry', 'Determining empirical and molecular formulas from data', 1008)
ON CONFLICT (id) DO NOTHING;