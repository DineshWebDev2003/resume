import type { QuickApplyField } from './types';

/** Generic fallback — broad keyword coverage, conservative. */
export const genericPatterns: Record<QuickApplyField, string[]> = {
  firstName: ['first_name', 'firstname', 'fname', 'given'],
  lastName: ['last_name', 'lastname', 'lname', 'family', 'surname'],
  fullName: ['full_name', 'fullname', 'your_name', 'applicant_name', 'candidate_name', 'name'],
  email: ['email', 'e_mail', 'mail'],
  phone: ['phone', 'mobile', 'tel', 'telephone', 'contact_number'],
  location: ['location', 'current_location', 'based_in'],
  city: ['city', 'address', 'town'],
  linkedin: ['linkedin'],
  portfolio: ['portfolio', 'personal_website'],
  github: ['github'],
  website: ['website', 'url', 'link'],
};

/** Never-guess question keywords — always surface for review. */
export const RISKY_QUESTION_KEYS = [
  'visa',
  'sponsorship',
  'sponsor',
  'work_authorization',
  'authorized_to_work',
  'relocate',
  'relocation',
  'notice_period',
  'expected_salary',
  'salary_expectation',
  'compensation',
  'years_of_experience',
  'years_experience',
  'education',
  'degree',
  'gender',
  'race',
  'ethnicity',
  'disability',
  'veteran',
];
