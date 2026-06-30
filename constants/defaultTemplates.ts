import { Theme } from "@/constants/theme";

export const DEFAULT_TEMPLATE_SERIES = [
  {
    id: "elder",
    name: "Elder Series",
    desc: "ATS-Optimized & Professional",
    icon: "ShieldCheck",
    color: "#0077b5",
    badge: "POPULAR",
    templates: [
      { id: "Elder-1", name: "Elder 1: Elite", desc: "Sleek Sidebar", badge: "POPULAR", color: Theme.colors.secondary },
      { id: "Elder-2", name: "Elder 2: ATS", desc: "ATS Master", badge: "ATS SAFE", color: "#10b981" },
      { id: "Elder-3", name: "Elder 3: LI", desc: "LinkedIn Style", badge: "EXECUTIVE", color: "#0077b5" },
      { id: "Elder-4", name: "Elder 4: Timeline", desc: "Timeline & Sidebar", badge: "CREATIVE", color: "#22a3d6" },
      { id: "Elder-5", name: "Elder 5: Right", desc: "Right Sidebar", badge: "PORTFOLIO", color: "#d946ef" },
      { id: "Elder-6", name: "Elder 6: Ribbon", desc: "Ribbon Dark Sidebar", badge: "MODERN", color: "#0ea5e9" },
      { id: "Elder-7", name: "Elder 7: Gold", desc: "Two-Tone Sidebar", badge: "PREMIUM", color: "#facc15" },
      { id: "Elder-8", name: "Elder 8: Skyline", desc: "Blue Timelines", badge: "PREMIUM", color: "#0ea5e9" },
    ]
  },
  {
    id: "titan",
    name: "Titan Series",
    desc: "Modern Grids & Bold Accents",
    icon: "Zap",
    color: "#ea580c",
    badge: "MODERN",
    templates: [
      { id: "Titan-1", name: "Titan 1: PRO", desc: "Curved Dark Sidebar", badge: "NEW", color: "#1e293b" },
      { id: "Titan-2", name: "Titan 2: Dome", desc: "Purple Pill Theme", badge: "NEW", color: "#9b7eb5" },
      { id: "Titan-3", name: "Titan 3: Split", desc: "Orange Accent", badge: "NEW", color: "#ea580c" },
      { id: "Titan-4", name: "Titan 4: Ruby", desc: "Dark Red Theme", badge: "NEW", color: "#dc2626" },
    ]
  },
  {
    id: "blackwolf",
    name: "Black Wolf Series",
    desc: "Elite Minimalist Designs",
    icon: "Code",
    color: "#000000",
    badge: "PREMIUM",
    templates: [
      { id: "BlackWolf-1", name: "Black Wolf 1", desc: "Elite Minimalist", badge: "PREMIUM", color: "#000000" },
      { id: "BlackWolf-2", name: "Black Wolf 2", desc: "Structured Timeline", badge: "NEW", color: "#1a1a1a" },
      { id: "BlackWolf-3", name: "Black Wolf 3", desc: "Modern Split", badge: "NEW", color: "#333333" },
      { id: "BlackWolf-4", name: "Black Wolf 4", desc: "Minimalist Two-Column", badge: "NEW", color: "#1a202c" },
    ]
  },
  {
    id: "jocker",
    name: "Jocker Series",
    desc: "Bold ATS-Friendly Layouts",
    icon: "Heart",
    color: "#ec4899",
    badge: "NEW",
    templates: [
      { id: "Jocker-1", name: "Jocker 1: Pun", desc: "Bold Accent Top", badge: "ATS Safe", color: "#ec4899" },
      { id: "Jocker-2", name: "Jocker 2: Card", desc: "Clean Card Sections", badge: "ATS Safe", color: "#ec4899" },
      { id: "Jocker-3", name: "Jocker 3: Bold", desc: "High Contrast Headers", badge: "ATS Safe", color: "#ec4899" },
      { id: "Jocker-4", name: "Jocker 4: Trick", desc: "Typographic Focus", badge: "ATS Safe", color: "#ec4899" },
      { id: "Jocker-5", name: "Jocker 5: Royal", desc: "Structured Timeline", badge: "ATS Safe", color: "#ec4899" },
    ]
  },
  {
    id: "apex",
    name: "Apex Series",
    desc: "Modern Premium Designs",
    icon: "Star",
    color: "#fd79a8",
    badge: "NEW",
    templates: [
      { id: "Apex-1", name: "Apex 1: Mid-Century", desc: "Warm Dark Sidebar", badge: "PREMIUM", color: "#2d3436" },
      { id: "Apex-2", name: "Apex 2: Ocean", desc: "Blue Gradient Theme", badge: "NEW", color: "#0984e3" },
      { id: "Apex-3", name: "Apex 3: Forest", desc: "Green Professional", badge: "NEW", color: "#1b4332" },
    ]
  },
  {
    id: "fresher",
    name: "Fresher Series",
    desc: "Built for Fresh Graduates",
    icon: "GraduationCap",
    color: "#059669",
    badge: "NEW",
    templates: [
      { id: "Fresher-1", name: "Fresher 1: Smart", desc: "Clean Academic Focus", badge: "FRESHER", color: "#059669" },
      { id: "Fresher-2", name: "Fresher 2: Spark", desc: "Internship Showcase", badge: "FRESHER", color: "#0284c7" },
      { id: "Fresher-3", name: "Fresher 3: Rise", desc: "Project & Skills First", badge: "FRESHER", color: "#7c3aed" },
      { id: "Fresher-4", name: "Fresher 4: Pro", desc: "Professional Fresher", badge: "FRESHER", color: "#dc2626" },
      { id: "Fresher-5", name: "Fresher 5: Build", desc: "Achievement Focused", badge: "FRESHER", color: "#d97706" },
    ]
  },
  {
    id: "rich",
    name: "Rich Series",
    desc: "Black & White ATS-Friendly Designs",
    icon: "Type",
    color: "#000000",
    badge: "ATS SAFE",
    templates: [
      { id: "Rich-1", name: "Rich 1: Classic", desc: "Traditional Executive", badge: "ATS SAFE", color: "#000000" },
      { id: "Rich-2", name: "Rich 2: Compact", desc: "Dense Two-Column", badge: "ATS SAFE", color: "#000000" },
      { id: "Rich-3", name: "Rich 3: Modern", desc: "Clean Minimal", badge: "ATS SAFE", color: "#000000" },
      { id: "Rich-4", name: "Rich 4: Grid", desc: "Structured Grid Layout", badge: "ATS SAFE", color: "#000000" },
    ]
  }
];

