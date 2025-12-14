-- Create ACT forms for full simulations
INSERT INTO forms (id,label) VALUES
('EN_A','ACT English – Form A'),('MATH_A','ACT Math – Form A'),('RD_A','ACT Reading – Form A'),('SCI_A','ACT Science – Form A'),
('EN_B','ACT English – Form B'),('MATH_B','ACT Math – Form B'),('RD_B','ACT Reading – Form B'),('SCI_B','ACT Science – Form B'),
('EN_C','ACT English – Form C'),('MATH_C','ACT Math – Form C'),('RD_C','ACT Reading – Form C'),('SCI_C','ACT Science – Form C')
ON CONFLICT (id) DO NOTHING;

-- Create test packages structure
CREATE TABLE IF NOT EXISTS test_packages (
  id TEXT PRIMARY KEY, 
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS test_package_sections (
  package_id TEXT NOT NULL,
  ord INTEGER NOT NULL,
  section TEXT NOT NULL,
  form_id TEXT NOT NULL,
  time_limit_minutes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (package_id, ord),
  FOREIGN KEY (package_id) REFERENCES test_packages(id),
  FOREIGN KEY (form_id) REFERENCES forms(id)
);

-- Enable RLS on new tables
ALTER TABLE test_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_package_sections ENABLE ROW LEVEL SECURITY;

-- Create policies for test packages (public read)
CREATE POLICY "test_packages_public_read" 
ON test_packages 
FOR SELECT 
USING (true);

CREATE POLICY "test_package_sections_public_read" 
ON test_package_sections 
FOR SELECT 
USING (true);

-- Insert test packages
INSERT INTO test_packages (id,label) VALUES
('D4A','Full ACT – Form A'),
('D4B','Full ACT – Form B'),
('D4C','Full ACT – Form C')
ON CONFLICT (id) DO NOTHING;

-- Insert test package sections with official timers
INSERT INTO test_package_sections (package_id,ord,section,form_id,time_limit_minutes) VALUES
('D4A',1,'EN','EN_A',45),('D4A',2,'MATH','MATH_A',60),('D4A',3,'RD','RD_A',35),('D4A',4,'SCI','SCI_A',35),
('D4B',1,'EN','EN_B',45),('D4B',2,'MATH','MATH_B',60),('D4B',3,'RD','RD_B',35),('D4B',4,'SCI','SCI_B',35),
('D4C',1,'EN','EN_C',45),('D4C',2,'MATH','MATH_C',60),('D4C',3,'RD','RD_C',35),('D4C',4,'SCI','SCI_C',35)
ON CONFLICT DO NOTHING;