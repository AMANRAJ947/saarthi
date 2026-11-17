export const SECTORS = {
  agriculture: { icon: '🌾', en: 'Agriculture', hi: 'कृषि' },
  education: { icon: '🎓', en: 'Education', hi: 'शिक्षा' },
  employment: { icon: '💼', en: 'Employment', hi: 'रोज़गार' },
  finance: { icon: '💰', en: 'Finance & Loans', hi: 'वित्त और ऋण' },
  women_child: { icon: '👩‍👧', en: 'Women & Child Welfare', hi: 'महिला एवं बाल कल्याण' },
  pension: { icon: '👵', en: 'Pension & Social Security', hi: 'पेंशन और सामाजिक सुरक्षा' },
  land: { icon: '🏡', en: 'Land & Property', hi: 'भूमि और संपत्ति' },
  postal: { icon: '📮', en: 'Postal Savings', hi: 'डाक बचत' },
};

export const OCCUPATIONS = {
  farmer: { en: 'Farmer', hi: 'किसान' },
  student: { en: 'Student', hi: 'विद्यार्थी' },
  job_seeker: { en: 'Job seeker', hi: 'रोज़गार खोजने वाला' },
  entrepreneur: { en: 'Entrepreneur / business owner', hi: 'उद्यमी / व्यवसायी' },
  salaried: { en: 'Salaried employee', hi: 'नौकरीपेशा' },
  self_employed: { en: 'Self-employed', hi: 'स्वरोज़गार' },
  laborer: { en: 'Labourer / daily wage', hi: 'मज़दूर / दिहाड़ी' },
  homemaker: { en: 'Homemaker', hi: 'गृहिणी' },
  retired: { en: 'Retired', hi: 'सेवानिवृत्त' },
  street_vendor: { en: 'Street vendor', hi: 'रेहड़ी-पटरी विक्रेता' },
  artisan: { en: 'Artisan / craftsperson', hi: 'कारीगर' },
};

export const APP_STATUSES = {
  interested: { en: 'Interested', hi: 'रुचि है' },
  documents_ready: { en: 'Documents ready', hi: 'दस्तावेज़ तैयार' },
  applied: { en: 'Applied', hi: 'आवेदन किया' },
  under_review: { en: 'Under review', hi: 'समीक्षा में' },
  approved: { en: 'Approved', hi: 'स्वीकृत' },
  rejected: { en: 'Rejected', hi: 'अस्वीकृत' },
  benefit_received: { en: 'Benefit received', hi: 'लाभ मिला' },
};

export const EDUCATION = {
  none: 'No formal schooling', primary: 'Primary', secondary: 'Class 10', higher_secondary: 'Class 12',
  diploma_iti: 'ITI / Diploma', graduate: 'Graduate', postgraduate: 'Postgraduate',
};

export const STATES = ['Madhya Pradesh', 'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu',
  'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Other'];

export const FIELD_LABELS = {
  age: 'your age', gender: 'your gender', state: 'your state', residence: 'rural / urban', occupations: 'your occupation',
  category: 'your category', annualIncome: 'family income', isBPL: 'BPL status', ownsLand: 'land ownership',
  hasDisability: 'disability status', hasPuccaHouse: 'house type', hasGirlChildUnder10: 'girl child under 10',
  educationLevel: 'education',
};
