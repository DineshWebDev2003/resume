export interface RecruiterAuthResult {
  authorized: boolean;
  reason?: string;
  isDeveloper?: boolean;
}

/**
 * Checks whether an email address is authorized for Recruiter access:
 * 1. Developer whitelist (specifically 'dinehwebdev2003@gmail.com' and 'dineshwebdev2003@gmail.com').
 * 2. Corporate/Business email domains (personal free webmails are disallowed).
 */
export function isAuthorizedRecruiterEmail(email: string | null | undefined): RecruiterAuthResult {
  if (!email || typeof email !== 'string') {
    return {
      authorized: false,
      reason: 'No email address detected. Please sign in with an official company email address.',
    };
  }

  const normalized = email.trim().toLowerCase();

  // Developer Whitelist (Developer of this app)
  if (
    normalized === 'dinehwebdev2003@gmail.com' ||
    normalized === 'dineshwebdev2003@gmail.com'
  ) {
    return {
      authorized: true,
      isDeveloper: true,
    };
  }

  // Free/Personal public webmail domains disallowed for recruiter status
  const disallowedPublicDomains = [
    'gmail.com',
    'googlemail.com',
    'yahoo.com',
    'yahoo.co.in',
    'yahoo.co.uk',
    'hotmail.com',
    'outlook.com',
    'live.com',
    'msn.com',
    'icloud.com',
    'me.com',
    'mac.com',
    'aol.com',
    'zoho.com',
    'proton.me',
    'protonmail.com',
    'yandex.com',
    'mail.com',
    'gmx.com',
    'rediffmail.com',
  ];

  const parts = normalized.split('@');
  if (parts.length !== 2 || !parts[1]) {
    return {
      authorized: false,
      reason: 'Invalid email address format.',
    };
  }

  const domain = parts[1];

  if (disallowedPublicDomains.includes(domain)) {
    return {
      authorized: false,
      reason: `Personal email domain (@${domain}) is restricted to Job Seeker mode.\n\nRecruiter access requires a verified corporate email address (e.g. name@company.com).\n\nDeveloper override is active only for dinehwebdev2003@gmail.com.`,
    };
  }

  // Legitimate company domain
  return {
    authorized: true,
    isDeveloper: false,
  };
}

