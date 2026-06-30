/**
 * limits.ts
 * Character limits for different resume templates to prevent overflow.
 */

export interface FieldLimits {
  name: number;
  title: number;
  email: number;
  phone: number;
  location: number;
  summary: number;
  company: number;
  role: number;
  period: number;
  description: number;
  projectName: number;
  projectLink: number;
  projectDesc: number;
  school: number;
  degree: number;
  year: number;
  skills: number;
  languages: number;
  tools: number;
  website: number;
  refName: number;
  refCompany: number;
  refPhone: number;
  refEmail: number;
}

export const DEFAULT_LIMITS: FieldLimits = {
  name: 50,
  title: 100,
  email: 80,
  phone: 30,
  location: 100,
  summary: 450,
  company: 100,
  role: 100,
  period: 50,
  description: 450,
  projectName: 100,
  projectLink: 150,
  projectDesc: 250,
  school: 120,
  degree: 120,
  year: 40,
  skills: 500,
  languages: 200,
  tools: 300,
  website: 150,
  refName: 60,
  refCompany: 100,
  refPhone: 40,
  refEmail: 80,
};

export const TEMPLATE_SPECIFIC_LIMITS: Record<string, Partial<FieldLimits>> = {
  "Elder-1": { // Classic Sidebar - balanced
    summary: 450,
    description: 450,
  },
  "Elder-2": { // Elegant/ATS - High density, single column
    summary: 500,
    description: 500,
    skills: 600,
  },
  "Elder-3": { // LinkedIn Signature - Large header
    summary: 350,
    description: 350,
  },
  "Elder-4": { // Timeline Blue - Sidebar takes space
    summary: 400,
    description: 350,
    skills: 350,
  },
  "Elder-5": { // Compact - Right Sidebar
    summary: 300,
    description: 300,
    skills: 350,
  },
  "Elder-6": { // Premium - Ribbon layout
    summary: 400,
    description: 380,
  },
  "Elder-7": { // Gold - Modern Split
    summary: 450,
    description: 400,
  },
  "Elder-8": { // Skyline - Bordered
    summary: 400,
    description: 400,
  },
  "Titan-1": { // PRO - Grid
    summary: 350,
    description: 300,
  },
  "Titan-2": { // Dome - Image top
    summary: 300,
    description: 350,
  },
  "Titan-3": { // Split - Balanced
    summary: 400,
    description: 400,
  },
  "Titan-4": { // Ruby - Dark theme
    summary: 350,
    description: 350,
  },
  "BlackWolf-1": { // Minimalist
    summary: 400,
    description: 400,
  },
  "BlackWolf-2": { // Structured Timeline
    summary: 450,
    description: 450,
  },
  "BlackWolf-3": { // Modern Split
    summary: 400,
    description: 400,
  },
  "Rich-1": { // Classic Executive
    summary: 500,
    description: 500,
  },
  "Rich-2": { // Compact Two-Column
    summary: 350,
    description: 400,
  },
  "Rich-3": { // Modern Minimal
    summary: 500,
    description: 500,
  },
  "Rich-4": { // Structured Grid
    summary: 450,
    description: 450,
  }
};

export const getLimits = (templateId: string): FieldLimits => {
  const specific = TEMPLATE_SPECIFIC_LIMITS[templateId] || {};
  return { ...DEFAULT_LIMITS, ...specific };
};