export const DEFAULT_ALL_TEMPLATES = [
  { key: "t1", id: "executive", name: "Executive", isPro: false },
  { key: "t2", id: "modern", name: "Modern", isPro: true },
  { key: "t3", id: "creative", name: "Creative", isPro: false },
  { key: "t4", id: "professional", name: "Professional", isPro: true },
  { key: "t5", id: "modern", name: "Minimal", isPro: false },
  { key: "t6", id: "professional", name: "Elite Pro", isPro: true },
  { key: "t7", id: "creative", name: "Fancy Pink", isPro: false },
  { key: "t8", id: "executive", name: "Classic Grey", isPro: false },
  { key: "t9", id: "modern", name: "Bold Impact", isPro: true },
  { key: "t10", id: "professional", name: "Developer", isPro: false },
  { key: "t11", id: "Apex-1", name: "Apex 1: Mid-Century", isPro: true },
  { key: "t12", id: "Apex-2", name: "Apex 2: Ocean", isPro: true },
  { key: "t13", id: "Apex-3", name: "Apex 3: Forest", isPro: false },
  { key: "t14", id: "Fresher-1", name: "Fresher 1: Smart", isPro: false },
  { key: "t15", id: "Fresher-2", name: "Fresher 2: Spark", isPro: false },
  { key: "t16", id: "Fresher-3", name: "Fresher 3: Rise", isPro: false },
  { key: "t17", id: "Fresher-4", name: "Fresher 4: Pro", isPro: false },
  { key: "t18", id: "Fresher-5", name: "Fresher 5: Build", isPro: false },
  { key: "t19", id: "Rich-1", name: "Rich 1: Classic", isPro: false },
  { key: "t20", id: "Rich-2", name: "Rich 2: Compact", isPro: false },
  { key: "t21", id: "Rich-3", name: "Rich 3: Modern", isPro: false },
  { key: "t22", id: "Rich-4", name: "Rich 4: Grid", isPro: false },
];

