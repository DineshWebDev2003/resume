import type { QuickApplyField } from './types';

/** Lever adapter — jobs.lever.co patterns. Keyword lists, not hard selectors. */
export const leverPatterns: Record<QuickApplyField, string[]> = {
  firstName: ['first_name', 'firstname', 'fname', 'given', 'lever_first'],
  lastName: ['last_name', 'lastname', 'lname', 'family', 'surname'],
  fullName: ['full_name', 'fullname', 'your_name', 'candidate_name', 'name'],
  email: ['email', 'email_address', 'candidate_email'],
  phone: ['phone', 'mobile', 'phone_number', 'telephone', 'contact'],
  location: ['location', 'current_location', 'based'],
  city: ['city', 'address', 'location'],
  linkedin: ['linkedin', 'linkedin_url', 'linkedin_profile'],
  portfolio: ['portfolio', 'personal_website', 'website'],
  github: ['github', 'github_url'],
  website: ['website', 'link', 'url', 'other_website'],
};

export const leverSelectors: string[] = [
  '[name="name"]',
  '[name="email"]',
  '[name="phone"]',
  '.application-question input[type="text"]',
];
