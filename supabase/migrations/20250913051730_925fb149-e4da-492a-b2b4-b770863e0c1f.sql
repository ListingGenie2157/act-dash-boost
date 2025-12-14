-- Insert sample forms
INSERT INTO public.forms (id, label) VALUES 
('A', 'Form A'),
('B', 'Form B'), 
('C', 'Form C')
ON CONFLICT (id) DO NOTHING;

-- Insert sample passages for Reading section
INSERT INTO public.passages (id, form_id, section, passage_type, title, passage_text) VALUES
('A_RD_1', 'A', 'RD', 'Literary', 'Sample Literary Passage', 'This is a sample literary passage for reading comprehension...'),
('A_RD_2', 'A', 'RD', 'Social', 'Sample Social Studies Passage', 'This is a sample social studies passage for reading comprehension...'),
('B_RD_1', 'B', 'RD', 'Humanities', 'Sample Humanities Passage', 'This is a sample humanities passage for reading comprehension...'),
('C_RD_1', 'C', 'RD', 'Natural', 'Sample Natural Science Passage', 'This is a sample natural science passage for reading comprehension...')
ON CONFLICT (id) DO NOTHING;

-- Insert sample passages for Science section  
INSERT INTO public.passages (id, form_id, section, passage_type, title, passage_text) VALUES
('A_SCI_1', 'A', 'SCI', 'DR', 'Data Representation Passage', 'This passage contains graphs and data for analysis...'),
('A_SCI_2', 'A', 'SCI', 'RS', 'Research Summary Passage', 'This passage summarizes scientific research...'),
('B_SCI_1', 'B', 'SCI', 'CV', 'Conflicting Viewpoints Passage', 'This passage presents conflicting scientific viewpoints...'),
('C_SCI_1', 'C', 'SCI', 'DR', 'Data Representation Passage C', 'This passage contains more graphs and data...')
ON CONFLICT (id) DO NOTHING;