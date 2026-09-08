/**
 * Quick Apply + Smart Autofill — shared types.
 * Positioning: user reviews before submission. Never 100% automatic.
 */

export type ATSKind = 'greenhouse' | 'lever' | 'workday' | 'generic' | 'unknown';

export type QuickApplyField =
  | 'firstName'
  | 'lastName'
  | 'fullName'
  | 'email'
  | 'phone'
  | 'location'
  | 'city'
  | 'linkedin'
  | 'portfolio'
  | 'github'
  | 'website';

export type ApplyStatus = 'pending' | 'review_required' | 'submitted' | 'failed' | 'unknown';

export type QuickApplySource = 'quick_apply' | 'external_browser';

export interface MinimalApplyProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  city: string;
  linkedin: string;
  portfolio: string;
  github: string;
  website: string;
}

export interface AutofillFieldResult {
  field: QuickApplyField | string;
  matchedBy:
    | 'autocomplete'
    | 'name'
    | 'id'
    | 'placeholder'
    | 'aria-label'
    | 'label'
    | 'surrounding'
    | 'type'
    | 'adapter';
  success: boolean;
}

export interface AutofillResult {
  filledCount: number;
  skippedCount: number;
  fields: AutofillFieldResult[];
}

export interface QuestionItem {
  id: string;
  label: string;
  kind: 'select' | 'radio' | 'checkbox' | 'text' | 'unknown';
  /** Why we refused to guess — shown to the user. */
  reason: string;
}

export interface PageSignals {
  captcha: boolean;
  loginRequired: boolean;
  fileUploadCount: number;
  confirmation: boolean;
  confirmationConfidence: 'high' | 'medium' | 'low';
  confirmationText?: string;
}

export interface SmartAutofillMessage {
  type:
    | 'autofill-result'
    | 'page-signals'
    | 'resume-upload-required'
    | 'captcha'
    | 'login-required'
    | 'confirmation';
  ats?: ATSKind;
  filled?: number;
  skipped?: number;
  fields?: AutofillFieldResult[];
  questions?: QuestionItem[];
  fileInputs?: number;
  confidence?: 'high' | 'medium' | 'low';
  text?: string;
  url?: string;
}

export type ApplyErrorCode =
  | 'ATS_UNSUPPORTED'
  | 'LOGIN_REQUIRED'
  | 'RESUME_UPLOAD_REQUIRED'
  | 'QUESTION_REQUIRES_ANSWER'
  | 'CAPTCHA_DETECTED'
  | 'FORM_FAILED_TO_LOAD'
  | 'SUBMISSION_FAILED'
  | 'NETWORK_ERROR';

export interface QuickApplyRecord {
  jobId: string;
  jobTitle: string;
  company: string;
  jobUrl: string;
  appliedAt: string;
  status: 'submitted';
  source: QuickApplySource;
  ats: ATSKind;
  filledFieldsCount: number;
}

export type QueueStatus = 'pending' | 'completed' | 'failed' | 'skipped';

export interface QuickApplyQueueItem {
  key: string;
  jobId: string;
  jobTitle: string;
  company: string;
  jobUrl: string;
  ats: ATSKind;
  status: QueueStatus;
  createdAt: number;
  updatedAt: number;
  note?: string;
}
