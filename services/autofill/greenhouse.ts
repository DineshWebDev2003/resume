import type { QuickApplyField } from './types';

/**
 * Greenhouse adapter — common field patterns observed on
 * boards.greenhouse.io embedded forms. Resilient: keyword lists,
 * never a single hard selector.
 */
export const greenhousePatterns: Record<QuickApplyField, string[]> = {
  firstName: ['first_name', 'firstname', 'fname', 'given'],
  lastName: ['last_name', 'lastname', 'lname', 'family', 'surname'],
  fullName: ['full_name', 'fullname', 'your_name', 'applicant_name', 'candidate_name'],
  email: ['email', 'email_address', 'candidate_email'],
  phone: ['phone', 'mobile', 'phone_number', 'telephone'],
  location: ['location', 'current_location', 'job_location'],
  city: ['city', 'address', 'location_city'],
  linkedin: ['linkedin', 'linkedin_url', 'linkedin_profile'],
  portfolio: ['portfolio', 'personal_website', 'website_url'],
  github: ['github', 'github_url'],
  website: ['website', 'link', 'url'],
};

/** Extra Greenhouse-specific selectors tried before generic fallback. */
export const greenhouseSelectors: string[] = [
  '#first_name',
  '#last_name',
  '#email',
  '#phone',
  '[data-source="first_name"]',
  '[data-source="last_name"]',
  '[data-source="email"]',
];
