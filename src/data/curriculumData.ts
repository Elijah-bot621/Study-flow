export interface PresetSubject {
  name: string;
  color: string;
  topics: { name: string; defaultDifficulty: 'weak' | 'average' | 'strong' }[];
}

export const PRESET_CURRICULA: Record<string, PresetSubject[]> = {
  JAMB: [
    {
      name: 'Mathematics',
      color: '#3B82F6', // Blue
      topics: [
        { name: 'Algebraic Processes & Factorization', defaultDifficulty: 'average' },
        { name: 'Quadratic Equations & Polynomials', defaultDifficulty: 'average' },
        { name: 'Calculus: Differentiation & Integration', defaultDifficulty: 'weak' },
        { name: 'Trigonometry & Circular Functions', defaultDifficulty: 'weak' },
        { name: 'Statistics & Probability Distributions', defaultDifficulty: 'strong' },
        { name: 'Matrices & Determinants', defaultDifficulty: 'average' },
        { name: 'Coordinate Geometry & Vectors', defaultDifficulty: 'weak' },
      ],
    },
    {
      name: 'Physics',
      color: '#6366F1', // Indigo
      topics: [
        { name: 'Kinematics & Rectilinear Motion', defaultDifficulty: 'weak' },
        { name: 'Newton\'s Laws, Work, Energy & Power', defaultDifficulty: 'average' },
        { name: 'Heat Energy, Temperature & Gas Laws', defaultDifficulty: 'average' },
        { name: 'Waves, Sound & Optical Reflection', defaultDifficulty: 'average' },
        { name: 'Electric Fields, Resistance & Circuits', defaultDifficulty: 'weak' },
        { name: 'Electromagnetism & Induction', defaultDifficulty: 'weak' },
        { name: 'Atomic Physics & Radioactivity', defaultDifficulty: 'strong' },
      ],
    },
    {
      name: 'Chemistry',
      color: '#10B981', // Emerald
      topics: [
        { name: 'Stoichiometry & The Mole Concept', defaultDifficulty: 'weak' },
        { name: 'Atomic Structure & Periodic Trends', defaultDifficulty: 'strong' },
        { name: 'Chemical Bonding & Intermolecular Forces', defaultDifficulty: 'average' },
        { name: 'Acids, Bases, Salts & Acid-Base Titration', defaultDifficulty: 'average' },
        { name: 'Organic Chemistry: Hydrocarbons & Functional Groups', defaultDifficulty: 'weak' },
        { name: 'Chemical Energetics, Rates & Equilibria', defaultDifficulty: 'weak' },
        { name: 'Electrochemistry & Electrolysis', defaultDifficulty: 'average' },
      ],
    },
    {
      name: 'English Language',
      color: '#F59E0B', // Amber
      topics: [
        { name: 'Comprehension & Summary Techniques', defaultDifficulty: 'strong' },
        { name: 'Lexis & Structure (Grammar & Concord)', defaultDifficulty: 'average' },
        { name: 'Oral English: Vowel & Consonant Sounds', defaultDifficulty: 'weak' },
        { name: 'Stress Patterns, Intonation & Rhyme', defaultDifficulty: 'weak' },
        { name: 'Idioms, Antonyms & Synonyms', defaultDifficulty: 'average' },
      ],
    },
    {
      name: 'Biology',
      color: '#059669', // Green
      topics: [
        { name: 'Cell Organization & Organelles', defaultDifficulty: 'strong' },
        { name: 'Photosynthesis & Cellular Respiration', defaultDifficulty: 'average' },
        { name: 'Circulatory, Excretory & Respiratory Systems', defaultDifficulty: 'average' },
        { name: 'Genetics, DNA & Hereditary Crosses', defaultDifficulty: 'weak' },
        { name: 'Ecology, Biomes & Nutrient Cycles', defaultDifficulty: 'strong' },
        { name: 'Hormones, Nervous System & Homeostasis', defaultDifficulty: 'weak' },
      ],
    },
    {
      name: 'Economics',
      color: '#8B5CF6', // Purple
      topics: [
        { name: 'Theory of Demand, Supply & Elasticity', defaultDifficulty: 'average' },
        { name: 'Production, Cost Curves & Scale Economies', defaultDifficulty: 'average' },
        { name: 'Market Structures: Perfect & Monopoly', defaultDifficulty: 'average' },
        { name: 'National Income Accounting & GDP', defaultDifficulty: 'weak' },
        { name: 'Money, Banking, Inflation & Monetary Policy', defaultDifficulty: 'weak' },
        { name: 'International Trade & Exchange Rates', defaultDifficulty: 'average' },
      ],
    },
  ],
  WAEC: [
    {
      name: 'Mathematics',
      color: '#3B82F6',
      topics: [
        { name: 'Number Base Systems & Logarithms', defaultDifficulty: 'strong' },
        { name: 'Simultaneous & Quadratic Equations', defaultDifficulty: 'average' },
        { name: 'Circle Theorems & Geometric Proofs', defaultDifficulty: 'weak' },
        { name: 'Trigonometric Ratios & Bearings', defaultDifficulty: 'weak' },
        { name: 'Mensuration of 2D & 3D Solids', defaultDifficulty: 'average' },
        { name: 'Statistics, Mean, Variance & Cumulative Frequency', defaultDifficulty: 'average' },
      ],
    },
    {
      name: 'English Language',
      color: '#F59E0B',
      topics: [
        { name: 'Essay Writing: Narrative, Argumentative & Formal Letters', defaultDifficulty: 'average' },
        { name: 'Reading Comprehension & Précis Writing', defaultDifficulty: 'strong' },
        { name: 'Sentence Structure, Clauses & Punctuation', defaultDifficulty: 'average' },
        { name: 'Phonetics & Syllable Stress', defaultDifficulty: 'weak' },
      ],
    },
    {
      name: 'Physics',
      color: '#6366F1',
      topics: [
        { name: 'Measurement, Units & Dimensional Analysis', defaultDifficulty: 'strong' },
        { name: 'Kinematics: Velocity-Time Graphs & Acceleration', defaultDifficulty: 'weak' },
        { name: 'Thermal Properties & Specific Heat Capacity', defaultDifficulty: 'average' },
        { name: 'Geometric Optics, Lenses & Mirrors', defaultDifficulty: 'average' },
        { name: 'DC Circuits & Ohm\'s Law Experiments', defaultDifficulty: 'weak' },
      ],
    },
  ],
};

export const COMMON_SUBJECT_SUGGESTIONS = [
  'Mathematics',
  'English Language',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Government',
  'Literature-in-English',
  'Financial Accounting',
  'Commerce',
  'Further Mathematics',
  'Geography',
  'Agricultural Science',
  'Computer Science',
  'Civic Education',
];
