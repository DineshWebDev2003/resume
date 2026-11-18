import type { QuickApplyField } from './types';

/** Generic fallback — broad keyword coverage matching leading Chrome extensions (Simplify/Teal). */
export const genericPatterns: Record<QuickApplyField, string[]> = {
  firstName: ['first_name', 'firstname', 'fname', 'given', 'legal_first_name'],
  lastName: ['last_name', 'lastname', 'lname', 'family', 'surname', 'legal_last_name'],
  fullName: ['full_name', 'fullname', 'your_name', 'applicant_name', 'candidate_name', 'name'],
  email: ['email', 'e_mail', 'mail', 'email_address', 'primary_email'],
  phone: ['phone', 'mobile', 'tel', 'telephone', 'contact_number', 'cell_phone'],
  location: ['location', 'current_location', 'based_in', 'country', 'state_province'],
  city: ['city', 'address', 'town', 'address_line1', 'street_address'],
  linkedin: ['linkedin', 'linkedin_profile', 'linkedin_url'],
  portfolio: ['portfolio', 'personal_website', 'portfolio_url'],
  github: ['github', 'github_profile', 'github_url'],
  website: ['website', 'url', 'link', 'blog'],
  workAuthorization: ['authorized_to_work', 'work_authorization', 'legally_authorized', 'eligible_to_work', 'work_permit'],
  visaRequired: ['sponsorship', 'require_sponsorship', 'visa_sponsorship', 'future_sponsorship', 'sponsor'],
  noticePeriod: ['notice_period', 'availability', 'earliest_start_date', 'how_soon'],
  yearsOfExperience: ['years_of_experience', 'years_experience', 'total_experience', 'experience_years'],
  currentTitle: ['current_title', 'job_title', 'headline', 'current_role'],
  currentCompany: ['current_company', 'employer', 'current_employer', 'company_name'],
  degree: ['degree', 'highest_degree', 'education_level', 'qualification'],
  major: ['major', 'field_of_study', 'department', 'discipline'],
  university: ['university', 'college', 'school', 'institution'],
  salaryExpectation: ['expected_salary', 'salary_expectation', 'desired_salary', 'compensation'],
  gender: ['gender', 'sex', 'gender_identity'],
  disability: ['disability', 'handicap'],
  veteran: ['veteran', 'veteran_status', 'military'],
};

/** Genuinely sensitive questions that should be reviewed manually (not routine job application questions) */
export const RISKY_QUESTION_KEYS = [
  'felony',
  'criminal',
  'background_check',
  'clearance',
  'security_clearance',
  'drug_test',
  'non_compete',
  'confidentiality',
];
