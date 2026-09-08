import type { QuickApplyField } from './types';

/**
 * Workday adapter — myworkdayjobs.com forms are dynamic (data-automation-id).
 * Prefer data-automation-id, fall back to keyword matching. Never assume one
 * selector covers every Workday tenant.
 */
export const workdayPatterns: Record<QuickApplyField, string[]> = {
  firstName: ['first_name', 'firstname', 'legal_first', 'given'],
  lastName: ['last_name', 'lastname', 'legal_last', 'family'],
  fullName: ['full_name', 'fullname', 'candidate_name'],
  email: ['email', 'email_address', 'primary_email'],
  phone: ['phone', 'mobile', 'phone_number', 'telephone', 'primary_phone'],
  location: ['location', 'current_location', 'address'],
  city: ['city', 'address_line', 'municipality'],
  linkedin: ['linkedin', 'linkedin_url'],
  portfolio: ['portfolio', 'website'],
  github: ['github'],
  website: ['website', 'url', 'social'],
};

export const workdaySelectors: string[] = [
  '[data-automation-id*="firstName"]',
  '[data-automation-id*="lastName"]',
  '[data-automation-id*="email"]',
  '[data-automation-id*="phone"]',
  '[data-automation-id*="location"]',
  'input[data-automation-id]',
];