export const DEFAULT_RESUME_DATA = {
  name: "Jane Doe",
  title: "Senior Full-Stack Developer",
  email: "jane.doe@example.com",
  phone: "+91 9876543210",
  location: "Tamil Nadu, India",
  summary:
    "Dynamic and results-driven Senior Full-Stack Developer with over 5 years of experience in architecting and deploying high-performance mobile and web applications. Expert in React Native, Node.js, and Cloud Infrastructure. Proven track record of leading cross-functional teams to deliver scalable solutions that enhance user engagement by 40%.",
  experience: [
    {
      id: "1",
      company: "Innovate Tech Hub",
      role: "Lead Full-Stack Developer",
      period: "2022 – Present",
      description:
        "Architected and launched a flagship fintech mobile application using React Native, reaching 100k+ active users within the first quarter. Engineered a robust Node.js microservices backend that improved API response times by 60%.",
      workType: "Full-time",
    },
    {
      id: "2",
      company: "Digital Stream Systems",
      role: "Software Engineer",
      period: "2019 – 2022",
      description:
        "Developed and maintained highly responsive web interfaces for high-traffic e-commerce platforms. Collaborated with UI/UX designers to implement pixel-perfect designs.",
      workType: "Full-time",
    },
    {
      id: "3",
      company: "TechStart Inc.",
      role: "Software Developer Intern",
      period: "Jan 2019 – Jun 2019",
      description:
        "Built RESTful APIs using Node.js and Express, reducing data fetch latency by 30%. Collaborated on front-end features using React and Redux.",
      workType: "Internship",
    }
  ],
  education: {
    school: "Anna University",
    degree: "B.Tech Information Technology",
    year: "2015 – 2019",
    honors: "First Class with Distinction",
    cgpa: "8.7/10",
    coursework: "Data Structures, Algorithms, DBMS, Computer Networks, OOPS",
  },
  projects: [
    {
      id: "1",
      name: "Elite AI Resume Builder",
      link: "https://github.com/janedoe/resume-builder",
      description: "A state-of-the-art resume platform featuring real-time AI optimization. Built with React Native, Node.js, and OpenAI API.",
    },
    {
      id: "2",
      name: "CryptoPulse Tracker",
      link: "https://github.com/janedoe/cryptopulse",
      description: "A comprehensive real-time cryptocurrency monitoring dashboard with price alerts and portfolio tracking.",
    },
    {
      id: "3",
      name: "Smart Campus Navigation",
      link: "https://github.com/janedoe/campus-nav",
      description: "Indoor navigation app for university campus using BLE beacons and React Native, helping 500+ students navigate buildings.",
    }
  ],
  skills: "React Native, React, Node.js, TypeScript, AWS, Docker",
  tools: "VS Code, Git, Figma, Postman",
  languages: "English, Tamil",
  links: [
    { label: "GitHub", url: "github.com/janedoe" },
    { label: "Portfolio", url: "janedoe.dev" },
    { label: "LinkedIn", url: "linkedin.com/in/janedoe" }
  ],
  certifications: [
    { title: "AWS Certified Developer", issuer: "Amazon", year: "2023" },
    { title: "Meta Front-End Developer", issuer: "Coursera", year: "2022" },
    { title: "Google Data Analytics", issuer: "Coursera", year: "2022" }
  ],
  achievements: [
    "Won 1st place in University Hackathon 2022",
    "Published research paper on ML-based recommendation systems",
    "Completed Google Summer of Code 2021",
  ],
  interests: "AI/ML, Open Source, Full-Stack Development, Cloud Computing",
  photo:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=200&h=200&q=80",
};
