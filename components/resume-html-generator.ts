/**
 * resume-html-generator.ts
 *
 * PRECISE RECREATION OF MODERN SIDEBAR TEMPLATE
 * 1. Strict A4 Standard (595pt x 842pt).
 * 2. Solid Sidebar Layout.
 */

import { auth } from "@/services/firebase";

export const generateResumeHtml = (
  data: any,
  templateId: string = "Modern",
  primaryColor: string = "#1e293b",
  fontFamily: string = "Inter",
  isPrint: boolean = false,
  isThumbnail: boolean = false,
): string => {
  // Use login user profile pic or random picture if template photo is missing
  let displayPhoto = data.photo;
  if (!displayPhoto || displayPhoto.trim() === "") {
    if (auth?.currentUser?.photoURL) {
      displayPhoto = auth.currentUser.photoURL;
    } else {
      displayPhoto = "https://randomuser.me/api/portraits/men/32.jpg";
    }
    // Update data object so templates correctly display the photo block
    data = { ...data, photo: displayPhoto };
  }

  const esc = (s: string) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const getHref = (url: string) => {
    if (!url) return "";
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const svgPhone = `<svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>`;
  const svgEmail = `<svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`;
  const svgLocation = `<svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
  const svgUser = `<svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
  const svgBriefcase = `<svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`;
  const svgGraduation = `<svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10L12 5L2 10L12 15L22 10Z"></path><path d="M6 12.5V16.5L12 19.5L18 16.5V12.5"></path></svg>`;
  const svgEdu = svgGraduation;
  const svgSkills = `<svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
  const svgContact = `<svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;
  const svgLink = `<svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>`;
  const svgAward = `<svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="currentColor"><path d="M12 2C9.24 2 7 4.24 7 7c0 1.94 1.11 3.61 2.72 4.41L7 22l5-2 5 2-2.72-10.59C18.89 10.61 20 8.94 20 7c0-2.76-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z"/></svg>`;
  const svgTool = `<svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="currentColor"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.5 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>`;
  const svgLightbulb = `<svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="currentColor"><path d="M12 2C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 017 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.03-2.15 3.9zM9 19h6c.55 0 1 .45 1 1s-.45 1-1 1H9c-.55 0-1-.45-1-1s.45-1 1-1z"/></svg>`;
  const svgTarget = `<svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>`;

  const toArray = (v: any): string[] => {
    if (Array.isArray(v)) return v.map(String).filter(Boolean);
    if (typeof v === "string") return v.split(",").map((s: string) => s.trim()).filter(Boolean);
    return [];
  };

  const skills = toArray(data.skills);

  const tools = toArray(data.tools);

  const languages = toArray(data.languages);

  const references = data.references || [];

  const expItems = (data.experience || [])
    .map(
      (exp: any) => `
    <div class="exp-item">
      <div class="exp-row">
        <div class="exp-role">${esc(exp.role)}</div>
        <div class="exp-date">${esc(exp.period)}</div>
      </div>
      <div class="exp-company">${esc(exp.company)}</div>
      <div class="exp-desc">${esc(exp.description)}</div>
    </div>
  `,
    )
    .join("");

  const projectItems = (data.projects || [])
    .map(
      (proj: any) => `
    <div class="exp-item">
      <div class="exp-row">
        <div class="exp-role">${esc(proj.name)}</div>
      </div>
      <div class="exp-desc">${esc(proj.description)}</div>
    </div>
  `,
    )
    .join("");

  const eduArray = Array.isArray(data.education)
    ? data.education
    : data.education
      ? [data.education]
      : [];

  // Template-specific Layout Logic
  let htmlContent = "";

  if (templateId === "BlackWolf-1") {
    // BLACKWOLF-1: PREMIUM MINIMALIST
    htmlContent = `
      <div class="page bw1-layout">
        <div class="bw1-header" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div class="bw1-name-row">
            <div class="bw1-name">${esc(data.name)}</div>
            <div class="bw1-title">${esc(data.title)}</div>
          </div>
          <div class="bw1-contact-bar">
            <div class="bw1-c-item">${svgPhone} ${esc(data.phone)}</div>
            <div class="bw1-c-item">${svgEmail} ${esc(data.email)}</div>
            <div class="bw1-c-item">${svgLocation} ${esc(data.location)}</div>
          </div>
        </div>

        <div class="bw1-content">
          <div class="bw1-main">
            <div class="bw1-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="bw1-heading">ABOUT ME</div>
              <div class="bw1-text">${esc(data.summary)}</div>
            </div>

            ${
              expItems && (data.experience || []).length > 0
                ? `
            <div class="bw1-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
              <div class="bw1-heading">WORK EXPERIENCE</div>
              ${expItems}
            </div>
            `
                : ""
            }

            ${
              projectItems
                ? `
            <div class="bw1-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
              <div class="bw1-heading">PROJECTS</div>
              ${projectItems}
            </div>
            `
                : ""
            }
          </div>

          <div class="bw1-sidebar">
            <div class="bw1-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="bw1-heading">SKILLS</div>
              <div class="bw1-skills-grid">
                ${skills.map((s) => `<div class="bw1-skill-pill">${esc(s)}</div>`).join("")}
              </div>
            </div>

            ${
              tools && tools.length > 0
                ? `
            <div class="bw1-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="bw1-heading">TOOLS</div>
              <div class="bw1-skills-grid">
                ${tools.map((t: string) => `<div class="bw1-skill-pill">${esc(t)}</div>`).join("")}
              </div>
            </div>
            `
                : ""
            }

            <div class="bw1-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
              <div class="bw1-heading">EDUCATION</div>
              ${eduArray
                .map(
                  (edu) => `
                <div class="bw1-edu-item">
                  <div class="bw1-edu-degree">${esc(edu.degree)}</div>
                  <div class="bw1-edu-school">${esc(edu.school)}</div>
                  <div class="bw1-edu-year">${esc(edu.year)}</div>
                </div>
              `,
                )
                .join("")}
            </div>

            ${
              data.languages
                ? `
            <div class="bw1-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="bw1-heading">LANGUAGES</div>
              <div class="bw1-skills-grid">
                ${toArray(data.languages)
                  .map(
                    (l: string) =>
                      `<div class="bw1-skill-pill">${esc(l.trim())}</div>`,
                  )
                  .join("")}
              </div>
            </div>
            `
                : ""
            }

            ${
              data.certifications && data.certifications.length > 0
                ? `
            <div class="bw1-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="bw1-heading">CERTIFICATES</div>
              ${data.certifications
                .map(
                  (c: any) => `
                <div class="bw1-edu-item">
                  <div class="bw1-edu-degree">${esc(c.title)}</div>
                  <div class="bw1-edu-school">${esc(c.issuer)}</div>
                  <div class="bw1-edu-year">${esc(c.year)}</div>
                </div>
              `,
                )
                .join("")}
            </div>
            `
                : ""
            }

            ${
              data.interests
                ? `
            <div class="bw1-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="bw1-heading">INTERESTS</div>
              <div class="bw1-skills-grid">
                ${toArray(data.interests)
                  .map(
                    (i: string) =>
                      `<div class="bw1-skill-pill">${esc(i.trim())}</div>`,
                  )
                  .join("")}
              </div>
            </div>
            `
                : ""
            }
          </div>
        </div>
      </div>
    `;
  } else if (templateId === "BlackWolf-2") {
    // BLACKWOLF-2: STACKED PROFESSIONAL (Clean Redesign)
    htmlContent = `
      <div class="page bw2-layout">
        <div class="bw2-header" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div class="bw2-name">${esc(data.name)}</div>
          <div class="bw2-title">${esc(data.title)}</div>
          <div class="bw2-contact-row">
            <div class="bw2-c-item">${svgPhone} ${esc(data.phone)}</div>
            <div class="bw2-c-item">${svgEmail} ${esc(data.email)}</div>
            <div class="bw2-c-item">${svgLocation} ${esc(data.location)}</div>
          </div>
        </div>

        <div class="bw2-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div class="bw2-heading">SUMMARY</div>
          <div class="bw2-summary">${esc(data.summary)}</div>
        </div>

        <div class="bw2-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
          <div class="bw2-heading">WORK EXPERIENCE</div>
          ${(data.experience || [])
            .map(
              (exp: any) => `
            <div class="bw2-item">
              <div class="bw2-item-header">
                <div class="bw2-item-title">${esc(exp.role)}</div>
                <div class="bw2-item-date">${esc(exp.period)}</div>
              </div>
              <div class="bw2-item-sub">${esc(exp.company)}</div>
              <div class="bw2-item-desc">
                ${(exp.description || "")
                  .split("\n")
                  .map(
                    (line: string) => `
                  <div class="bw2-bullet-item">${esc(line.trim().replace(/^[•*-]\s*/, ""))}</div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          `,
            )
            .join("")}
        </div>

        <div class="bw2-grid-2">
          <div class="bw2-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
            <div class="bw2-heading">EDUCATION</div>
            ${eduArray
              .map(
                (edu) => `
              <div class="bw2-item">
                <div class="bw2-item-header">
                  <div class="bw2-item-title" style="font-size: 10pt;">${esc(edu.degree)}</div>
                  <div class="bw2-item-date" style="font-size: 8pt;">${esc(edu.year)}</div>
                </div>
                <div class="bw2-item-sub" style="font-size: 9pt;">${esc(edu.school)}</div>
              </div>
            `,
              )
              .join("")}
          </div>

          <div class="bw2-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="bw2-heading">SKILLS & EXPERTISE</div>
            <div class="bw2-skills-wrap">
              ${skills.map((s) => `<div class="bw2-skill-tag">${esc(s)}</div>`).join("")}
            </div>
          </div>
        </div>

        ${
          data.projects && data.projects.length > 0
            ? `
        <div class="bw2-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
          <div class="bw2-heading">KEY PROJECTS</div>
          <div class="bw2-grid-2">
            ${data.projects
              .map(
                (proj: any) => `
              <div class="bw2-item">
                <div class="bw2-item-title">${esc(proj.name)}</div>
                <div class="bw2-item-desc" style="font-size: 9pt;">${esc(proj.description)}</div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
        `
            : ""
        }

      </div>
    `;
  } else if (templateId === "BlackWolf-3") {
    // BLACKWOLF-3: BORDERED PROFESSIONAL (From Image)
    htmlContent = `
      <div class="page bw3-layout">
        <div class="bw3-border-box">
          <div class="bw3-header" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="bw3-name">${esc(data.name)}</div>
            <div class="bw3-title">${esc(data.title)}</div>
            <div class="bw3-contact-bar">
              <div class="bw3-c-item">${svgPhone} ${esc(data.phone)}</div>
              <div class="bw3-c-item">${svgLocation} ${esc(data.location)}</div>
              <div class="bw3-c-item">${svgEmail} ${esc(data.email)}</div>
            </div>
          </div>

          <div class="bw3-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="bw3-s-title">ABOUT ME</div>
            <div class="bw3-s-line"></div>
            <div class="bw3-summary">${esc(data.summary)}</div>
          </div>

          <div class="bw3-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
            <div class="bw3-s-title">EDUCATION</div>
            <div class="bw3-s-line"></div>
            ${eduArray
              .map(
                (edu) => `
              <div class="bw3-split-row">
                <div class="bw3-split-left">
                  <div style="font-weight: 800; color: #1e293b; margin-bottom: 2pt;">${esc(edu.year)}</div>
                  <div>${esc(edu.school)}</div>
                </div>
                <div class="bw3-split-right">
                  <div class="bw3-item-title">${esc(edu.degree)}</div>
                  <div class="bw3-item-desc">Focused on advanced principles and practical application in the field of ${esc(edu.degree)}.</div>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>

          <div class="bw3-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
            <div class="bw3-s-title">EXPERIENCE</div>
            <div class="bw3-s-line"></div>
            ${(data.experience || [])
              .map(
                (exp: any) => `
              <div class="bw3-split-row">
                <div class="bw3-split-left">
                  <div style="font-weight: 800; color: #1e293b; margin-bottom: 2pt;">${esc(exp.period)}</div>
                  <div>${esc(exp.company)}</div>
                </div>
                <div class="bw3-split-right">
                  <div class="bw3-item-title">${esc(exp.role)}</div>
                  <div class="bw3-item-desc">${esc(exp.description)}</div>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>

          <div class="bw3-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="bw3-s-title">SKILLS & TOOLS</div>
            <div class="bw3-s-line"></div>
            <div class="bw3-skills-grid">
              ${[...skills, ...tools].map((s) => `<div class="bw3-skill-item">${esc(s)}</div>`).join("")}
            </div>
          </div>

          ${
            data.projects && data.projects.length > 0
              ? `
          <div class="bw3-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
            <div class="bw3-s-title">PROJECTS</div>
            <div class="bw3-s-line"></div>
            ${data.projects
              .map(
                (proj: any) => `
              <div class="bw3-split-row">
                <div class="bw3-split-right" style="width: 100%;">
                  <div class="bw3-item-title">${esc(proj.name)}</div>
                  <div class="bw3-item-desc">${esc(proj.description)}</div>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  } else if (templateId === "BlackWolf-4") {
    // BLACKWOLF-4: MINIMALIST TWO-COLUMN (From Image)
    const nameParts = (data.name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");

    htmlContent = `
      <div class="page bw4-layout">
        <!-- HEADER -->
        <div class="bw4-header-box" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div class="bw4-name-wrapper">
             <div class="bw4-name">${esc(data.name)}</div>
             <div class="bw4-title">${esc(data.title)}</div>
          </div>
        </div>
        
        <div class="bw4-summary-wide" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div class="bw4-summary-text">${esc(data.summary)}</div>
        </div>

        <div class="bw4-main-grid">
           <!-- LEFT COLUMN -->
           <div class="bw4-left-col">
              <div class="bw4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
                <div class="bw4-s-title">CONTACT</div>
                <div class="bw4-c-item"><span class="bw4-c-icon">${svgEmail}</span> ${esc(data.email)}</div>
                <div class="bw4-c-item"><span class="bw4-c-icon">${svgPhone}</span> ${esc(data.phone)}</div>
                <div class="bw4-c-item"><span class="bw4-c-icon">${svgLocation}</span> ${esc(data.location)}</div>
                ${data.website ? `<div class="bw4-c-item"><span class="bw4-c-icon">${svgLink}</span> ${esc(data.website)}</div>` : ""}
              </div>

              <div class="bw4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
                <div class="bw4-s-title">SKILLS</div>
                <div class="bw4-skills-list">
                  ${skills.map((s) => `<div class="bw4-skill-tag">${esc(s)}</div>`).join("")}
                </div>
              </div>

              <div class="bw4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
                <div class="bw4-s-title">EDUCATION</div>
                ${eduArray
                  .map(
                    (edu) => `
                  <div class="bw4-edu-item">
                    <div class="bw4-edu-year">${esc(edu.year)}</div>
                    <div class="bw4-edu-degree">${esc(edu.degree)}</div>
                    <div class="bw4-edu-school">${esc(edu.school)}</div>
                  </div>
                `,
                  )
                  .join("")}
              </div>

              ${
                languages.length > 0
                  ? `
              <div class="bw4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
                <div class="bw4-s-title">LANGUAGES</div>
                <div class="bw4-skills-list">
                  ${languages.map((l) => `<div class="bw4-skill-tag">${esc(l)}</div>`).join("")}
                </div>
              </div>
              `
                  : ""
              }
           </div>

           <!-- RIGHT COLUMN -->
           <div class="bw4-right-col">
              <div class="bw4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
                <div class="bw4-s-title">WORK EXPERIENCE</div>
                ${(data.experience || [])
                  .map(
                    (exp: any) => `
                  <div class="bw4-exp-item">
                    <div class="bw4-exp-header">
                      <div class="bw4-exp-role">${esc(exp.role)}</div>
                      <div class="bw4-exp-date">${esc(exp.period)}</div>
                    </div>
                    <div class="bw4-exp-company">${esc(exp.company)}</div>
                    <div class="bw4-exp-desc">${esc(exp.description)}</div>
                  </div>
                `,
                  )
                  .join("")}
              </div>

              ${
                data.projects && data.projects.length > 0
                  ? `
              <div class="bw4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
                <div class="bw4-s-title">KEY PROJECTS</div>
                ${data.projects
                  .map(
                    (proj: any) => `
                  <div class="bw4-exp-item">
                    <div class="bw4-exp-header">
                      <div class="bw4-exp-role">${esc(proj.name)}</div>
                    </div>
                    <div class="bw4-exp-desc">${esc(proj.description)}</div>
                  </div>
                `,
                  )
                  .join("")}
              </div>
              `
                  : ""
              }
           </div>
        </div>
      </div>
    `;
  } else if (templateId === "Jocker-1") {
    // JOCKER-1: REDESIGNED (Two-Column Sidebar Layout)
    htmlContent = `
      <div class="page jk1-layout">
        <div class="jk1-sidebar" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div class="jk1-photo-area" onclick="window.ReactNativeWebView.postMessage('edit:personal:photo')">
            <div class="jk1-photo-box">
              ${data.photo ? `<img src="${data.photo}" class="jk1-photo">` : ""}
            </div>
          </div>
          <div class="jk1-sidebar-content">
            <div class="jk1-s-section">
              <div class="jk1-s-title">Contact</div>
              <div class="jk1-s-item"><strong>Phone</strong><br/>${esc(data.phone)}</div>
              <div class="jk1-s-item"><strong>Email</strong><br/>${esc(data.email)}</div>
              <div class="jk1-s-item"><strong>Address</strong><br/>${esc(data.location)}</div>
            </div>
            
            <div class="jk1-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
              <div class="jk1-s-title">Education</div>
              ${eduArray
                .map(
                  (edu) => `
                <div class="jk1-s-item">
                  <strong style="color: #ec4899;">${esc(edu.year)}</strong><br/>
                  <span style="font-weight: 700;">${esc(edu.degree)}</span><br/>
                  ${esc(edu.school)}
                </div>
              `,
                )
                .join("")}
            </div>

            <div class="jk1-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="jk1-s-title">Skills</div>
              <ul class="jk1-s-list">
                ${skills.map((s) => `<li>${esc(s)}</li>`).join("")}
              </ul>
            </div>

            <div class="jk1-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="jk1-s-title">Language</div>
              <ul class="jk1-s-list">
                ${languages.map((l) => `<li>${esc(l)}</li>`).join("")}
              </ul>
            </div>
          </div>
        </div>

        <div class="jk1-main">
          <div class="jk1-header" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="jk1-name">${esc(data.name)}</div>
            <div class="jk1-job">${esc(data.title)}</div>
            <div class="jk1-summary">${esc(data.summary)}</div>
          </div>

          <div class="jk1-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
            <div class="jk1-section-title">Experience</div>
            <div class="jk1-timeline">
              ${(data.experience || [])
                .map(
                  (exp: any) => `
                <div class="jk1-exp-item">
                  <div class="jk1-exp-dot"></div>
                  <div class="jk1-exp-header">
                    <span class="jk1-exp-date">${esc(exp.period)}</span>
                    <span class="jk1-exp-company">${esc(exp.company)}</span>
                  </div>
                  <div class="jk1-exp-role">${esc(exp.role)}</div>
                  <div class="jk1-exp-desc">${esc(exp.description)}</div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>

          ${
            data.projects && data.projects.length > 0
              ? `
          <div class="jk1-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
            <div class="jk1-section-title">Projects</div>
            <div class="jk1-timeline">
              ${(data.projects || [])
                .map(
                  (proj: any) => `
                <div class="jk1-exp-item">
                  <div class="jk1-exp-dot"></div>
                  <div class="jk1-exp-header">
                    <span class="jk1-exp-role">${esc(proj.name)}</span>
                  </div>
                  <div class="jk1-exp-desc">${esc(proj.description)}</div>
                  ${proj.link ? `<div class="jk1-exp-desc" style="color: #ec4899; font-weight: 600; margin-top: 4pt;">${esc(proj.link)}</div>` : ""}
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  } else if (templateId === "Jocker-2") {
    const nameParts = (data.name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    htmlContent = `
      <div class="page jk2-layout">
        <div class="jk2-sidebar">
          <div class="jk2-photo-frame placeable" data-field="photo">
            <div class="jk2-photo-box">
              ${data.photo ? `<img src="${data.photo}" class="jk2-photo">` : ""}
            </div>
          </div>

          <div class="draggable-group">
            <div class="jk2-s-section draggable-section" data-section="personal">
              <div class="jk2-s-header">ABOUT ME</div>
              <div class="jk2-s-text editable" data-field="summary">${esc(data.summary)}</div>
            </div>

            <div class="jk2-s-section draggable-section" data-section="contact">
              <div class="jk2-s-header">CONTACT</div>
              <div class="jk2-c-list">
                <div class="jk2-c-item">
                  <div class="jk2-c-icon">${svgPhone}</div>
                  <span class="editable" data-field="phone">${esc(data.phone)}</span>
                </div>
                <div class="jk2-c-item">
                  <div class="jk2-c-icon">${svgEmail}</div>
                  <span class="editable" data-field="email">${esc(data.email)}</span>
                </div>
                <div class="jk2-c-item">
                  <div class="jk2-c-icon">${svgLocation}</div>
                  <span class="editable" data-field="location">${esc(data.location)}</span>
                </div>
              </div>
            </div>

            <div class="jk2-s-section draggable-section" data-section="skills">
              <div class="jk2-s-header">SKILLS</div>
              <ul class="jk2-list">
                ${skills.map((s) => `<li class="editable" data-field="skills">${esc(s)}</li>`).join("")}
              </ul>
            </div>

            <div class="jk2-s-section draggable-section" data-section="languages">
              <div class="jk2-s-header">LANGUAGES</div>
              <ul class="jk2-list">
                ${languages.map((l) => `<li class="editable" data-field="languages">${esc(l)}</li>`).join("")}
              </ul>
            </div>
          </div>
        </div>

        <div class="jk2-main">
          <div class="jk2-name-area">
            <div class="jk2-name editable placeable" data-field="name">${esc(data.name)}</div>
            <div class="jk2-job editable placeable" data-field="title">${esc(data.title)}</div>
          </div>

          <div class="jk2-section draggable-section" data-section="experience">
            <div class="jk2-section-bar">WORK EXPERIENCE</div>
            ${(data.experience || [])
              .map(
                (exp: any) => `
              <div class="jk2-exp-item">
                <div class="jk2-exp-role editable" data-field="exp-role" data-id="${exp.id}">${esc(exp.role)}</div>
                <div class="jk2-exp-company editable" data-field="exp-company" data-id="${exp.id}">${esc(exp.company)}</div>
                <div class="jk2-exp-date editable" data-field="exp-period" data-id="${exp.id}">${esc(exp.period)}</div>
                <div class="jk2-exp-desc editable" data-field="exp-description" data-id="${exp.id}">${esc(exp.description)}</div>
              </div>
            `,
              )
              .join("")}
          </div>

          <div class="jk2-section draggable-section" data-section="education">
            <div class="jk2-section-bar">EDUCATION</div>
            ${eduArray
              .map(
                (edu) => `
              <div class="jk2-exp-item">
                <div class="jk2-exp-role editable" data-field="edu-degree" data-id="${edu.id}">${esc(edu.degree)}</div>
                <div class="jk2-exp-company editable" data-field="edu-school" data-id="${edu.id}">${esc(edu.school)}</div>
                <div class="jk2-exp-date editable" data-field="edu-year" data-id="${edu.id}">${esc(edu.year)}</div>
              </div>
            `,
              )
              .join("")}
          </div>

          ${
            data.projects && data.projects.length > 0
              ? `
          <div class="jk2-section draggable-section" data-section="projects">
            <div class="jk2-section-bar">PROJECTS</div>
            ${(data.projects || [])
              .map(
                (proj: any) => `
              <div class="jk2-exp-item">
                <div class="jk2-exp-role editable" data-field="proj-name" data-id="${proj.id}">${esc(proj.name)}</div>
                <div class="jk2-exp-desc editable" data-field="proj-description" data-id="${proj.id}">${esc(proj.description)}</div>
                ${proj.link ? `<div class="jk2-exp-desc editable" data-field="proj-link" data-id="${proj.id}" style="color: #a67c52; font-weight: 700; margin-top: 2pt;">${esc(proj.link)}</div>` : ""}
              </div>
            `,
              )
              .join("")}
          </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  } else if (templateId === "Jocker-3") {
    const nameParts = (data.name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    htmlContent = `
      <div class="page jk3-layout">
        <!-- LEFT SIDEBAR -->
        <div class="jk3-sidebar" style="background-color: ${primaryColor};">
          <div class="jk3-photo-box placeable" data-field="photo">
            ${data.photo ? `<img src="${data.photo}" class="jk3-photo">` : ""}
          </div>
          
          <div class="jk3-contact-section">
            <div class="jk3-s-title-light">CONTACT</div>
            <div class="jk3-c-item">${svgEmail} ${esc(data.email)}</div>
            <div class="jk3-c-item">${svgPhone} ${esc(data.phone)}</div>
            <div class="jk3-c-item">${svgLocation} ${esc(data.location)}</div>
            ${data.website ? `<div class="jk3-c-item">${svgLink} ${esc(data.website)}</div>` : ""}
          </div>

          <div class="jk3-skills-section">
            <div class="jk3-s-title-light">SKILLS</div>
            <div class="jk3-skills-list">
              ${skills.map((s) => `<div class="jk3-skill-tag">${esc(s)}</div>`).join("")}
            </div>
          </div>
          
          ${
            languages.length > 0
              ? `
          <div class="jk3-skills-section">
            <div class="jk3-s-title-light">LANGUAGES</div>
            <div class="jk3-skills-list">
              ${languages.map((l) => `<div class="jk3-skill-tag">${esc(l)}</div>`).join("")}
            </div>
          </div>
          `
              : ""
          }
          
          ${
            eduArray.length > 0
              ? `
          <div class="jk3-skills-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
            <div class="jk3-s-title-light">EDUCATION</div>
            <div class="jk3-edu-list">
              ${eduArray
                .map(
                  (edu) => `
                <div class="jk3-edu-item">
                  <div class="jk3-edu-year">${esc(edu.year)}</div>
                  <div class="jk3-edu-degree">${esc(edu.degree)}</div>
                  <div class="jk3-edu-school">${esc(edu.school)}</div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
          `
              : ""
          }
        </div>

        <!-- RIGHT MAIN -->
        <div class="jk3-main">
          <div class="jk3-header" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="jk3-name">${esc(data.name)}</div>
            <div class="jk3-title" style="color: ${primaryColor};">${esc(data.title)}</div>
          </div>
          
          <div class="jk3-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="jk3-s-title">ABOUT ME</div>
            <div class="jk3-summary">${esc(data.summary)}</div>
          </div>
          
          <div class="jk3-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
            <div class="jk3-s-title">EXPERIENCE</div>
            <div class="jk3-timeline">
              ${(data.experience || [])
                .map(
                  (exp: any) => `
                <div class="jk3-exp-item">
                  <div class="jk3-exp-date" style="color: ${primaryColor};">${esc(exp.period)}</div>
                  <div class="jk3-exp-content">
                    <div class="jk3-exp-role">${esc(exp.role)}</div>
                    <div class="jk3-exp-company">${esc(exp.company)}</div>
                    <ul class="jk3-exp-desc">
                      ${(exp.description || "")
                        .split("\n")
                        .map((line: string) =>
                          line.trim()
                            ? `<li>${esc(line.trim().replace(/^[•*-]\s*/, ""))}</li>`
                            : "",
                        )
                        .join("")}
                    </ul>
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
          

          
          ${
            data.projects && data.projects.length > 0
              ? `
          <div class="jk3-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
            <div class="jk3-s-title">PROJECTS</div>
            <div class="jk3-timeline">
              ${(data.projects || [])
                .map(
                  (proj: any) => `
                <div class="jk3-exp-item">
                  <div class="jk3-exp-date" style="color: ${primaryColor};"></div>
                  <div class="jk3-exp-content">
                    <div class="jk3-exp-role">${esc(proj.name)}</div>
                    <ul class="jk3-exp-desc">
                      ${(proj.description || "")
                        .split("\n")
                        .map((line: string) =>
                          line.trim()
                            ? `<li>${esc(line.trim().replace(/^[•*-]\s*/, ""))}</li>`
                            : "",
                        )
                        .join("")}
                    </ul>
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  } else if (templateId === "Jocker-4") {
    // JOCKER-4: THE MINIMALIST TRICK (Typographic Focus)
    htmlContent = `
      <div class="page jk4-layout">
        <div class="jk4-left">
          <div class="jk4-name-box" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="jk4-name">${esc(data.name)}</div>
            <div class="jk4-job" style="color: ${primaryColor};">${esc(data.title)}</div>
          </div>
          
          ${data.photo ? `<img src="${data.photo}" class="jk4-photo" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">` : ""}
          
          <div class="jk4-contact-box" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="jk4-contact-item">${svgEmail} <span>${esc(data.email)}</span></div>
            <div class="jk4-contact-item">${svgPhone} <span>${esc(data.phone)}</span></div>
            <div class="jk4-contact-item">${svgLocation} <span>${esc(data.location)}</span></div>
            ${data.website ? `<div class="jk4-contact-item">${svgLink} <span>${esc(data.website)}</span></div>` : ""}
          </div>

          <div class="jk4-side-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="jk4-s-title" style="color: ${primaryColor}; font-size: 12pt;">Skills</div>
            <div class="jk4-skills-flex">
              ${skills.map((s) => `<div class="jk4-skill-pill">${esc(s)}</div>`).join("")}
            </div>
          </div>
          
          ${
            languages.length > 0
              ? `
          <div class="jk4-side-section" onclick="window.ReactNativeWebView.postMessage('edit:section:languages')">
            <div class="jk4-s-title" style="color: ${primaryColor}; font-size: 12pt;">Languages</div>
            <div class="jk4-skills-flex">
              ${languages.map((l) => `<div class="jk4-skill-pill jk4-lang-pill">${esc(l)}</div>`).join("")}
            </div>
          </div>
          `
              : ""
          }

          <div class="jk4-side-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
            <div class="jk4-s-title" style="color: ${primaryColor}; font-size: 12pt;">Education</div>
            <div class="jk4-edu-list">
              ${eduArray
                .map(
                  (edu) => `
                <div class="jk4-edu-item">
                  <div class="jk4-edu-degree">${esc(edu.degree)}</div>
                  <div class="jk4-edu-school">${esc(edu.school)}</div>
                  <div class="jk4-edu-year">${esc(edu.year)}</div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        </div>

        <div class="jk4-right">
          <!-- SUMMARY -->
          <div class="jk4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="jk4-s-title" style="color: ${primaryColor};">Profile</div>
            <div class="jk4-text">${esc(data.summary)}</div>
          </div>

          <!-- EXPERIENCE -->
          <div class="jk4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
            <div class="jk4-s-title" style="color: ${primaryColor};">Experience</div>
            ${(data.experience || [])
              .map(
                (exp: any) => `
              <div class="jk4-item">
                <div class="jk4-item-header">
                  <div class="jk4-item-role">${esc(exp.role)}</div>
                  <div class="jk4-item-date">${esc(exp.period)}</div>
                </div>
                <div class="jk4-item-company">${esc(exp.company)}</div>
                <ul class="jk4-desc-list">
                  ${(exp.description || "")
                    .split("\n")
                    .map((line: string) =>
                      line.trim()
                        ? `<li>${esc(line.trim().replace(/^[•*-]\s*/, ""))}</li>`
                        : "",
                    )
                    .join("")}
                </ul>
              </div>
            `,
              )
              .join("")}
          </div>

          <!-- PROJECTS -->
          ${
            data.projects && data.projects.length > 0
              ? `
          <div class="jk4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
            <div class="jk4-s-title" style="color: ${primaryColor};">Projects</div>
            ${(data.projects || [])
              .map(
                (proj: any) => `
              <div class="jk4-item">
                <div class="jk4-item-header">
                  <div class="jk4-item-role">${esc(proj.name)}</div>
                </div>
                <ul class="jk4-desc-list">
                  ${(proj.description || "")
                    .split("\n")
                    .map((line: string) =>
                      line.trim()
                        ? `<li>${esc(line.trim().replace(/^[•*-]\s*/, ""))}</li>`
                        : "",
                    )
                    .join("")}
                </ul>
              </div>
            `,
              )
              .join("")}
          </div>
          `
              : ""
          }

        </div>
      </div>
    `;
  } else if (templateId === "Jocker-5") {
    // JOCKER-5: THE ROYAL FLUSH (Hero Bar, Timeline Stacked)
    const jk5Name = data.name || "John Doe";
    const jk5Title = data.title || "Creative Director";
    const jk5Summary =
      data.summary ||
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.";
    const jk5Email = data.email || "hello@johndoe.com";
    const jk5Phone = data.phone || "+1 (555) 123-4567";
    const jk5Location = data.location || "New York, NY";
    const jk5Website = data.website || "johndoe.com";

    const jk5Exp =
      data.experience && data.experience.length > 0
        ? data.experience
        : [
            {
              role: "Design Lead",
              company: "Creative Agency",
              period: "2020 - Present",
              description:
                "• Led a team of 5 designers to create award-winning digital experiences.\n• Improved user retention by 40% through UX research and iterative design.\n• Spearheaded the transition to a new unified design system across platforms.\n• Mentored junior designers and established new review processes.",
            },
          ];

    const jk5Proj =
      data.projects && data.projects.length > 0
        ? data.projects
        : [
            {
              name: "E-Commerce Redesign",
              description:
                "• Overhauled the checkout flow, resulting in a 25% increase in conversions.\n• Conducted A/B testing across multiple user segments.",
            },
            {
              name: "Fintech Dashboard UI",
              description:
                "• Built a completely new platform architecture\n• Reached 100k users in first month",
            },
          ];

    const jk5Skills =
      skills.length > 0
        ? skills
        : [
            "UI/UX Design",
            "Figma",
            "Prototyping",
            "User Research",
            "Design Systems",
            "Webflow",
          ];
    const jk5Langs =
      languages.length > 0
        ? languages
        : ["English (Native)", "Spanish (Conversational)"];
    const jk5Edu =
      eduArray.length > 0
        ? eduArray
        : [
            {
              degree: "Bachelor of Fine Arts in Design",
              school: "State University",
              year: "2013 - 2017",
            },
          ];

    htmlContent = `
      <div class="page jk5-layout">
        <!-- TOP ROW -->
        <div class="jk5-bento-row jk5-top-row">
          <div class="jk5-bento-card jk5-card-profile" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="jk5-profile-text">
              <div class="jk5-name">${esc(jk5Name)}</div>
              <div class="jk5-title" style="color: ${primaryColor};">${esc(jk5Title)}</div>
            </div>
            ${data.photo ? `<img src="${data.photo}" class="jk5-photo">` : ""}
          </div>
          
          <div class="jk5-bento-card jk5-card-contact" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="jk5-contact-list">
              <div class="jk5-contact-item">${svgEmail} <span>${esc(jk5Email)}</span></div>
              <div class="jk5-contact-item">${svgPhone} <span>${esc(jk5Phone)}</span></div>
              <div class="jk5-contact-item">${svgLocation} <span>${esc(jk5Location)}</span></div>
              <div class="jk5-contact-item">${svgLink} <span>${esc(jk5Website)}</span></div>
            </div>
          </div>
        </div>
        
        <!-- MAIN COLUMNS -->
        <div class="jk5-bento-cols">
          <!-- LEFT COLUMN (70%) -->
          <div class="jk5-bento-col-main">
            <!-- SUMMARY -->
            <div class="jk5-bento-card" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="jk5-s-title" style="color: ${primaryColor};">About Me</div>
              <div class="jk5-text">${esc(jk5Summary)}</div>
            </div>

            <!-- EXPERIENCE -->
            <div class="jk5-bento-card" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
              <div class="jk5-s-title" style="color: ${primaryColor};">Experience</div>
              <div class="jk5-exp-list">
                ${jk5Exp
                  .slice(0, 1)
                  .map(
                    (exp: any) => `
                  <div class="jk5-exp-item">
                    <div class="jk5-exp-header">
                      <div class="jk5-exp-role">${esc(exp.role)}</div>
                      <div class="jk5-exp-date">${esc(exp.period)}</div>
                    </div>
                    <div class="jk5-exp-company">${esc(exp.company)}</div>
                    <ul class="jk5-desc">
                      ${(exp.description || "")
                        .split("\n")
                        .map((line: string) =>
                          line.trim()
                            ? `<li>${esc(line.trim().replace(/^[•*-]\s*/, ""))}</li>`
                            : "",
                        )
                        .join("")}
                    </ul>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN (30%) -->
          <div class="jk5-bento-col-side">
            <!-- SKILLS -->
            <div class="jk5-bento-card" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="jk5-s-title" style="color: ${primaryColor};">Skills</div>
              <div class="jk5-skills-flex">
                ${jk5Skills.map((s: string) => `<div class="jk5-skill-pill">${esc(s)}</div>`).join("")}
              </div>
            </div>

            <!-- LANGUAGES -->
            <div class="jk5-bento-card" onclick="window.ReactNativeWebView.postMessage('edit:section:languages')">
              <div class="jk5-s-title" style="color: ${primaryColor};">Languages</div>
              <div class="jk5-skills-flex">
                ${jk5Langs.map((l: string) => `<div class="jk5-skill-pill jk5-lang-pill">${esc(l)}</div>`).join("")}
              </div>
            </div>

            <!-- EDUCATION -->
            <div class="jk5-bento-card" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
              <div class="jk5-s-title" style="color: ${primaryColor};">Education</div>
              <div class="jk5-edu-list">
                ${jk5Edu
                  .map(
                    (edu: any) => `
                  <div class="jk5-edu-item">
                    <div class="jk5-edu-degree">${esc(edu.degree)}</div>
                    <div class="jk5-edu-school">${esc(edu.school)}</div>
                    <div class="jk5-edu-year">${esc(edu.year)}</div>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>

        <!-- FULL WIDTH PROJECTS -->
        <div class="jk5-bento-card" style="width: 100%; box-sizing: border-box;" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
          <div class="jk5-s-title" style="color: ${primaryColor};">Projects</div>
          <div class="jk5-exp-list">
            ${jk5Proj
              .map(
                (proj: any) => `
              <div class="jk5-exp-item">
                <div class="jk5-exp-header">
                  <div class="jk5-exp-role">${esc(proj.name)}</div>
                </div>
                <ul class="jk5-desc">
                  ${(proj.description || "")
                    .split("\n")
                    .map((line: string) =>
                      line.trim()
                        ? `<li>${esc(line.trim().replace(/^[•*-]\s*/, ""))}</li>`
                        : "",
                    )
                    .join("")}
                </ul>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  } else if (templateId === "Elder-2" || templateId === "ats") {
    // ELDER-2: ATS MASTER (Full Width, High Density)
    htmlContent = `
      <div class="page ats-layout">
        <div class="main full-width">
          <div class="identity-ats" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="name-ats">${esc(data.name)}</div>
            <div class="title-ats">${esc(data.title)}</div>
            <div class="contact-row-ats">
              <span>${esc(data.email)}</span> | <span>${esc(data.phone)}</span> | <span>${esc(data.location)}</span>
            </div>
          </div>

          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="m-heading">PROFESSIONAL SUMMARY</div>
            <div class="m-text">${esc(data.summary)}</div>
          </div>

          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="m-heading">CORE COMPETENCIES</div>
            <div class="skills-grid-ats">${skills.map((s) => `<div class="skill-tag-ats">${esc(s)}</div>`).join("")}</div>
          </div>

          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
            <div class="m-heading">PROFESSIONAL EXPERIENCE</div>
            <div class="exp-list-ats">
              ${expItems}
            </div>
          </div>

          ${
            projectItems
              ? `
          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
            <div class="m-heading">KEY PROJECTS</div>
            ${projectItems}
          </div>
          `
              : ""
          }

          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
            <div class="m-heading">EDUCATION</div>
            ${eduArray
              .map(
                (edu) => `
              <div class="edu-item">
                <div class="exp-row">
                  <div class="exp-role">${esc(edu.degree)}</div>
                  <div class="exp-date">${esc(edu.year)}</div>
                </div>
                <div class="exp-company">${esc(edu.school)}</div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  } else if (templateId === "Elder-3" || templateId === "linkedin") {
    // ELDER-3: LINKEDIN SIGNATURE (Top Header, Clean Blue)
    htmlContent = `
      <div class="page linkedin-layout">
        <div class="header-linkedin" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div class="header-main-li">
            <div class="photo-container-li" onclick="window.ReactNativeWebView.postMessage('edit:personal:photo')">
               ${data.photo ? `<img src="${data.photo}" class="photo">` : ""}
            </div>
            <div class="header-info-li">
              <div class="name-li">${esc(data.name)}</div>
              <div class="title-li">${esc(data.title)}</div>
            </div>
          </div>
          <div class="contact-grid-li">
            <div class="c-item-li"><span class="s-icon">${svgEmail}</span> ${esc(data.email)}</div>
            <div class="c-item-li"><span class="s-icon">${svgPhone}</span> ${esc(data.phone)}</div>
            <div class="c-item-li"><span class="s-icon">${svgLocation}</span> ${esc(data.location)}</div>
          </div>
        </div>
        <div class="main-li">
           <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="m-heading-li">ABOUT</div>
            <div class="m-text">${esc(data.summary)}</div>
          </div>
          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
            <div class="m-heading-li">EXPERIENCE</div>
            ${expItems}
          </div>
          ${
            projectItems
              ? `
          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
            <div class="m-heading-li">PROJECTS</div>
            ${projectItems}
          </div>
          `
              : ""
          }
          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="m-heading-li">SKILLS</div>
            <div class="skills-li">${skills.join(" • ")}</div>
          </div>
        </div>
      </div>
    `;
  } else if (templateId === "Elder-4") {
    // ELDER-4: TIMELINE BLUE (Image Layout)
    const nameParts = (data.name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");

    htmlContent = `
      <div class="page e4-layout">
        <div class="e4-sidebar">
          <div class="e4-photo-wrapper" onclick="window.ReactNativeWebView.postMessage('edit:personal:photo')">
            <div class="e4-photo-container">
              ${data.photo ? `<img src="${data.photo}" class="e4-photo">` : ""}
            </div>
          </div>
          
          <div class="e4-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="e4-s-heading">CONTACT</div>
            <div class="e4-s-item"><span class="e4-icon">${svgPhone}</span><br/>${esc(data.phone)}</div>
            <div class="e4-s-item"><span class="e4-icon">${svgEmail}</span><br/>${esc(data.email)}</div>
            <div class="e4-s-item"><span class="e4-icon">${svgLocation}</span><br/>${esc(data.location)}</div>
          </div>
          
          <div class="e4-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="e4-s-heading">SKILLS</div>
            <ul class="e4-s-list">
              ${skills.map((s) => `<li>${esc(s)}</li>`).join("")}
            </ul>
          </div>
          
          <div class="e4-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="e4-s-heading">LANGUAGES</div>
            <ul class="e4-s-list">
              ${languages.map((l) => `<li>${esc(l)}</li>`).join("")}
            </ul>
          </div>
        </div>
        
        <div class="e4-main">
          <div class="e4-header" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="e4-name"><span class="e4-first-name">${esc(firstName)}</span> <span class="e4-last-name">${esc(lastName)}</span></div>
            <div class="e4-title">${esc(data.title)}</div>
            <div class="e4-summary">${esc(data.summary)}</div>
          </div>
          
          <div class="e4-content">
            <div class="e4-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
              <div class="e4-m-heading">WORK EXPERIENCE</div>
              <div class="e4-timeline">
                ${expItems}
              </div>
            </div>
            
            ${
              projectItems
                ? `
            <div class="e4-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
              <div class="e4-m-heading">PROJECTS</div>
              <div class="e4-timeline">
                ${projectItems}
              </div>
            </div>
            `
                : ""
            }
            
            <div class="e4-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
              <div class="e4-m-heading">EDUCATION</div>
              <div class="e4-timeline">
                ${eduArray
                  .map(
                    (edu) => `
                  <div class="exp-item e4-edu-item">
                    <div class="exp-role e4-edu-degree">${esc(edu.degree)}</div>
                    <div class="exp-company e4-edu-school">${esc(edu.school)}</div>
                    <div class="exp-date e4-edu-date">${esc(edu.year)}</div>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (templateId === "Elder-5") {
    // ELDER-5: RIGHT SIDEBAR
    htmlContent = `
      <div class="page row-reverse">
        <div class="sidebar sidebar-right">
          <div class="photo-wrapper" onclick="window.ReactNativeWebView.postMessage('edit:personal:photo')">
            <div class="photo-container">
              ${data.photo ? `<img src="${data.photo}" class="photo">` : ""}
            </div>
          </div>
          <div class="identity" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="name">${esc(data.name)}</div>
            <div class="title">${esc(data.title)}</div>
          </div>
          <div class="s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="s-heading">CONTACT</div>
            <div class="s-item"><span class="s-icon">${svgPhone}</span> ${esc(data.phone)}</div>
            <div class="s-item"><span class="s-icon">${svgEmail}</span> ${esc(data.email)}</div>
            <div class="s-item"><span class="s-icon">${svgLocation}</span> ${esc(data.location)}</div>
          </div>
          <div class="s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="s-heading">SKILLS</div>
            <div class="s-list">
              ${skills.map((s) => `<div class="s-list-item">• ${esc(s)}</div>`).join("")}
            </div>
          </div>
          ${
            tools && tools.length > 0
              ? `
          <div class="s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="s-heading">TOOLS</div>
            <div class="s-list">
              ${tools.map((t: string) => `<div class="s-list-item">• ${esc(t)}</div>`).join("")}
            </div>
          </div>
          `
              : ""
          }
        </div>
        <div class="main">
          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="m-heading">PROFILE</div>
            <div class="m-text">${esc(data.summary)}</div>
          </div>
          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
            <div class="m-heading">WORK EXPERIENCE</div>
            ${expItems}
          </div>
          ${
            projectItems
              ? `
          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
            <div class="m-heading">PROJECTS</div>
            ${projectItems}
          </div>
          `
              : ""
          }
          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
            <div class="m-heading">EDUCATION</div>
            ${eduArray
              .map(
                (edu) => `
              <div class="edu-item">
                <div class="edu-degree">${esc(edu.degree)}</div>
                <div class="edu-date">${esc(edu.year)}</div>
                <div class="edu-school">${esc(edu.school)}</div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  } else if (templateId === "Elder-6") {
    // ELDER-6: RIBBON DARK
    htmlContent = `
      <div class="page e6-layout">
        <div class="e6-sidebar">
          <div class="e6-photo-wrapper" onclick="window.ReactNativeWebView.postMessage('edit:personal:photo')">
            <div class="e6-photo-container">
              ${data.photo ? `<img src="${data.photo}" class="e6-photo">` : ""}
            </div>
          </div>
          
          <div class="e6-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="e6-ribbon-heading">Contact</div>
            <div class="e6-s-item"><span class="e6-icon">${svgPhone}</span> ${esc(data.phone)}</div>
            <div class="e6-s-item"><span class="e6-icon">${svgEmail}</span> ${esc(data.email)}</div>
            <div class="e6-s-item"><span class="e6-icon">${svgLocation}</span> ${esc(data.location)}</div>
          </div>

          <div class="e6-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
            <div class="e6-ribbon-heading">Education</div>
            ${eduArray
              .map(
                (edu) => `
              <div class="e6-edu-item">
                <div class="e6-edu-degree">${esc(edu.degree)}</div>
                <div class="e6-edu-school">${esc(edu.school)}</div>
                <div class="e6-edu-date">${esc(edu.year)}</div>
              </div>
            `,
              )
              .join("")}
          </div>
          
          <div class="e6-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="e6-ribbon-heading">Skills</div>
            <ul class="e6-s-list">
              ${skills.map((s) => `<li>${esc(s)}</li>`).join("")}
            </ul>
          </div>
          
          <div class="e6-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="e6-ribbon-heading">Language</div>
            <ul class="e6-s-list">
              ${languages.map((l) => `<li>${esc(l)}</li>`).join("")}
            </ul>
          </div>

          ${
            tools && tools.length > 0
              ? `
          <div class="e6-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="e6-ribbon-heading">Tools</div>
            <ul class="e6-s-list">
              ${tools.map((t) => `<li>${esc(t)}</li>`).join("")}
            </ul>
          </div>
          `
              : ""
          }
        </div>
        
        <div class="e6-main">
          <div class="e6-header" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="e6-name">${esc(data.name)}</div>
            <div class="e6-title">${esc(data.title)}</div>
          </div>
          
          <div class="e6-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="e6-m-heading"><span>About Me</span></div>
            <div class="e6-summary">${esc(data.summary)}</div>
          </div>
          
          <div class="e6-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
            <div class="e6-m-heading"><span>Experience</span></div>
            ${expItems}
          </div>
          
          ${
            projectItems
              ? `
          <div class="e6-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
            <div class="e6-m-heading"><span>Projects</span></div>
            ${projectItems}
          </div>
          `
              : ""
          }

          ${
            data.certifications && data.certifications.length > 0
              ? `
          <div class="e6-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="e6-m-heading"><span>Certificates</span></div>
            <div class="e6-summary">
              ${data.certifications
                .map(
                  (c: any) => `
                <div style="margin-bottom: 10pt;">
                  <div style="font-weight: 700; color: #333;">${esc(c.title)}</div>
                  <div style="font-size: 9pt; color: #666;">${esc(c.issuer)} — ${esc(c.year)}</div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  } else if (templateId === "Elder-7") {
    // ELDER-7: MODERN SPLIT (Yellow Accents)
    const nameParts = (data.name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");

    htmlContent = `
      <div class="page e7-layout">
        <div class="e7-sidebar">
          <div class="e7-sidebar-top">
            <div class="e7-photo-container" onclick="window.ReactNativeWebView.postMessage('edit:personal:photo')">
              ${data.photo ? `<img src="${data.photo}" class="e7-photo">` : ""}
            </div>
            <div style="text-align: center;">
              <div class="e7-sidebar-title-badge">${esc(data.title)}</div>
            </div>
            
            <div class="e7-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
              <div class="e7-s-heading">EDUCATION</div>
              ${eduArray
                .map(
                  (edu) => `
                <div class="e7-edu-item">
                  <div class="e7-edu-degree">${esc(edu.degree)}</div>
                  <div class="e7-edu-school">${esc(edu.school)}</div>
                  <div class="e7-edu-date">${esc(edu.year)}</div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
          
          <div class="e7-sidebar-bottom">
            <div class="e7-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="e7-s-heading e7-dark-text">EXPERTISE</div>
              <ul class="e7-skills-list">
                ${skills.map((s) => `<li>${esc(s)}</li>`).join("")}
              </ul>
            </div>
            
            ${
              tools && tools.length > 0
                ? `
            <div class="e7-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="e7-s-heading e7-dark-text">TOOLS</div>
              <ul class="e7-skills-list">
                ${tools.map((t: string) => `<li>${esc(t)}</li>`).join("")}
              </ul>
            </div>
            `
                : ""
            }
            
            <div class="e7-contact-block" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="e7-c-row">
                <div class="e7-c-icon-wrapper"><span class="e7-c-icon">${svgPhone}</span></div>
                <div class="e7-c-text"><span class="e7-c-label">Phone</span><br/>${esc(data.phone)}</div>
              </div>
              <div class="e7-c-row">
                <div class="e7-c-icon-wrapper"><span class="e7-c-icon">${svgEmail}</span></div>
                <div class="e7-c-text"><span class="e7-c-label">Email</span><br/>${esc(data.email)}</div>
              </div>
              <div class="e7-c-row">
                <div class="e7-c-icon-wrapper"><span class="e7-c-icon">${svgLocation}</span></div>
                <div class="e7-c-text"><span class="e7-c-label">Area</span><br/>${esc(data.location)}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="e7-main">
          <div class="e7-header-bg" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="e7-name"><span class="e7-name-bold">${esc(firstName)}</span> <span class="e7-name-light">${esc(lastName)}</span></div>
            <div class="e7-title-badge">${esc(data.title)}</div>
            
            <div class="e7-m-section">
              <div class="e7-m-heading">PROFILE</div>
              <div class="e7-summary">${esc(data.summary)}</div>
            </div>
          </div>
          
          <div class="e7-content">
            <div class="e7-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
              <div class="e7-m-heading">WORK EXPERIENCE</div>
              <div class="e7-timeline">
                ${expItems}
              </div>
            </div>
            
            ${
              projectItems
                ? `
            <div class="e7-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
              <div class="e7-m-heading">PROJECTS</div>
              ${projectItems}
            </div>
            `
                : ""
            }
          </div>
        </div>
      </div>
    `;
  } else if (templateId === "Elder-8") {
    // ELDER-8: SKYLINE (Blue Border, Timelines)
    const nameParts = (data.name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");

    htmlContent = `
      <div class="page e8-layout">
        <div class="e8-corner-accent"></div>
        
        <div class="e8-sidebar">
          <div class="e8-photo-wrapper" onclick="window.ReactNativeWebView.postMessage('edit:personal:photo')">
            ${data.photo ? `<img src="${data.photo}" class="e8-photo">` : ""}
          </div>
          
          <div class="e8-s-timeline-container">
            <div class="e8-s-timeline-line"></div>
            
            <div class="e8-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
               <div class="e8-s-heading-row">
                  <div class="e8-s-icon-node">${svgUser}</div>
                  <div class="e8-s-heading">CONTACT ME</div>
               </div>
               <div class="e8-s-content">
                  <div class="e8-s-item"><span class="e8-s-item-icon">${svgPhone}</span> ${esc(data.phone)}</div>
                  <div class="e8-s-item"><span class="e8-s-item-icon">${svgEmail}</span> ${esc(data.email)}</div>
                  <div class="e8-s-item"><span class="e8-s-item-icon">${svgLocation}</span> ${esc(data.location)}</div>
               </div>
            </div>
            
            ${
              eduArray && eduArray.length > 0
                ? `
            <div class="e8-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
               <div class="e8-s-heading-row">
                  <div class="e8-s-icon-node">${svgEdu}</div>
                  <div class="e8-s-heading">EDUCATION</div>
               </div>
               <div class="e8-s-content">
                  ${eduArray
                    .map(
                      (edu) => `
                    <div class="e8-edu-item" style="margin-bottom: 15pt;">
                      <div class="e8-s-dot"></div>
                      <div class="e8-edu-school">${esc(edu.school)}</div>
                      <div class="e8-edu-degree">${esc(edu.degree)}</div>
                      <div class="e8-edu-date">${esc(edu.year)}</div>
                    </div>
                  `,
                    )
                    .join("")}
               </div>
            </div>
            `
                : ""
            }
            
            ${
              skills && skills.length > 0
                ? `
            <div class="e8-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
               <div class="e8-s-heading-row">
                  <div class="e8-s-icon-node">${svgSkills}</div>
                  <div class="e8-s-heading">SKILLS</div>
               </div>
               <div class="e8-s-content">
                  ${skills.map((s) => `<div class="e8-s-item" style="margin-bottom: 6pt;"><div class="e8-s-dot"></div> ${esc(s)}</div>`).join("")}
               </div>
            </div>
            `
                : ""
            }
            
            ${
              tools && tools.length > 0
                ? `
            <div class="e8-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
               <div class="e8-s-heading-row">
                  <div class="e8-s-icon-node">${svgTool}</div>
                  <div class="e8-s-heading">TOOLS</div>
               </div>
               <div class="e8-s-content">
                  ${tools.map((t: string) => `<div class="e8-s-item" style="margin-bottom: 6pt;"><div class="e8-s-dot"></div> ${esc(t)}</div>`).join("")}
               </div>
            </div>
            `
                : ""
            }
            
            ${
              data.certifications && data.certifications.length > 0
                ? `
            <div class="e8-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
               <div class="e8-s-heading-row">
                  <div class="e8-s-icon-node">${svgAward}</div>
                  <div class="e8-s-heading">CERTIFICATES</div>
               </div>
               <div class="e8-s-content">
                  ${data.certifications.map((c: any) => `<div class="e8-s-item" style="margin-bottom: 8pt; display: block;"><div class="e8-s-dot"></div> <div style="font-weight: 800; color: #fff; margin-bottom: 2pt;">${esc(c.title)}</div><div style="font-size: 8pt; color: #0ea5e9;">${esc(c.issuer)} - ${esc(c.year)}</div></div>`).join("")}
               </div>
            </div>
            `
                : ""
            }
            
            ${
              data.links && data.links.length > 0
                ? `
            <div class="e8-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
               <div class="e8-s-heading-row">
                  <div class="e8-s-icon-node">${svgLink}</div>
                  <div class="e8-s-heading">LINKS</div>
               </div>
               <div class="e8-s-content">
                  ${data.links.map((l: any) => `<div class="e8-s-item" style="margin-bottom: 6pt;"><div class="e8-s-dot"></div> <strong style="color: #fff; margin-right: 4pt;">${esc(l.label)}:</strong> <a href="${getHref(l.url)}" target="_blank" style="color: #0ea5e9; text-decoration: underline;">${esc(l.url)}</a></div>`).join("")}
               </div>
            </div>
            `
                : ""
            }
          </div>
        </div>
        
        <div class="e8-main">
          <div class="e8-header" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
             <div class="e8-name"><span class="e8-name-dark">${esc(firstName)}</span> <span class="e8-name-blue">${esc(lastName)}</span></div>
             <div class="e8-title">${esc(data.title)}</div>
          </div>
          
          <div class="e8-m-timeline-container">
            <div class="e8-m-timeline-line"></div>
            
            <div class="e8-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
               <div class="e8-m-heading-row">
                  <div class="e8-m-icon-node">${svgUser}</div>
                  <div class="e8-m-heading">ABOUT ME</div>
               </div>
               <div class="e8-m-content">
                  <div class="e8-summary">${esc(data.summary)}</div>
               </div>
            </div>
            
            <div class="e8-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
               <div class="e8-m-heading-row">
                  <div class="e8-m-icon-node">${svgBriefcase}</div>
                  <div class="e8-m-heading">JOB EXPERIENCE</div>
               </div>
               <div class="e8-m-content">
                  ${expItems}
               </div>
            </div>
            
            ${
              projectItems
                ? `
            <div class="e8-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
               <div class="e8-m-heading-row">
                  <div class="e8-m-icon-node">${svgBriefcase}</div>
                  <div class="e8-m-heading">PROJECTS</div>
               </div>
               <div class="e8-m-content">
                  ${projectItems}
               </div>
            </div>
            `
                : ""
            }
            
          </div>
        </div>
        </div>
      </div>
    `;
  } else if (templateId === "Titan-1") {
    // TITAN-1: PRO (Dark Curved Sidebar with Yellow Header)
    const nameParts = (data.name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");

    htmlContent = `
      <div class="page t1-layout">
        <div class="t1-sidebar">
          <div class="t1-photo-area">
            <div class="t1-photo-box" onclick="window.ReactNativeWebView.postMessage('edit:personal:photo')">
              ${data.photo ? `<img src="${data.photo}" class="t1-photo">` : ""}
            </div>
          </div>
          <div class="t1-dark-area">
            <div class="t1-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="t1-s-title">CONTACT</div>
              <div class="t1-s-item"><strong class="t1-s-label">Phone :</strong><br/>${esc(data.phone)}</div>
              <div class="t1-s-item"><strong class="t1-s-label">Email :</strong><br/>${esc(data.email)}</div>
              <div class="t1-s-item"><strong class="t1-s-label">Address :</strong><br/>${esc(data.location)}</div>
            </div>
            
            <div class="t1-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
              <div class="t1-s-title">EDUCATION</div>
              ${eduArray
                .map(
                  (edu) => `
                <div class="t1-s-item">
                  <strong class="t1-s-label">${esc(edu.degree)}</strong><br/>
                  ${esc(edu.school)}<br/>
                  From ${esc(edu.year)}
                </div>
              `,
                )
                .join("")}
            </div>
            
            ${
              data.certifications && data.certifications.length > 0
                ? `
            <div class="t1-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="t1-s-title">CERTIFICATES</div>
              ${data.certifications
                .map(
                  (c: any) => `
                <div class="t1-s-item">
                  <strong class="t1-s-label">${esc(c.title)}</strong><br/>
                  ${esc(c.issuer)}<br/>
                  ${esc(c.year)}
                </div>
              `,
                )
                .join("")}
            </div>
            `
                : ""
            }
            
            ${
              tools && tools.length > 0
                ? `
            <div class="t1-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="t1-s-title">TOOLS</div>
              ${tools
                .map(
                  (t: string) => `
                <div class="t1-s-item" style="margin-bottom: 4pt;">• ${esc(t)}</div>
              `,
                )
                .join("")}
            </div>
            `
                : ""
            }
            
            ${
              data.links && data.links.length > 0
                ? `
            <div class="t1-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="t1-s-title">LINKS</div>
              ${data.links
                .map(
                  (l: any) => `
                <div class="t1-s-item"><strong class="t1-s-label">${esc(l.label)} :</strong><br/><a href="${getHref(l.url)}" target="_blank" style="color: #3b82f6; text-decoration: underline;">${esc(l.url)}</a></div>
              `,
                )
                .join("")}
            </div>
            `
                : ""
            }
          </div>
        </div>
        
        <div class="t1-main">
          <div class="t1-header" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="t1-name"><span class="t1-name-bold">${esc(firstName)}</span> <span class="t1-name-light">${esc(lastName)}</span></div>
            <div class="t1-jobtitle">${esc(data.title)}</div>
          </div>
          <div class="t1-content">
            <div class="t1-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="t1-m-title">PROFILE</div>
              <div class="t1-m-text">${esc(data.summary)}</div>
            </div>
            
            <div class="t1-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
              <div class="t1-m-title">WORK EXPERIENCE</div>
              ${expItems}
            </div>
            
            ${
              projectItems
                ? `
            <div class="t1-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
              <div class="t1-m-title">PROJECTS</div>
              ${projectItems}
            </div>
            `
                : ""
            }
            

          </div>
        </div>
        </div>
      </div>
    `;
  } else if (templateId === "Titan-2") {
    // TITAN-2: DOME (Purple Dome Sidebar)
    const nameParts = (data.name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");

    htmlContent = `
      <div class="page t2-layout">
        <div class="t2-top">
          <div class="t2-dome-wrapper">
            <div class="t2-dome">
              <div class="t2-photo-box" onclick="window.ReactNativeWebView.postMessage('edit:personal:photo')">
                ${data.photo ? `<img src="${data.photo}" class="t2-photo">` : ""}
              </div>
            </div>
          </div>
          <div class="t2-header-right">
            <div class="t2-name" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')"><span class="t2-name-bold">${esc(firstName)}</span> <span class="t2-name-light">${esc(lastName)}</span></div>
            <div class="t2-title-badge">${esc(data.title)}</div>
            <div class="t2-summary">${esc(data.summary)}</div>
          </div>
        </div>
        
        <div class="t2-pills-row" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div class="t2-pill t2-pill-dark"><span class="t2-icon">${svgPhone}</span> ${esc(data.phone)}</div>
          <div class="t2-pill t2-pill-light"><span class="t2-icon">${svgLink}</span> <a href="${getHref(data.links?.[0]?.url || data.email)}" target="_blank" style="color: inherit; text-decoration: none;">${esc(data.links?.[0]?.url || data.email)}</a></div>
          <div class="t2-pill t2-pill-light"><span class="t2-icon">${svgLocation}</span> ${esc(data.location)}</div>
        </div>
        
        <div class="t2-columns">
          <div class="t2-sidebar">
            <div class="t2-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
              <div class="t2-s-title-row">
                <div class="t2-s-icon">${svgEdu}</div>
                <div class="t2-s-heading">EDUCATION</div>
              </div>
              ${eduArray
                .map(
                  (edu) => `
                <div class="t2-s-item">
                  <div class="t2-s-subtitle">${esc(edu.school)}</div>
                  <div class="t2-s-date">${esc(edu.year)}</div>
                  <div class="t2-s-item-title">${esc(edu.degree)}</div>
                </div>
              `,
                )
                .join("")}
            </div>
            
            ${
              data.certifications && data.certifications.length > 0
                ? `
            <div class="t2-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="t2-s-title-row">
                <div class="t2-s-icon">${svgAward}</div>
                <div class="t2-s-heading">CERTIFICATES</div>
              </div>
              ${data.certifications
                .map(
                  (c: any) => `
                <div class="t2-s-item">
                  <div class="t2-s-subtitle">${esc(c.issuer)}</div>
                  <div class="t2-s-date">${esc(c.year)}</div>
                  <div class="t2-s-item-title">${esc(c.title)}</div>
                </div>
              `,
                )
                .join("")}
            </div>
            `
                : ""
            }
            
            <div class="t2-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="t2-s-title-row">
                <div class="t2-s-icon">${svgSkills}</div>
                <div class="t2-s-heading">LANGUAGES</div>
              </div>
              ${languages
                .map(
                  (l) => `
                <div class="t2-lang-row">
                  <div class="t2-lang-name">${esc(l)}</div>
                  <div class="t2-lang-bar"><div class="t2-lang-fill"></div></div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
          
          <div class="t2-main">
            <div class="t2-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
              <div class="t2-m-title-row">
                <div class="t2-m-icon">${svgBriefcase}</div>
                <div class="t2-m-heading">JOB EXPERIENCE</div>
              </div>
              ${expItems}
            </div>
            
            ${
              projectItems
                ? `
            <div class="t2-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
              <div class="t2-m-title-row">
                <div class="t2-m-icon">${svgBriefcase}</div>
                <div class="t2-m-heading">PROJECTS</div>
              </div>
              ${projectItems}
            </div>
            `
                : ""
            }
            
            <div class="t2-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="t2-m-title-row">
                <div class="t2-m-icon">${svgTool}</div>
                <div class="t2-m-heading">SKILLS</div>
              </div>
              <div class="t2-skills-grid">
                ${skills
                  .map(
                    (s) => `
                  <div class="t2-skill-row">
                    <div class="t2-skill-name">${esc(s)}</div>
                    <div class="t2-skill-bar"><div class="t2-skill-fill"></div></div>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    `;
  } else if (templateId === "Titan-3") {
    // TITAN-3: SPLIT (Orange Accent - COMPACT REDESIGN)
    const nameParts = (data.name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");

    htmlContent = `
      <div class="page t3-layout">
        <div class="t3-sidebar">
          <div class="t3-photo-area">
            <div class="t3-photo-box" onclick="window.ReactNativeWebView.postMessage('edit:personal:photo')">
              ${data.photo ? `<img src="${data.photo}" class="t3-photo">` : ""}
            </div>
          </div>
          
          <div class="t3-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="t3-s-title">CONTACT</div>
            <div class="t3-s-item">
              <div class="t3-s-label">PHONE</div>
              <div class="t3-s-value">${esc(data.phone)}</div>
            </div>
            <div class="t3-s-item">
              <div class="t3-s-label">EMAIL</div>
              <div class="t3-s-value">${esc(data.email)}</div>
            </div>
            <div class="t3-s-item">
              <div class="t3-s-label">LOCATION</div>
              <div class="t3-s-value">${esc(data.location)}</div>
            </div>
            ${
              data.links && data.links.length > 0
                ? `
            <div class="t3-s-item">
              <div class="t3-s-label">${esc(data.links[0].label).toUpperCase()}</div>
              <div class="t3-s-value"><a href="${getHref(data.links[0].url)}" target="_blank" style="color: inherit; text-decoration: underline;">${esc(data.links[0].url)}</a></div>
            </div>
            `
                : ""
            }
          </div>
          
          <div class="t3-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="t3-s-title">LANGUAGES</div>
            <div class="t3-s-list">
              ${languages.map((l) => `<div class="t3-s-item-small">• ${esc(l)}</div>`).join("")}
            </div>
          </div>

          ${
            tools && tools.length > 0
              ? `
          <div class="t3-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="t3-s-title">TOOLS</div>
            <div class="t3-s-list">
              ${tools.map((t) => `<div class="t3-s-item-small">• ${esc(t)}</div>`).join("")}
            </div>
          </div>
          `
              : ""
          }
        </div>
        
        <div class="t3-main">
          <div class="t3-header" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="t3-name-row">
              <span class="t3-name-first">${esc(firstName)}</span>
              <span class="t3-name-last">${esc(lastName)}</span>
            </div>
            <div class="t3-jobtitle">${esc(data.title)}</div>
          </div>
          
          <div class="t3-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="t3-m-title"><span>PROFILE SUMMARY</span></div>
            <div class="t3-m-text">${esc(data.summary)}</div>
          </div>
          
          <div class="t3-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
            <div class="t3-m-title"><span>WORK EXPERIENCE</span></div>
            <div class="t3-exp-list">
              ${(data.experience || [])
                .map(
                  (exp: any) => `
                <div class="t3-exp-item">
                  <div class="t3-exp-header">
                    <div class="t3-exp-role">${esc(exp.role)}</div>
                    <div class="t3-exp-date">${esc(exp.period)}</div>
                  </div>
                  <div class="t3-exp-company">${esc(exp.company)}</div>
                  <div class="t3-exp-desc">${esc(exp.description)}</div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>

          <div class="t3-grid-2">
            <div class="t3-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
              <div class="t3-m-title"><span>EDUCATION</span></div>
              ${eduArray
                .map(
                  (edu) => `
                <div class="t3-edu-item">
                  <div class="t3-edu-degree">${esc(edu.degree)}</div>
                  <div class="t3-edu-school">${esc(edu.school)}</div>
                  <div class="t3-edu-year">${esc(edu.year)}</div>
                </div>
              `,
                )
                .join("")}
            </div>

            <div class="t3-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="t3-m-title"><span>EXPERTISE</span></div>
              <div class="t3-skills-grid">
                ${skills.map((s) => `<div class="t3-skill-item"><div class="t3-skill-dot"></div>${esc(s)}</div>`).join("")}
              </div>
            </div>
          </div>

          ${
            projectItems
              ? `
          <div class="t3-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
            <div class="t3-m-title"><span>KEY PROJECTS</span></div>
            <div class="t3-project-list">
              ${(data.projects || [])
                .map(
                  (proj: any) => `
                <div class="t3-project-item">
                  <div class="t3-project-name">${esc(proj.name)}</div>
                  <div class="t3-project-desc">${esc(proj.description)}</div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
          `
              : ""
          }

          ${
            data.certifications && data.certifications.length > 0
              ? `
          <div class="t3-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="t3-m-title"><span>CERTIFICATIONS</span></div>
            <div class="t3-cert-list">
              ${data.certifications
                .map(
                  (c: any) => `
                <div class="t3-cert-item">
                  <div class="t3-cert-name">${esc(c.title)}</div>
                  <div class="t3-cert-issuer">${esc(c.issuer)} | ${esc(c.year)}</div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  } else if (templateId === "Titan-4") {
    // TITAN-4: RUBY (Dark/Red theme)
    const nameParts = (data.name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");

    htmlContent = `
      <div class="page t4-layout">
        <div class="t4-sidebar">
          <div class="t4-photo-box" onclick="window.ReactNativeWebView.postMessage('edit:personal:photo')">
            ${data.photo ? `<img src="${data.photo}" class="t4-photo">` : ""}
          </div>
          
          <div class="t4-header" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="t4-name"><span class="t4-name-white">${esc(firstName)}</span><br/><span class="t4-name-red">${esc(lastName)}</span></div>
            <div class="t4-jobtitle">${esc(data.title)}</div>
          </div>
          
          <div class="t4-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="t4-heading-wrapper">
              <div class="t4-heading-icon">${svgSkills}</div>
              <div class="t4-heading-text">SKILLS</div>
            </div>
            ${skills
              .map(
                (s) => `
              <div class="t4-s-skill-row">
                <div class="t4-s-skill-name">${esc(s)}</div>
                <div class="t4-s-skill-bar"><div class="t4-s-skill-fill"></div></div>
              </div>
            `,
              )
              .join("")}
          </div>
          
          ${
            tools && tools.length > 0
              ? `
          <div class="t4-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="t4-heading-wrapper">
              <div class="t4-heading-icon">${svgTool}</div>
              <div class="t4-heading-text">TOOLS</div>
            </div>
            ${tools
              .map(
                (t) => `
              <div class="t4-s-skill-row">
                <div class="t4-s-skill-name">${esc(t)}</div>
                <div class="t4-s-skill-bar"><div class="t4-s-skill-fill"></div></div>
              </div>
            `,
              )
              .join("")}
          </div>
          `
              : ""
          }
          
          <div class="t4-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="t4-heading-wrapper">
              <div class="t4-heading-icon">${svgAward}</div>
              <div class="t4-heading-text">LANGUAGES</div>
            </div>
            ${languages
              .map(
                (l) => `
              <div class="t4-s-lang-row">
                <div class="t4-s-lang-name">${esc(l)}</div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
        
        <div class="t4-main">
          <div class="t4-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="t4-heading-wrapper-m">
              <div class="t4-heading-icon">${svgUser}</div>
              <div class="t4-heading-text-m">ABOUT ME</div>
            </div>
            <div class="t4-m-text">${esc(data.summary)}</div>
          </div>
          
          <div class="t4-contact-row" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="t4-contact-pill"><span class="t4-c-icon">${svgLocation}</span> ${esc(data.location)}</div>
            <div class="t4-contact-pill"><span class="t4-c-icon">${svgPhone}</span> ${esc(data.phone)}</div>
            <div class="t4-contact-pill"><span class="t4-c-icon">${svgEmail}</span> ${esc(data.email)}</div>
          </div>
          
          <div class="t4-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
            <div class="t4-heading-wrapper-m">
              <div class="t4-heading-icon">${svgEdu}</div>
              <div class="t4-heading-text-m">EDUCATION</div>
            </div>
            ${eduArray
              .map(
                (edu) => `
              <div class="t4-edu-item" style="margin-bottom: 15pt;">
                <div class="t4-edu-left">
                  <div class="t4-edu-school">${esc(edu.school)}</div>
                  <div class="t4-edu-year">${esc(edu.year)}</div>
                </div>
                <div class="t4-edu-right">
                  <div class="t4-edu-degree">${esc(edu.degree)}</div>
                  ${edu.honors ? `<div class="t4-edu-text">${esc(edu.honors)}</div>` : ""}
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
          
          <div class="t4-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
            <div class="t4-heading-wrapper-m">
              <div class="t4-heading-icon">${svgBriefcase}</div>
              <div class="t4-heading-text-m">JOB EXPERIENCE</div>
            </div>
            ${expItems}
          </div>
        </div>
      </div>
    `;
  } else if (templateId === "Fresher-1") {
    // FRESHER-1: BLOOM - Modern gradient accent, education-first for fresh graduates
    const internships = (data.experience || []).filter((e: any) => e.workType === "Internship");
    const otherExp = (data.experience || []).filter((e: any) => e.workType !== "Internship");
    const achievements = data.achievements || [];

    htmlContent = `
      <div class="page fr1-layout">
        <!-- HEADER -->
        <div class="fr1-header" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div class="fr1-header-accent"></div>
          <div class="fr1-header-inner">
            <div class="fr1-header-left">
              ${data.photo ? `<img src="${data.photo}" class="fr1-photo">` : "<div class=\"fr1-photo-placeholder\"></div>"}
            </div>
            <div class="fr1-header-info">
              <div class="fr1-name">${esc(data.name)}</div>
              <div class="fr1-title">${esc(data.title)}</div>
              <div class="fr1-contact-row">
                <span class="fr1-c-item">${svgPhone} ${esc(data.phone)}</span>
                <span class="fr1-c-item">${svgEmail} ${esc(data.email)}</span>
                ${data.location ? `<span class="fr1-c-item">${svgLocation} ${esc(data.location)}</span>` : ""}
                ${(data.links || []).map((l: any) => `<span class="fr1-c-item">${svgLink} <a href="${l.url}" style="color:inherit;text-decoration:none;">${esc(l.label || l.url)}</a></span>`).join("")}
              </div>
            </div>
          </div>
        </div>

        <!-- BODY -->
        <div class="fr1-body">
          <!-- MAIN COLUMN -->
          <div class="fr1-main">

            <div class="fr1-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="fr1-heading"><span class="fr1-h-bar"></span>ABOUT ME</div>
              <div class="fr1-text">${esc(data.summary)}</div>
            </div>

            <div class="fr1-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
              <div class="fr1-heading"><span class="fr1-h-bar"></span>EDUCATION</div>
              ${eduArray.map((edu: any) => `
                <div class="fr1-edu-card">
                  <div class="fr1-edu-top">
                    <div class="fr1-edu-degree">${esc(edu.degree)}</div>
                    ${edu.cgpa ? `<div class="fr1-edu-cgpa-badge">${esc(edu.cgpa)} GPA</div>` : ""}
                  </div>
                  <div class="fr1-edu-school">${esc(edu.school)}</div>
                  <div class="fr1-edu-meta">
                    <span>${esc(edu.year)}</span>
                    ${edu.honors ? `<span class="fr1-edu-honors">${esc(edu.honors)}</span>` : ""}
                  </div>
                  ${edu.coursework ? `<div class="fr1-edu-coursework">${esc(edu.coursework)}</div>` : ""}
                </div>
              `).join("")}
            </div>

            ${
              internships.length > 0 ? `
            <div class="fr1-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
              <div class="fr1-heading"><span class="fr1-h-bar"></span>INTERNSHIPS</div>
              ${internships.map((exp: any) => `
                <div class="fr1-exp-item">
                  <div class="fr1-exp-header">
                    <div>
                      <span class="fr1-exp-role">${esc(exp.role)}</span>
                      <span class="fr1-intern-badge">Internship</span>
                    </div>
                    <span class="fr1-exp-date">${esc(exp.period)}</span>
                  </div>
                  <div class="fr1-exp-company">${esc(exp.company)}</div>
                  <div class="fr1-exp-desc">${esc(exp.description)}</div>
                </div>
              `).join("")}
            </div>
            ` : ""
            }

            ${
              otherExp.length > 0 ? `
            <div class="fr1-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
              <div class="fr1-heading"><span class="fr1-h-bar"></span>EXPERIENCE</div>
              ${otherExp.map((exp: any) => `
                <div class="fr1-exp-item">
                  <div class="fr1-exp-header">
                    <span class="fr1-exp-role">${esc(exp.role)}</span>
                    <span class="fr1-exp-date">${esc(exp.period)}</span>
                  </div>
                  <div class="fr1-exp-company">${esc(exp.company)}</div>
                  <div class="fr1-exp-desc">${esc(exp.description)}</div>
                </div>
              `).join("")}
            </div>
            ` : ""
            }

            ${
              (data.projects || []).length > 0 ? `
            <div class="fr1-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
              <div class="fr1-heading"><span class="fr1-h-bar"></span>PROJECTS</div>
              ${(data.projects || []).map((p: any) => `
                <div class="fr1-proj-item">
                  <div class="fr1-proj-name">${esc(p.title || p.name)}</div>
                  <div class="fr1-proj-desc">${esc(p.description)}</div>
                  ${p.link ? `<div class="fr1-proj-link">${svgLink} <a href="${p.link}" style="color:#4f46e5;text-decoration:none;">${esc(p.link)}</a></div>` : ""}
                </div>
              `).join("")}
            </div>
            ` : ""
            }

            ${
              achievements.length > 0 ? `
            <div class="fr1-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="fr1-heading"><span class="fr1-h-bar"></span>ACHIEVEMENTS</div>
              ${achievements.map((a: string) => `
                <div class="fr1-achievement-item">${esc(a)}</div>
              `).join("")}
            </div>
            ` : ""
            }
          </div>

          <!-- SIDEBAR -->
          <div class="fr1-sidebar">
            <div class="fr1-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="fr1-s-heading">SKILLS</div>
              <div class="fr1-skills-list">
                ${skills.map((s) => `<div class="fr1-skill-tag">${esc(s)}</div>`).join("")}
              </div>
            </div>

            ${
              tools.length > 0 ? `
            <div class="fr1-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="fr1-s-heading">TOOLS</div>
              <div class="fr1-skills-list">
                ${tools.map((t) => `<div class="fr1-skill-tag fr1-tool-tag">${esc(t)}</div>`).join("")}
              </div>
            </div>
            ` : ""
            }

            ${
              data.certifications && data.certifications.length > 0 ? `
            <div class="fr1-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="fr1-s-heading">CERTIFICATIONS</div>
              ${data.certifications.map((c: any) => `
                <div class="fr1-cert-item">
                  <div class="fr1-cert-title">${esc(c.title)}</div>
                  <div class="fr1-cert-issuer">${esc(c.issuer)} &bull; ${esc(c.year)}</div>
                </div>
              `).join("")}
            </div>
            ` : ""
            }

            ${
              languages.length > 0 ? `
            <div class="fr1-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="fr1-s-heading">LANGUAGES</div>
              <div class="fr1-skills-list">
                ${languages.map((l) => `<div class="fr1-skill-tag fr1-lang-tag">${esc(l)}</div>`).join("")}
              </div>
            </div>
            ` : ""
            }

            ${
              toArray(data.interests).length > 0 ? `
            <div class="fr1-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="fr1-s-heading">INTERESTS</div>
              <div class="fr1-skills-list">
                ${toArray(data.interests).map((i: string) => `<div class="fr1-skill-tag">${esc(i.trim())}</div>`).join("")}
              </div>
            </div>` : ""
            }
          </div>
        </div>
      </div>
    `;
  } else if (templateId === "Fresher-2") {
    // FRESHER-2: SPARK - Modern sidebar with internships showcase
    const internships = (data.experience || []).filter((e: any) => e.workType === "Internship");
    const otherExp = (data.experience || []).filter((e: any) => e.workType !== "Internship");

    htmlContent = `
      <div class="page fr2-layout">
        <div class="fr2-sidebar">
          ${data.photo ? `
          <div class="fr2-photo-box" onclick="window.ReactNativeWebView.postMessage('edit:personal:photo')">
            <img src="${data.photo}" class="fr2-photo">
          </div>
          ` : ""}
          
          <div class="fr2-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="fr2-s-heading">CONTACT</div>
            <div class="fr2-s-item">${svgPhone} ${esc(data.phone)}</div>
            <div class="fr2-s-item">${svgEmail} ${esc(data.email)}</div>
            <div class="fr2-s-item">${svgLocation} ${esc(data.location)}</div>
            ${data.links?.map((l: any) => `
              <div class="fr2-s-item">${svgLink} ${esc(l.url)}</div>
            `).join("") || ""}
          </div>

          <div class="fr2-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="fr2-s-heading">SKILLS</div>
            <div class="fr2-skills-list">
              ${skills.map((s) => `<div class="fr2-skill-pill">${esc(s)}</div>`).join("")}
            </div>
          </div>

          ${
            data.certifications && data.certifications.length > 0 ? `
          <div class="fr2-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="fr2-s-heading">CERTIFICATES</div>
            ${data.certifications.map((c: any) => `
              <div class="fr2-cert-item">
                <div class="fr2-cert-title">${esc(c.title)}</div>
                <div class="fr2-cert-meta">${esc(c.issuer)} | ${esc(c.year)}</div>
              </div>
            `).join("")}
          </div>
          ` : ""
          }

          <div class="fr2-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="fr2-s-heading">LANGUAGES</div>
            <div class="fr2-lang-list">
              ${languages.map((l) => `<div class="fr2-lang-item">${esc(l)}</div>`).join("")}
            </div>
          </div>
        </div>

        <div class="fr2-main">
          <div class="fr2-header" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="fr2-name">${esc(data.name)}</div>
            <div class="fr2-title">${esc(data.title)}</div>
            <div class="fr2-summary">${esc(data.summary)}</div>
          </div>

          <div class="fr2-body">
            <div class="fr2-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
              <div class="fr2-heading">EDUCATION</div>
              ${eduArray.map((edu: any) => `
                <div class="fr2-edu-item">
                  <div class="fr2-edu-row">
                    <div class="fr2-edu-degree">${esc(edu.degree)}</div>
                    <div class="fr2-edu-year">${esc(edu.year)}</div>
                  </div>
                  <div class="fr2-edu-school">${esc(edu.school)}</div>
                  ${edu.cgpa ? `<div class="fr2-edu-cgpa">CGPA: ${esc(edu.cgpa)}</div>` : ""}
                </div>
              `).join("")}
            </div>

            ${
              internships.length > 0 ? `
            <div class="fr2-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
              <div class="fr2-heading">INTERNSHIPS</div>
              ${internships.map((exp: any) => `
                <div class="fr2-exp-item">
                  <div class="fr2-exp-header">
                    <span class="fr2-exp-role">${esc(exp.role)}</span>
                    <span class="fr2-exp-date">${esc(exp.period)}</span>
                  </div>
                  <div class="fr2-exp-company">${esc(exp.company)}</div>
                  <div class="fr2-exp-desc">${esc(exp.description)}</div>
                </div>
              `).join("")}
            </div>
            ` : ""
            }

            ${
              otherExp.length > 0 ? `
            <div class="fr2-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
              <div class="fr2-heading">EXPERIENCE</div>
              ${otherExp.map((exp: any) => `
                <div class="fr2-exp-item">
                  <div class="fr2-exp-header">
                    <span class="fr2-exp-role">${esc(exp.role)}</span>
                    <span class="fr2-exp-date">${esc(exp.period)}</span>
                  </div>
                  <div class="fr2-exp-company">${esc(exp.company)}</div>
                  <div class="fr2-exp-desc">${esc(exp.description)}</div>
                </div>
              `).join("")}
            </div>
            ` : ""
            }

            ${
              projectItems ? `
            <div class="fr2-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
              <div class="fr2-heading">PROJECTS</div>
              <div class="fr2-projects-grid">
                ${projectItems}
              </div>
            </div>
            ` : ""
            }
          </div>
        </div>
      </div>
    `;
  } else if (templateId === "Fresher-3") {
    // FRESHER-3: RISE - Project & skills first, academic achievements
    const internships = (data.experience || []).filter((e: any) => e.workType === "Internship");
    const achievements = data.achievements || [];

    htmlContent = `
      <div class="page fr3-layout">
        <div class="fr3-top-bar" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div class="fr3-name">${esc(data.name)}</div>
          <div class="fr3-title">${esc(data.title)}</div>
          <div class="fr3-contact-line">
            ${svgEmail} ${esc(data.email)} &nbsp;|&nbsp; ${svgPhone} ${esc(data.phone)} &nbsp;|&nbsp; ${svgLocation} ${esc(data.location)}
          </div>
        </div>

        <div class="fr3-body">
          <div class="fr3-left">
            <div class="fr3-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="fr3-heading">ABOUT</div>
              <div class="fr3-text">${esc(data.summary)}</div>
            </div>

            <div class="fr3-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
              <div class="fr3-heading">EDUCATION</div>
              ${eduArray.map((edu: any) => `
                <div class="fr3-edu-card">
                  <div class="fr3-edu-degree">${esc(edu.degree)}</div>
                  <div class="fr3-edu-school">${esc(edu.school)} - ${esc(edu.year)}</div>
                  ${edu.cgpa ? `<div class="fr3-edu-cgpa">CGPA: ${esc(edu.cgpa)}</div>` : ""}
                  ${edu.honors ? `<div class="fr3-edu-honors">${esc(edu.honors)}</div>` : ""}
                </div>
              `).join("")}
            </div>

            ${
              projectItems ? `
            <div class="fr3-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
              <div class="fr3-heading">PROJECTS</div>
              <div class="fr3-projects-list">
                ${(data.projects || []).map((proj: any) => `
                  <div class="fr3-proj-item">
                    <div class="fr3-proj-name">${esc(proj.name)}</div>
                    <div class="fr3-proj-desc">${esc(proj.description)}</div>
                    ${proj.link ? `<div class="fr3-proj-link">${esc(proj.link)}</div>` : ""}
                  </div>
                `).join("")}
              </div>
            </div>
            ` : ""
            }

            ${
              internships.length > 0 ? `
            <div class="fr3-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
              <div class="fr3-heading">INTERNSHIPS</div>
              ${internships.map((exp: any) => `
                <div class="fr3-exp-item">
                  <div class="fr3-exp-header">
                    <span class="fr3-exp-role">${esc(exp.role)}</span>
                    <span class="fr3-exp-date">${esc(exp.period)}</span>
                  </div>
                  <div class="fr3-exp-company">${esc(exp.company)}</div>
                  <div class="fr3-exp-desc">${esc(exp.description)}</div>
                </div>
              `).join("")}
            </div>
            ` : ""
            }

            ${
              achievements.length > 0 ? `
            <div class="fr3-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="fr3-heading">ACHIEVEMENTS</div>
              ${achievements.map((a: string) => `
                <div class="fr3-achievement">• ${esc(a)}</div>
              `).join("")}
            </div>
            ` : ""
            }
          </div>

          <div class="fr3-right">
            <div class="fr3-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="fr3-heading">SKILLS</div>
              <div class="fr3-skills-list">
                ${skills.map((s) => `<div class="fr3-skill-tag">${esc(s)}</div>`).join("")}
              </div>
            </div>

            ${
              tools.length > 0 ? `
            <div class="fr3-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="fr3-heading">TOOLS</div>
              <div class="fr3-skills-list">
                ${tools.map((t) => `<div class="fr3-skill-tag">${esc(t)}</div>`).join("")}
              </div>
            </div>
            ` : ""
            }

            ${
              data.certifications && data.certifications.length > 0 ? `
            <div class="fr3-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="fr3-heading">CERTIFICATIONS</div>
              ${data.certifications.map((c: any) => `
                <div class="fr3-cert-item">
                  <div class="fr3-cert-title">${esc(c.title)}</div>
                  <div class="fr3-cert-meta">${esc(c.issuer)} • ${esc(c.year)}</div>
                </div>
              `).join("")}
            </div>
            ` : ""
            }

            ${
              data.links && data.links.length > 0 ? `
            <div class="fr3-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="fr3-heading">LINKS</div>
              ${data.links.map((l: any) => `
                <div class="fr3-link-item">${esc(l.label)}: ${esc(l.url)}</div>
              `).join("")}
            </div>
            ` : ""
            }

            ${
              toArray(data.interests).length > 0 ? `
            <div class="fr3-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="fr3-heading">INTERESTS</div>
              <div class="fr3-skills-list">
                ${toArray(data.interests).map((i: string) => `<div class="fr3-skill-tag">${esc(i.trim())}</div>`).join("")}
              </div>
            </div>
            ` : ""
            }
          </div>
        </div>
      </div>
    `;
  } else if (templateId === "Fresher-4") {
    // FRESHER-4: PRO - Professional two-column fresher layout
    const internships = (data.experience || []).filter((e: any) => e.workType === "Internship");
    const otherExp = (data.experience || []).filter((e: any) => e.workType !== "Internship");

    htmlContent = `
      <div class="page fr4-layout">
        <div class="fr4-sidebar">
          <div class="fr4-photo-box" onclick="window.ReactNativeWebView.postMessage('edit:personal:photo')">
            ${data.photo ? `<img src="${data.photo}" class="fr4-photo">` : ""}
          </div>
          <div class="fr4-name" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">${esc(data.name)}</div>
          <div class="fr4-title" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">${esc(data.title)}</div>
          
          <div class="fr4-s-divider"></div>

          <div class="fr4-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="fr4-s-heading">CONTACT</div>
            <div class="fr4-s-item">${svgPhone} ${esc(data.phone)}</div>
            <div class="fr4-s-item">${svgEmail} ${esc(data.email)}</div>
            <div class="fr4-s-item">${svgLocation} ${esc(data.location)}</div>
          </div>

          <div class="fr4-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="fr4-s-heading">SKILLS</div>
            ${skills.map((s) => `<div class="fr4-skill-row"><span class="fr4-skill-name">${esc(s)}</span></div>`).join("")}
          </div>

          ${
            languages.length > 0 ? `
          <div class="fr4-s-section">
            <div class="fr4-s-heading">LANGUAGES</div>
            ${languages.map((l) => `<div class="fr4-lang-item">${esc(l)}</div>`).join("")}
          </div>
          ` : ""
          }
        </div>

        <div class="fr4-main">
          <div class="fr4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="fr4-heading">PROFESSIONAL SUMMARY</div>
            <div class="fr4-text">${esc(data.summary)}</div>
          </div>

          <div class="fr4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
            <div class="fr4-heading">EDUCATION</div>
            ${eduArray.map((edu: any) => `
              <div class="fr4-edu-item">
                <div class="fr4-edu-header">
                  <span class="fr4-edu-degree">${esc(edu.degree)}</span>
                  <span class="fr4-edu-year">${esc(edu.year)}</span>
                </div>
                <div class="fr4-edu-school">${esc(edu.school)}</div>
                ${edu.cgpa ? `<div class="fr4-edu-cgpa">CGPA: ${esc(edu.cgpa)} ${edu.honors ? `| ${esc(edu.honors)}` : ""}</div>` : ""}
              </div>
            `).join("")}
          </div>

          ${
            internships.length > 0 ? `
          <div class="fr4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
            <div class="fr4-heading">INTERNSHIPS</div>
            ${internships.map((exp: any) => `
              <div class="fr4-exp-item">
                <div class="fr4-exp-header">
                  <span class="fr4-exp-role">${esc(exp.role)}</span>
                  <span class="fr4-exp-date">${esc(exp.period)}</span>
                </div>
                <div class="fr4-exp-company">${esc(exp.company)}</div>
                <div class="fr4-exp-desc">${esc(exp.description)}</div>
              </div>
            `).join("")}
          </div>
          ` : ""
          }

          ${
            otherExp.length > 0 ? `
          <div class="fr4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
            <div class="fr4-heading">EXPERIENCE</div>
            ${otherExp.map((exp: any) => `
              <div class="fr4-exp-item">
                <div class="fr4-exp-header">
                  <span class="fr4-exp-role">${esc(exp.role)}</span>
                  <span class="fr4-exp-date">${esc(exp.period)}</span>
                </div>
                <div class="fr4-exp-company">${esc(exp.company)}</div>
                <div class="fr4-exp-desc">${esc(exp.description)}</div>
              </div>
            `).join("")}
          </div>
          ` : ""
          }

          ${
            projectItems ? `
          <div class="fr4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
            <div class="fr4-heading">PROJECTS</div>
            ${projectItems}
          </div>
          ` : ""
          }

          ${
            data.certifications && data.certifications.length > 0 ? `
          <div class="fr4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="fr4-heading">CERTIFICATIONS</div>
            ${data.certifications.map((c: any) => `
              <div class="fr4-cert-item">
                <span class="fr4-cert-title">${esc(c.title)}</span>
                <span class="fr4-cert-meta">${esc(c.issuer)} | ${esc(c.year)}</span>
              </div>
            `).join("")}
          </div>
          ` : ""
          }
        </div>
      </div>
    `;
  } else if (templateId === "Fresher-5") {
    // FRESHER-5: BUILD - Achievement & extracurricular focused
    const internships = (data.experience || []).filter((e: any) => e.workType === "Internship");
    const achievements = data.achievements || [];

    htmlContent = `
      <div class="page fr5-layout">
        <div class="fr5-hero" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div class="fr5-hero-content">
            <div class="fr5-name">${esc(data.name)}</div>
            <div class="fr5-title">${esc(data.title)}</div>
            <div class="fr5-contact">
              <span>${svgEmail} ${esc(data.email)}</span>
              <span>${svgPhone} ${esc(data.phone)}</span>
              <span>${svgLocation} ${esc(data.location)}</span>
            </div>
          </div>
          ${data.photo ? `<img src="${data.photo}" class="fr5-photo">` : ""}
        </div>

        <div class="fr5-body">
          <div class="fr5-col">
            <div class="fr5-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="fr5-heading">SUMMARY</div>
              <div class="fr5-text">${esc(data.summary)}</div>
            </div>

            <div class="fr5-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
              <div class="fr5-heading">EDUCATION</div>
              ${eduArray.map((edu: any) => `
                <div class="fr5-edu-item">
                  <div class="fr5-edu-degree">${esc(edu.degree)}</div>
                  <div class="fr5-edu-school">${esc(edu.school)}</div>
                  <div class="fr5-edu-meta">
                    ${esc(edu.year)}
                    ${edu.cgpa ? ` | CGPA: ${esc(edu.cgpa)}` : ""}
                  </div>
                  ${edu.honors ? `<div class="fr5-edu-honors">${esc(edu.honors)}</div>` : ""}
                </div>
              `).join("")}
            </div>

            ${
              internships.length > 0 ? `
            <div class="fr5-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
              <div class="fr5-heading">INTERNSHIPS</div>
              ${internships.map((exp: any) => `
                <div class="fr5-exp-item">
                  <div class="fr5-exp-header">
                    <span class="fr5-exp-role">${esc(exp.role)}</span>
                    <span class="fr5-exp-date">${esc(exp.period)}</span>
                  </div>
                  <div class="fr5-exp-company">${esc(exp.company)}</div>
                  <div class="fr5-exp-desc">${esc(exp.description)}</div>
                </div>
              `).join("")}
            </div>
            ` : ""
            }

            ${
              projectItems ? `
            <div class="fr5-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
              <div class="fr5-heading">PROJECTS</div>
              ${(data.projects || []).map((proj: any) => `
                <div class="fr5-proj-item">
                  <div class="fr5-proj-name">${esc(proj.name)}</div>
                  <div class="fr5-proj-desc">${esc(proj.description)}</div>
                </div>
              `).join("")}
            </div>
            ` : ""
            }
          </div>

          <div class="fr5-col">
            <div class="fr5-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="fr5-heading">SKILLS</div>
              <div class="fr5-skills-list">
                ${skills.map((s) => `<div class="fr5-skill-tag">${esc(s)}</div>`).join("")}
              </div>
            </div>

            ${
              tools.length > 0 ? `
            <div class="fr5-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="fr5-heading">TOOLS</div>
              <div class="fr5-skills-list">
                ${tools.map((t) => `<div class="fr5-skill-tag">${esc(t)}</div>`).join("")}
              </div>
            </div>
            ` : ""
            }

            ${
              achievements.length > 0 ? `
            <div class="fr5-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="fr5-heading">ACHIEVEMENTS</div>
              ${achievements.map((a: string) => `
                <div class="fr5-achieve-item">• ${esc(a)}</div>
              `).join("")}
            </div>
            ` : ""
            }

            ${
              data.certifications && data.certifications.length > 0 ? `
            <div class="fr5-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="fr5-heading">CERTIFICATIONS</div>
              ${data.certifications.map((c: any) => `
                <div class="fr5-cert-item">
                  <div class="fr5-cert-title">${esc(c.title)}</div>
                  <div class="fr5-cert-meta">${esc(c.issuer)} • ${esc(c.year)}</div>
                </div>
              `).join("")}
            </div>
            ` : ""
            }

            ${
              data.links && data.links.length > 0 ? `
            <div class="fr5-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="fr5-heading">LINKS</div>
              ${data.links.map((l: any) => `
                <div class="fr5-link-item">${esc(l.label)}: ${esc(l.url)}</div>
              `).join("")}
            </div>
            ` : ""
            }

            ${
              toArray(data.interests).length > 0 ? `
            <div class="fr5-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="fr5-heading">INTERESTS</div>
              <div class="fr5-skills-list">
                ${toArray(data.interests).map((i: string) => `<div class="fr5-skill-tag">${esc(i.trim())}</div>`).join("")}
              </div>
            </div>
            ` : ""
            }

            ${
              languages.length > 0 ? `
            <div class="fr5-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="fr5-heading">LANGUAGES</div>
              <div class="fr5-skills-list">
                ${languages.map((l) => `<div class="fr5-skill-tag">${esc(l)}</div>`).join("")}
              </div>
            </div>
            ` : ""
            }
          </div>
        </div>
      </div>
    `;
  } else if (templateId === "Rich-1") {
    // RICH-1: CLASSIC EXECUTIVE - Traditional single-column, no images, black only
    htmlContent = `
      <div class="page" style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #000; background: #fff; padding: 36pt 40pt;">
        <div style="text-align: center; padding-bottom: 16pt; border-bottom: 2pt solid #000; margin-bottom: 18pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div style="font-size: 22pt; font-weight: 800; letter-spacing: 1pt; text-transform: uppercase; color: #000;">${esc(data.name)}</div>
          <div style="font-size: 11pt; font-weight: 600; color: #000; margin-top: 4pt; letter-spacing: 0.5pt;">${esc(data.title)}</div>
          <div style="font-size: 9pt; color: #333; margin-top: 6pt;">
            ${esc(data.phone)} &nbsp;|&nbsp; ${esc(data.email)} &nbsp;|&nbsp; ${esc(data.location)}
          </div>
        </div>

        <div style="margin-bottom: 14pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div style="font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1pt; border-bottom: 1pt solid #000; padding-bottom: 3pt; margin-bottom: 6pt;">Professional Summary</div>
          <div style="font-size: 9.5pt; line-height: 1.5; color: #000; text-align: justify;">${esc(data.summary)}</div>
        </div>

        ${
          data.experience && data.experience.length > 0 ? `
        <div style="margin-bottom: 14pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
          <div style="font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1pt; border-bottom: 1pt solid #000; padding-bottom: 3pt; margin-bottom: 6pt;">Experience</div>
          ${data.experience.map((exp: any) => `
          <div style="margin-bottom: 8pt;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <div style="font-size: 10pt; font-weight: 700; color: #000;">${esc(exp.role)}</div>
              <div style="font-size: 9pt; color: #333; font-style: italic;">${esc(exp.period)}</div>
            </div>
            <div style="font-size: 9.5pt; font-weight: 600; color: #000; margin-top: 1pt;">${esc(exp.company)}</div>
            <div style="font-size: 9pt; line-height: 1.5; color: #000; margin-top: 3pt; text-align: justify;">${esc(exp.description)}</div>
          </div>
          `).join("")}
        </div>
        ` : ""
        }

        ${
          data.projects && data.projects.length > 0 ? `
        <div style="margin-bottom: 14pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
          <div style="font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1pt; border-bottom: 1pt solid #000; padding-bottom: 3pt; margin-bottom: 6pt;">Projects</div>
          ${data.projects.map((proj: any) => `
          <div style="margin-bottom: 6pt;">
            <div style="font-size: 10pt; font-weight: 700; color: #000;">${esc(proj.name)}</div>
            <div style="font-size: 9pt; line-height: 1.5; color: #000; text-align: justify;">${esc(proj.description)}</div>
          </div>
          `).join("")}
        </div>
        ` : ""
        }

        <div style="display: flex; gap: 20pt;">
          <div style="flex: 1;" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
            <div style="font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1pt; border-bottom: 1pt solid #000; padding-bottom: 3pt; margin-bottom: 6pt;">Education</div>
            ${eduArray.map((edu: any) => `
            <div style="margin-bottom: 4pt;">
              <div style="font-size: 9.5pt; font-weight: 700; color: #000;">${esc(edu.degree)}</div>
              <div style="font-size: 9pt; color: #000;">${esc(edu.school)} — ${esc(edu.year)}</div>
            </div>
            `).join("")}
          </div>
          <div style="flex: 1;" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div style="font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1pt; border-bottom: 1pt solid #000; padding-bottom: 3pt; margin-bottom: 6pt;">Skills</div>
            <div style="font-size: 9pt; line-height: 1.6; color: #000;">${skills.join(" &bull; ")}</div>
          </div>
        </div>

        ${
          languages.length > 0 ? `
        <div style="margin-top: 12pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
          <div style="font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1pt; border-bottom: 1pt solid #000; padding-bottom: 3pt; margin-bottom: 4pt;">Languages</div>
          <div style="font-size: 9pt; color: #000;">${languages.join(" &bull; ")}</div>
        </div>
        ` : ""
        }

        ${
          data.certifications && data.certifications.length > 0 ? `
        <div style="margin-top: 12pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div style="font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1pt; border-bottom: 1pt solid #000; padding-bottom: 3pt; margin-bottom: 4pt;">Certifications</div>
          ${data.certifications.map((c: any) => `
          <div style="font-size: 9pt; color: #000; margin-bottom: 2pt;">&bull; ${esc(c.title)} — ${esc(c.issuer)} (${esc(c.year)})</div>
          `).join("")}
        </div>
        ` : ""
        }
      </div>
    `;
  } else if (templateId === "Rich-2") {
    // RICH-2: COMPACT TWO-COLUMN - Dense layout, no images, black only
    htmlContent = `
      <div class="page" style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #000; background: #fff; padding: 0;">
        <div style="background: #000; color: #fff; padding: 18pt 24pt; text-align: center;" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div style="font-size: 20pt; font-weight: 800; letter-spacing: 0.5pt; text-transform: uppercase;">${esc(data.name)}</div>
          <div style="font-size: 10pt; font-weight: 400; margin-top: 2pt; opacity: 0.85;">${esc(data.title)}</div>
          <div style="font-size: 8.5pt; margin-top: 6pt; opacity: 0.75;">${esc(data.phone)} &nbsp;|&nbsp; ${esc(data.email)} &nbsp;|&nbsp; ${esc(data.location)}</div>
        </div>

        <div style="display: flex; min-height: 650pt;">
          <div style="width: 170pt; padding: 16pt 14pt; border-right: 1pt solid #000;">
            <div style="margin-bottom: 14pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div style="font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8pt; border-bottom: 1pt solid #000; padding-bottom: 2pt; margin-bottom: 5pt;">Summary</div>
              <div style="font-size: 7.5pt; line-height: 1.5; color: #000; text-align: justify;">${esc(data.summary)}</div>
            </div>

            <div style="margin-bottom: 14pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
              <div style="font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8pt; border-bottom: 1pt solid #000; padding-bottom: 2pt; margin-bottom: 5pt;">Education</div>
              ${eduArray.map((edu: any) => `
              <div style="margin-bottom: 5pt;">
                <div style="font-size: 8pt; font-weight: 700; color: #000;">${esc(edu.degree)}</div>
                <div style="font-size: 7.5pt; color: #333;">${esc(edu.school)}</div>
                <div style="font-size: 7pt; color: #666;">${esc(edu.year)}</div>
              </div>
              `).join("")}
            </div>

            <div style="margin-bottom: 14pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div style="font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8pt; border-bottom: 1pt solid #000; padding-bottom: 2pt; margin-bottom: 5pt;">Skills</div>
              ${skills.map(s => `<div style="font-size: 7.5pt; color: #000; margin-bottom: 2pt;">&bull; ${esc(s)}</div>`).join("")}
            </div>

            ${
              languages.length > 0 ? `
            <div style="margin-bottom: 14pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div style="font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8pt; border-bottom: 1pt solid #000; padding-bottom: 2pt; margin-bottom: 5pt;">Languages</div>
              ${languages.map(l => `<div style="font-size: 7.5pt; color: #000; margin-bottom: 2pt;">&bull; ${esc(l)}</div>`).join("")}
            </div>
            ` : ""
            }

            ${
              data.certifications && data.certifications.length > 0 ? `
            <div onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div style="font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8pt; border-bottom: 1pt solid #000; padding-bottom: 2pt; margin-bottom: 5pt;">Certifications</div>
              ${data.certifications.map((c: any) => `
              <div style="font-size: 7.5pt; color: #000; margin-bottom: 2pt;">&bull; ${esc(c.title)}</div>
              <div style="font-size: 7pt; color: #666; margin-bottom: 4pt;">${esc(c.issuer)} — ${esc(c.year)}</div>
              `).join("")}
            </div>
            ` : ""
            }
          </div>

          <div style="flex: 1; padding: 16pt 18pt;">
            ${
              data.experience && data.experience.length > 0 ? `
            <div style="margin-bottom: 16pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
              <div style="font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8pt; border-bottom: 1pt solid #000; padding-bottom: 2pt; margin-bottom: 8pt;">Experience</div>
              ${data.experience.map((exp: any) => `
              <div style="margin-bottom: 10pt;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                  <div style="font-size: 9.5pt; font-weight: 700; color: #000;">${esc(exp.role)}</div>
                  <div style="font-size: 8pt; color: #666;">${esc(exp.period)}</div>
                </div>
                <div style="font-size: 8.5pt; font-weight: 600; color: #333; margin-top: 1pt;">${esc(exp.company)}</div>
                <div style="font-size: 8pt; line-height: 1.5; color: #000; margin-top: 3pt; text-align: justify;">${esc(exp.description)}</div>
              </div>
              `).join("")}
            </div>
            ` : ""
            }

            ${
              data.projects && data.projects.length > 0 ? `
            <div onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
              <div style="font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8pt; border-bottom: 1pt solid #000; padding-bottom: 2pt; margin-bottom: 8pt;">Projects</div>
              ${data.projects.map((proj: any) => `
              <div style="margin-bottom: 8pt;">
                <div style="font-size: 9pt; font-weight: 700; color: #000;">${esc(proj.name)}</div>
                <div style="font-size: 8pt; line-height: 1.5; color: #000; text-align: justify;">${esc(proj.description)}</div>
              </div>
              `).join("")}
            </div>
            ` : ""
            }
          </div>
        </div>
      </div>
    `;
  } else if (templateId === "Rich-3") {
    // RICH-3: MODERN MINIMAL - Clean single-column with generous whitespace, no images, black only
    htmlContent = `
      <div class="page" style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #000; background: #fff; padding: 40pt 44pt;">
        <div style="margin-bottom: 24pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div style="font-size: 24pt; font-weight: 300; color: #000; letter-spacing: 2pt; text-transform: uppercase;">${esc(data.name)}</div>
          <div style="font-size: 10pt; font-weight: 400; color: #555; margin-top: 2pt; letter-spacing: 1pt;">${esc(data.title)}</div>
          <div style="font-size: 8.5pt; color: #777; margin-top: 8pt; word-spacing: 4pt;">${esc(data.phone)} &nbsp;/&nbsp; ${esc(data.email)} &nbsp;/&nbsp; ${esc(data.location)}</div>
          <div style="border-bottom: 1pt solid #ddd; margin-top: 14pt;"></div>
        </div>

        <div style="margin-bottom: 18pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div style="font-size: 8pt; font-weight: 600; text-transform: uppercase; letter-spacing: 2pt; color: #999; margin-bottom: 6pt;">About</div>
          <div style="font-size: 9.5pt; line-height: 1.7; color: #000; text-align: justify;">${esc(data.summary)}</div>
        </div>

        ${
          data.experience && data.experience.length > 0 ? `
        <div style="margin-bottom: 18pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
          <div style="font-size: 8pt; font-weight: 600; text-transform: uppercase; letter-spacing: 2pt; color: #999; margin-bottom: 8pt;">Experience</div>
          ${data.experience.map((exp: any, idx: number) => `
          <div style="margin-bottom: 12pt; ${idx < data.experience.length - 1 ? 'padding-bottom: 12pt; border-bottom: 1pt solid #eee;' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <div style="font-size: 10pt; font-weight: 600; color: #000;">${esc(exp.role)}</div>
              <div style="font-size: 8pt; color: #999;">${esc(exp.period)}</div>
            </div>
            <div style="font-size: 9pt; color: #555; margin-top: 1pt;">${esc(exp.company)}</div>
            <div style="font-size: 9pt; line-height: 1.6; color: #000; margin-top: 4pt; text-align: justify;">${esc(exp.description)}</div>
          </div>
          `).join("")}
        </div>
        ` : ""
        }

        ${
          data.projects && data.projects.length > 0 ? `
        <div style="margin-bottom: 18pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
          <div style="font-size: 8pt; font-weight: 600; text-transform: uppercase; letter-spacing: 2pt; color: #999; margin-bottom: 8pt;">Projects</div>
          ${data.projects.map((proj: any, idx: number) => `
          <div style="margin-bottom: 10pt; ${idx < data.projects.length - 1 ? 'padding-bottom: 10pt; border-bottom: 1pt solid #eee;' : ''}">
            <div style="font-size: 10pt; font-weight: 600; color: #000;">${esc(proj.name)}</div>
            <div style="font-size: 9pt; line-height: 1.6; color: #000; margin-top: 3pt; text-align: justify;">${esc(proj.description)}</div>
          </div>
          `).join("")}
        </div>
        ` : ""
        }

        <div style="display: flex; gap: 24pt; margin-bottom: 18pt;">
          <div style="flex: 1;" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
            <div style="font-size: 8pt; font-weight: 600; text-transform: uppercase; letter-spacing: 2pt; color: #999; margin-bottom: 6pt;">Education</div>
            ${eduArray.map((edu: any) => `
            <div style="margin-bottom: 6pt;">
              <div style="font-size: 9.5pt; font-weight: 600; color: #000;">${esc(edu.degree)}</div>
              <div style="font-size: 8.5pt; color: #555;">${esc(edu.school)}</div>
              <div style="font-size: 8pt; color: #999;">${esc(edu.year)}</div>
            </div>
            `).join("")}
          </div>
          <div style="flex: 1;" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div style="font-size: 8pt; font-weight: 600; text-transform: uppercase; letter-spacing: 2pt; color: #999; margin-bottom: 6pt;">Skills</div>
            <div style="font-size: 8.5pt; line-height: 1.8; color: #000;">${skills.join(" &bull; ")}</div>
          </div>
        </div>

        ${
          languages.length > 0 ? `
        <div style="margin-bottom: 12pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
          <div style="font-size: 8pt; font-weight: 600; text-transform: uppercase; letter-spacing: 2pt; color: #999; margin-bottom: 4pt;">Languages</div>
          <div style="font-size: 8.5pt; color: #000;">${languages.join(" &bull; ")}</div>
        </div>
        ` : ""
        }

        ${
          data.certifications && data.certifications.length > 0 ? `
        <div style="margin-bottom: 12pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div style="font-size: 8pt; font-weight: 600; text-transform: uppercase; letter-spacing: 2pt; color: #999; margin-bottom: 4pt;">Certifications</div>
          ${data.certifications.map((c: any) => `
          <div style="font-size: 8.5pt; color: #000; margin-bottom: 2pt;">&bull; ${esc(c.title)} — ${esc(c.issuer)} (${esc(c.year)})</div>
          `).join("")}
        </div>
        ` : ""
        }
      </div>
    `;
  } else if (templateId === "Rich-4") {
    // RICH-4: STRUCTURED GRID - Grid-based layout with visual hierarchy, no images, black only
    htmlContent = `
      <div class="page" style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #000; background: #fff; padding: 0;">
        <div style="padding: 28pt 32pt 16pt; border-bottom: 3pt solid #000;" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div style="font-size: 21pt; font-weight: 900; letter-spacing: 0.5pt; color: #000;">${esc(data.name)}</div>
          <div style="font-size: 10pt; font-weight: 500; color: #333; margin-top: 2pt;">${esc(data.title)}</div>
          <div style="font-size: 8.5pt; color: #555; margin-top: 6pt;">${esc(data.phone)} &nbsp;|&nbsp; ${esc(data.email)} &nbsp;|&nbsp; ${esc(data.location)}</div>
        </div>

        <div style="padding: 16pt 32pt 20pt; border-bottom: 1pt solid #ccc;" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div style="font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5pt; color: #000; margin-bottom: 6pt;">Summary</div>
          <div style="font-size: 9pt; line-height: 1.6; color: #000; text-align: justify;">${esc(data.summary)}</div>
        </div>

        <div style="display: flex;">
          <div style="width: 195pt; padding: 16pt 24pt 20pt 32pt; border-right: 1pt solid #ccc;">
            <div style="margin-bottom: 16pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div style="font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2pt; color: #000; border-bottom: 2pt solid #000; padding-bottom: 3pt; margin-bottom: 6pt;">Contact</div>
              <div style="font-size: 8.5pt; line-height: 1.8; color: #000;">
                <div>${esc(data.phone)}</div>
                <div>${esc(data.email)}</div>
                <div>${esc(data.location)}</div>
              </div>
            </div>

            <div style="margin-bottom: 16pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
              <div style="font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2pt; color: #000; border-bottom: 2pt solid #000; padding-bottom: 3pt; margin-bottom: 6pt;">Education</div>
              ${eduArray.map((edu: any) => `
              <div style="margin-bottom: 6pt;">
                <div style="font-size: 8.5pt; font-weight: 700; color: #000;">${esc(edu.degree)}</div>
                <div style="font-size: 8pt; color: #333;">${esc(edu.school)}</div>
                <div style="font-size: 7.5pt; color: #666;">${esc(edu.year)}</div>
              </div>
              `).join("")}
            </div>

            <div style="margin-bottom: 16pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div style="font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2pt; color: #000; border-bottom: 2pt solid #000; padding-bottom: 3pt; margin-bottom: 6pt;">Skills</div>
              ${skills.map(s => `<div style="font-size: 8pt; color: #000; margin-bottom: 3pt; padding-left: 6pt;">&bull; ${esc(s)}</div>`).join("")}
            </div>

            ${
              languages.length > 0 ? `
            <div style="margin-bottom: 16pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div style="font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2pt; color: #000; border-bottom: 2pt solid #000; padding-bottom: 3pt; margin-bottom: 6pt;">Languages</div>
              ${languages.map(l => `<div style="font-size: 8pt; color: #000; margin-bottom: 2pt; padding-left: 6pt;">&bull; ${esc(l)}</div>`).join("")}
            </div>
            ` : ""
            }

            ${
              data.certifications && data.certifications.length > 0 ? `
            <div onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div style="font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2pt; color: #000; border-bottom: 2pt solid #000; padding-bottom: 3pt; margin-bottom: 6pt;">Certifications</div>
              ${data.certifications.map((c: any) => `
              <div style="font-size: 8pt; color: #000; margin-bottom: 4pt; padding-left: 6pt;">
                <div style="font-weight: 600;">${esc(c.title)}</div>
                <div style="font-size: 7.5pt; color: #555;">${esc(c.issuer)} — ${esc(c.year)}</div>
              </div>
              `).join("")}
            </div>
            ` : ""
            }
          </div>

          <div style="flex: 1; padding: 16pt 24pt 20pt 20pt;">
            ${
              data.experience && data.experience.length > 0 ? `
            <div style="margin-bottom: 18pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
              <div style="font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2pt; color: #000; border-bottom: 2pt solid #000; padding-bottom: 3pt; margin-bottom: 8pt;">Experience</div>
              ${data.experience.map((exp: any) => `
              <div style="margin-bottom: 10pt; padding-bottom: 10pt; border-bottom: 1pt dotted #ccc;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                  <div style="font-size: 9.5pt; font-weight: 700; color: #000;">${esc(exp.role)}</div>
                  <div style="font-size: 8pt; color: #888;">${esc(exp.period)}</div>
                </div>
                <div style="font-size: 8.5pt; font-weight: 600; color: #444; margin-top: 1pt;">${esc(exp.company)}</div>
                <div style="font-size: 8.5pt; line-height: 1.6; color: #000; margin-top: 4pt; text-align: justify;">${esc(exp.description)}</div>
              </div>
              `).join("")}
            </div>
            ` : ""
            }

            ${
              data.projects && data.projects.length > 0 ? `
            <div onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
              <div style="font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2pt; color: #000; border-bottom: 2pt solid #000; padding-bottom: 3pt; margin-bottom: 8pt;">Projects</div>
              ${data.projects.map((proj: any) => `
              <div style="margin-bottom: 8pt; padding-bottom: 8pt; border-bottom: 1pt dotted #ccc;">
                <div style="font-size: 9.5pt; font-weight: 700; color: #000;">${esc(proj.name)}</div>
                <div style="font-size: 8.5pt; line-height: 1.6; color: #000; margin-top: 3pt; text-align: justify;">${esc(proj.description)}</div>
              </div>
              `).join("")}
            </div>
            ` : ""
            }

            ${
              data.interests && toArray(data.interests).length > 0 ? `
            <div style="margin-top: 12pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div style="font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2pt; color: #000; border-bottom: 2pt solid #000; padding-bottom: 3pt; margin-bottom: 4pt;">Interests</div>
              <div style="font-size: 8.5pt; line-height: 1.6; color: #000;">${toArray(data.interests).join(" &bull; ")}</div>
            </div>
            ` : ""
            }
          </div>
        </div>
      </div>
    `;
  } else {
    // ELDER-1: MODERN SIDEBAR (Default)
    htmlContent = `
      <div class="page">
        <div class="sidebar">
          <div class="photo-wrapper" onclick="window.ReactNativeWebView.postMessage('edit:personal:photo')">
            <div class="photo-container">
              ${data.photo ? `<img src="${data.photo}" class="photo">` : ""}
            </div>
          </div>
          <div class="identity" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="name">${esc(data.name)}</div>
            <div class="title">${esc(data.title)}</div>
          </div>
          <div class="s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="s-heading">CONTACT</div>
            <div class="s-item"><span class="s-icon">${svgPhone}</span> ${esc(data.phone)}</div>
            <div class="s-item"><span class="s-icon">${svgEmail}</span> ${esc(data.email)}</div>
            <div class="s-item"><span class="s-icon">${svgLocation}</span> ${esc(data.location)}</div>
          </div>
          <div class="s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="s-heading">SKILLS</div>
            <div class="s-list">
              ${skills.map((s) => `<div class="s-list-item">• ${esc(s)}</div>`).join("")}
            </div>
          </div>
          ${
            tools && tools.length > 0
              ? `
          <div class="s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="s-heading">TOOLS</div>
            <div class="s-list">
              ${tools.map((t: string) => `<div class="s-list-item">• ${esc(t)}</div>`).join("")}
            </div>
          </div>
          `
              : ""
          }
        </div>
        <div class="main">
          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="m-heading">PROFILE</div>
            <div class="m-text">${esc(data.summary)}</div>
          </div>
          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
            <div class="m-heading">WORK EXPERIENCE</div>
            ${expItems}
          </div>
          ${
            projectItems
              ? `
          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
            <div class="m-heading">PROJECTS</div>
            ${projectItems}
          </div>
          `
              : ""
          }
          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
            <div class="m-heading">EDUCATION</div>
            ${eduArray
              .map(
                (edu) => `
              <div class="edu-item" style="margin-bottom: 10pt;">
                <div class="edu-degree">${esc(edu.degree)}</div>
                <div class="edu-date">${esc(edu.year)}</div>
                <div class="edu-school">${esc(edu.school)}</div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  }

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; }
    body { font-family: 'Inter', sans-serif; }
    svg { width: 1.1em; height: 1.1em; vertical-align: text-bottom; }
    
    .page { 
      width: 595pt; 
      height: 842pt; 
      display: flex; 
      background: #fff; 
      overflow: hidden; 
    }

    /* Sidebar */
    .sidebar { 
      width: 185pt; 
      height: 842pt; 
      background: #1e293b; 
      color: #fff; 
      padding: 40pt 20pt;
      flex-shrink: 0;
    }
    .photo-wrapper { 
      display: flex; 
      justify-content: center; 
      margin-bottom: 25pt; 
    }
    .photo-container { 
      width: 110pt; 
      height: 110pt; 
      border-radius: 50%; 
      border: 4pt solid #fff; 
      overflow: hidden; 
      background: #334155;
    }
    .photo { width: 100%; height: 100%; object-fit: cover; }
    
    .identity { text-align: center; margin-bottom: 40pt; }
    .name { font-size: 22pt; font-weight: 800; margin-bottom: 6pt; line-height: 1.1; color: #fff; }
    .title { font-size: 11pt; font-weight: 600; opacity: 0.9; text-transform: uppercase; letter-spacing: 1.5pt; color: #94a3b8; }

    .s-section { margin-bottom: 40pt; }
    .s-heading { 
      font-size: 11pt; 
      font-weight: 800; 
      margin-bottom: 15pt; 
      border-bottom: 2pt solid rgba(255,255,255,0.2); 
      padding-bottom: 6pt;
      letter-spacing: 1.5pt;
      color: #f8fafc;
    }
    .s-item { font-size: 9.5pt; margin-bottom: 12pt; display: flex; align-items: center; gap: 8pt; color: #cbd5e1; }
    .s-icon { font-size: 12pt; }
    .s-list-item { font-size: 9.5pt; margin-bottom: 8pt; color: #cbd5e1; line-height: 1.4; }

    /* Main Content */
    .main { 
      flex: 1; 
      padding: 45pt 35pt; 
      height: 842pt;
      background: #fff;
    }
    .m-section { margin-bottom: 35pt; }
    .m-heading { 
      font-size: 14pt; 
      font-weight: 800; 
      color: #1e293b; 
      margin-bottom: 15pt; 
      border-bottom: 2pt solid #e2e8f0;
      padding-bottom: 6pt;
      letter-spacing: 1.5pt;
    }
    .m-text { font-size: 10.5pt; line-height: 1.7; color: #334155; text-align: justify; }

    .exp-item { margin-bottom: 20pt; }
    .exp-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4pt; }
    .exp-role { font-size: 12pt; font-weight: 700; color: #1e293b; }
    .exp-date { font-size: 9pt; font-weight: 700; color: #64748b; }
    .exp-company { font-size: 10.5pt; font-weight: 700; color: #475569; margin-bottom: 8pt; }
    .exp-desc { font-size: 10pt; line-height: 1.7; color: #334155; }

    .edu-item { margin-top: 15pt; }
    .edu-degree { font-size: 12pt; font-weight: 700; color: #1e293b; }
    .edu-date { font-size: 9.5pt; font-weight: 700; color: #64748b; margin-top: 4pt; }
    .edu-school { font-size: 10.5pt; font-weight: 600; color: #475569; margin-top: 6pt; }

    /* Elder-2: ELDER ELEGANT (ATS MASTER) */
    .ats-layout { display: block !important; padding: 40pt 50pt; background: #fff; }
    .full-width { width: 100% !important; height: auto !important; padding: 0 !important; }
    .identity-ats { text-align: center; margin-bottom: 25pt; border-bottom: 1.5pt solid ${primaryColor}; padding-bottom: 20pt; }
    .name-ats { font-size: 26pt; font-weight: 900; color: #1e293b; margin-bottom: 4pt; text-transform: uppercase; letter-spacing: 1pt; }
    .title-ats { font-size: 13pt; font-weight: 600; color: ${primaryColor}; margin-bottom: 12pt; letter-spacing: 0.5pt; }
    .contact-row-ats { font-size: 9.5pt; color: #64748b; font-weight: 500; }
    .contact-row-ats span { margin: 0 4pt; }
    
    .ats-layout .m-section { margin-bottom: 25pt; page-break-inside: avoid; }
    .ats-layout .m-heading { 
      font-size: 11pt; 
      font-weight: 800; 
      color: #1e293b; 
      margin-bottom: 8pt;
      border-bottom: 1pt solid #e2e8f0;
      padding-bottom: 4pt;
      letter-spacing: 1.2pt;
      display: flex;
      align-items: center;
    }
    .ats-layout .m-heading::after {
      content: '';
      flex: 1;
      height: 1.5pt;
      background: ${primaryColor}20;
      margin-left: 10pt;
    }
    
    .ats-layout .m-text { font-size: 10pt; line-height: 1.6; color: #334155; text-align: justify; }
    .skills-grid-ats { display: flex; flex-wrap: wrap; gap: 6pt; margin-top: 5pt; }
    .skill-tag-ats { font-size: 9pt; font-weight: 600; color: #475569; background: #f8fafc; padding: 3pt 8pt; border-radius: 3pt; border: 1pt solid #e2e8f0; }
    
    .exp-list-ats { display: flex; flex-direction: column; gap: 15pt; }
    .ats-layout .exp-item { margin-bottom: 0; page-break-inside: avoid; }
    .ats-layout .exp-role { font-size: 11pt; font-weight: 700; color: #1e293b; }
    .ats-layout .exp-company { font-size: 10pt; font-weight: 600; color: ${primaryColor}; margin-bottom: 5pt; }
    .ats-layout .exp-date { font-size: 9pt; font-weight: 600; color: #64748b; }
    .ats-layout .exp-desc { font-size: 9.5pt; line-height: 1.5; color: #475569; }
    
    .ats-layout .edu-item { margin-top: 10pt; page-break-inside: avoid; }
 
    /* Elder-3: LINKEDIN SIGNATURE */
    .linkedin-layout { display: block !important; }
    .header-linkedin { background: #0077b5; color: #fff; padding: 35pt 40pt; }
    .header-main-li { display: flex; align-items: center; gap: 20pt; margin-bottom: 20pt; }
    .photo-container-li { width: 80pt; height: 80pt; border-radius: 50%; border: 3pt solid #fff; overflow: hidden; background: #fff; }
    .header-info-li { flex: 1; }
    .name-li { font-size: 22pt; font-weight: 800; }
    .title-li { font-size: 11pt; font-weight: 500; opacity: 0.9; margin-top: 4pt; }
    .contact-grid-li { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10pt; font-size: 9pt; border-top: 1pt solid rgba(255,255,255,0.2); padding-top: 15pt; }
    .c-item-li { opacity: 0.9; }
    .main-li { padding: 30pt 40pt; }
    .m-heading-li { font-size: 11pt; font-weight: 800; color: #0077b5; margin-bottom: 12pt; text-transform: uppercase; letter-spacing: 1pt; }
    .skills-li { font-size: 10pt; font-weight: 600; color: #334155; line-height: 1.6; }

    /* Elder-4: TIMELINE BLUE */
    .e4-layout { display: flex; background: #fff; }
    .e4-sidebar { width: 190pt; background: #263342; color: #fff; padding: 30pt 20pt; flex-shrink: 0; }
    .e4-photo-wrapper { display: flex; justify-content: center; margin-bottom: 25pt; }
    .e4-photo-container { width: 110pt; height: 110pt; border-radius: 50%; overflow: hidden; border: 2pt solid #fff; }
    .e4-photo { width: 100%; height: 100%; object-fit: cover; }
    
    .e4-s-section { margin-bottom: 20pt; }
    .e4-s-heading { background: #22a3d6; color: #fff; font-size: 11pt; font-weight: 600; text-align: center; padding: 4pt 0; margin-bottom: 15pt; letter-spacing: 1pt; }
    .e4-s-item { font-size: 9pt; margin-bottom: 12pt; color: #e2e8f0; line-height: 1.5; }
    .e4-icon { font-size: 10pt; color: #22a3d6; margin-right: 5pt; }
    .e4-s-list { margin-left: 15pt; padding: 0; font-size: 9pt; color: #e2e8f0; line-height: 1.8; }
    .e4-s-list li { margin-bottom: 4pt; }
    .e4-s-list li::marker { color: #22a3d6; }
    
    .e4-main { flex: 1; display: flex; flex-direction: column; }
    .e4-header { background: #f3f4f6; padding: 35pt 30pt; text-align: center; }
    .e4-name { font-size: 26pt; font-weight: 800; letter-spacing: 1pt; margin-bottom: 5pt; text-transform: uppercase; }
    .e4-first-name { color: #263342; }
    .e4-last-name { color: #22a3d6; font-weight: 300; }
    .e4-title { font-size: 11pt; font-weight: 600; color: #64748b; letter-spacing: 2pt; margin-bottom: 15pt; text-transform: uppercase; }
    .e4-summary { font-size: 9.5pt; line-height: 1.6; color: #334155; text-align: justify; }
    
    .e4-content { padding: 25pt 30pt; flex: 1; }
    .e4-m-section { margin-bottom: 20pt; }
    .e4-m-heading { background: #22a3d6; color: #fff; font-size: 11pt; font-weight: 600; text-align: center; padding: 4pt 0; margin-bottom: 20pt; letter-spacing: 1pt; }
    
    .e4-timeline { border-left: 1pt solid #cbd5e1; margin-left: 6pt; padding-left: 15pt; }
    .e4-layout .exp-item { display: flex; flex-direction: column; position: relative; margin-bottom: 20pt; }
    .e4-layout .exp-item::before {
      content: ''; position: absolute; left: -19pt; top: 4pt; width: 6pt; height: 6pt; 
      border-radius: 50%; border: 1.5pt solid #22a3d6; background: #fff;
    }
    
    .e4-layout .exp-row { display: contents; }
    .e4-layout .exp-role { order: 1; font-size: 11pt; font-weight: 800; color: #263342; text-transform: uppercase; margin-bottom: 2pt; }
    .e4-layout .exp-company { order: 2; font-size: 9.5pt; font-weight: 500; color: #333; margin-bottom: 2pt; }
    .e4-layout .exp-date { order: 3; font-size: 8.5pt; font-weight: 500; color: #64748b; margin-bottom: 8pt; }
    .e4-layout .exp-desc { order: 4; font-size: 9.5pt; line-height: 1.6; color: #334155; }
    
    .e4-edu-item { display: block; }
    .e4-edu-degree { font-size: 11pt; font-weight: 800; color: #263342; text-transform: uppercase; margin-bottom: 2pt; }
    .e4-edu-school { font-size: 9.5pt; font-weight: 500; color: #333; margin-bottom: 2pt; }
    .e4-edu-date { font-size: 8.5pt; font-weight: 500; color: #64748b; }

    /* Elder-5: RIGHT SIDEBAR */
    .row-reverse { flex-direction: row-reverse; }
    .sidebar-right { background: #334155; }
    
    /* Elder-6: RIBBON DARK */
    .e6-layout { display: flex; background: #fff; }
    .e6-sidebar { position: relative; width: 190pt; background: #3b3b3b; color: #fff; padding-top: 40pt; flex-shrink: 0; z-index: 2; }
    .e6-photo-wrapper { display: flex; justify-content: center; margin-bottom: 30pt; }
    .e6-photo-container { width: 120pt; height: 120pt; border-radius: 50%; overflow: hidden; border: none; }
    .e6-photo { width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%); }
    
    .e6-s-section { margin-bottom: 20pt; }
    .e6-ribbon-heading {
      position: relative;
      background: #0ea5e9;
      color: #fff;
      font-size: 13pt;
      font-weight: 700;
      padding: 6pt 20pt;
      margin-bottom: 15pt;
      width: calc(100% + 15pt);
      box-sizing: border-box;
    }
    .e6-ribbon-heading::after {
      content: '';
      position: absolute;
      top: 100%;
      right: 0;
      border-top: 6pt solid #0369a1;
      border-right: 15pt solid transparent;
    }
    
    .e6-s-item { padding: 0 20pt; font-size: 9pt; margin-bottom: 10pt; color: #e2e8f0; display: flex; align-items: center; gap: 8pt; }
    .e6-icon { font-size: 10pt; color: #fff; margin-right: 5pt; }
    .e6-s-list { padding: 0 20pt 0 35pt; font-size: 9pt; color: #e2e8f0; line-height: 1.8; }
    .e6-s-list li { margin-bottom: 4pt; }
    .e6-s-list li::marker { color: #fff; }
    
    .e6-edu-item { padding: 0 20pt; }
    .e6-edu-degree { font-size: 10pt; font-weight: 800; color: #fff; text-transform: uppercase; margin-bottom: 4pt; }
    .e6-edu-school { font-size: 9pt; color: #cbd5e1; margin-bottom: 2pt; }
    .e6-edu-date { font-size: 8.5pt; color: #94a3b8; }
    
    .e6-main { flex: 1; padding: 40pt 35pt; background: #fff; z-index: 1; display: flex; flex-direction: column; }
    .e6-header { margin-bottom: 25pt; }
    .e6-name { font-size: 36pt; font-weight: 900; color: #333; margin-bottom: 5pt; }
    .e6-title { font-size: 14pt; color: #666; font-weight: 500; }
    
    .e6-m-section { margin-bottom: 25pt; }
    .e6-m-heading {
      display: flex;
      align-items: center;
      font-size: 14pt;
      font-weight: 800;
      color: #333;
      margin-bottom: 15pt;
      white-space: nowrap;
    }
    .e6-m-heading::after {
      content: '';
      flex: 1;
      height: 1pt;
      background: #cbd5e1;
      margin-left: 15pt;
    }
    .e6-summary { font-size: 9.5pt; line-height: 1.6; color: #555; text-align: justify; }
    
    .e6-layout .exp-item { display: flex; flex-direction: column; margin-bottom: 20pt; }
    .e6-layout .exp-row { display: contents; }
    .e6-layout .exp-date { order: 1; font-size: 9pt; color: #64748b; margin-bottom: 2pt; font-weight: 500; }
    .e6-layout .exp-company { order: 2; font-size: 10pt; color: #64748b; margin-bottom: 4pt; }
    .e6-layout .exp-role { order: 3; font-size: 11pt; font-weight: 800; color: #333; margin-bottom: 6pt; }
    .e6-layout .exp-desc { order: 4; font-size: 9.5pt; color: #555; line-height: 1.6; }
    
    /* Elder-7: MODERN SPLIT (Yellow Accents) */
    .e7-layout { display: flex; background: #fff; }
    
    /* Sidebar */
    .e7-sidebar { width: 200pt; display: flex; flex-direction: column; flex-shrink: 0; }
    .e7-sidebar-top { background: #1f2937; color: #fff; padding: 0 0 30pt 0; flex: 1; }
    .e7-photo-container { width: 100%; height: 210pt; background: #374151; overflow: hidden; margin-bottom: 25pt; }
    .e7-photo { width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%); }
    .e7-sidebar-title-badge { background: #facc15; color: #000; font-weight: 800; font-size: 10pt; padding: 6pt 15pt; display: inline-block; margin-bottom: 30pt; text-transform: uppercase; letter-spacing: 1pt; }
    
    .e7-s-section { padding: 0 25pt; margin-bottom: 25pt; }
    .e7-s-heading { font-size: 11pt; font-weight: 800; letter-spacing: 1pt; text-transform: uppercase; margin-bottom: 15pt; }
    .e7-s-heading::after { content: ''; display: block; width: 25pt; height: 2pt; background: #facc15; margin-top: 6pt; }
    .e7-dark-text { color: #1f2937; }
    
    .e7-edu-degree { font-size: 10pt; font-weight: 800; text-transform: uppercase; margin-bottom: 4pt; }
    .e7-edu-school { font-size: 9pt; color: #9ca3af; margin-bottom: 2pt; }
    .e7-edu-date { font-size: 8.5pt; color: #9ca3af; }
    
    .e7-sidebar-bottom { background: #f3f4f6; padding: 30pt 0; flex: 1; }
    .e7-skills-list { list-style: none; margin: 0; padding: 0; }
    .e7-skills-list li { font-size: 9.5pt; color: #374151; font-weight: 600; margin-bottom: 10pt; display: flex; align-items: center; }
    .e7-skills-list li::before { content: ''; width: 4pt; height: 4pt; background: #facc15; margin-right: 8pt; display: inline-block; }
    
    .e7-contact-block { margin-top: 30pt; display: flex; flex-direction: column; gap: 0; }
    .e7-c-row { display: flex; align-items: stretch; }
    .e7-c-icon-wrapper { background: #facc15; width: 40pt; display: flex; justify-content: center; align-items: center; }
    .e7-c-icon { color: #1f2937; font-size: 12pt; }
    .e7-c-text { flex: 1; padding: 10pt 15pt; font-size: 8.5pt; color: #4b5563; line-height: 1.4; }
    .e7-c-label { font-weight: 800; font-size: 9.5pt; color: #1f2937; text-transform: uppercase; }
    
    /* Main Area */
    .e7-main { flex: 1; display: flex; flex-direction: column; }
    .e7-header-bg { background: #f3f4f6; padding: 40pt 35pt; }
    .e7-name { font-size: 38pt; margin-bottom: 5pt; letter-spacing: 0.5pt; }
    .e7-name-bold { font-weight: 900; color: #1f2937; }
    .e7-name-light { font-weight: 300; color: #4b5563; }
    .e7-title-badge { background: #facc15; color: #000; font-weight: 800; font-size: 10pt; padding: 4pt 12pt; display: inline-block; margin-bottom: 25pt; text-transform: uppercase; letter-spacing: 1pt; }
    
    .e7-m-heading { font-size: 13pt; font-weight: 800; color: #1f2937; letter-spacing: 1pt; text-transform: uppercase; margin-bottom: 15pt; }
    .e7-m-heading::after { content: ''; display: block; width: 30pt; height: 2pt; background: #facc15; margin-top: 6pt; }
    .e7-summary { font-size: 10pt; line-height: 1.7; color: #4b5563; }
    
    .e7-content { padding: 35pt; flex: 1; }
    
    .e7-layout .exp-item { 
      display: grid; 
      grid-template-columns: auto 1fr;
      grid-template-areas: 
        "role role"
        "date company"
        "desc desc";
      column-gap: 10pt;
      row-gap: 4pt;
      margin-bottom: 25pt;
    }
    .e7-layout .exp-row { display: contents; }
    .e7-layout .exp-role { grid-area: role; font-size: 12pt; font-weight: 800; color: #1f2937; margin-bottom: 4pt; }
    .e7-layout .exp-date { grid-area: date; font-size: 8.5pt; font-weight: 800; color: #000; background: #facc15; padding: 2pt 8pt; align-self: center; }
    .e7-layout .exp-company { grid-area: company; font-size: 10pt; font-weight: 600; color: #4b5563; align-self: center; }
    .e7-layout .exp-desc { grid-area: desc; font-size: 9.5pt; line-height: 1.6; color: #4b5563; margin-top: 4pt; }
    
    .e7-interests-list { display: flex; flex-wrap: wrap; gap: 15pt; }
    .e7-interest-item { font-size: 10pt; font-weight: 700; color: #1f2937; text-transform: uppercase; letter-spacing: 0.5pt; }
    
    /* Elder-8: SKYLINE (Blue Border, Timelines) */
    .e8-layout { display: flex; background: #fff; border: 4pt solid #0ea5e9; box-sizing: border-box; }
    
    .e8-sidebar { width: 220pt; background: #1a2935; color: #fff; padding: 40pt 25pt; position: relative; flex-shrink: 0; }
    .e8-corner-accent { position: absolute; top: 0; left: 0; width: 100%; height: 160pt; background: #0ea5e9; clip-path: polygon(0 0, 100% 0, 0 100%); z-index: 1; }
    
    .e8-photo-wrapper { position: relative; z-index: 2; display: flex; justify-content: center; margin-bottom: 40pt; }
    .e8-photo { width: 120pt; height: 120pt; border-radius: 50%; border: 3pt solid #fff; box-shadow: 0 0 0 3pt #0ea5e9; object-fit: cover; }
    
    /* Sidebar Timeline */
    .e8-s-timeline-container { position: relative; z-index: 2; }
    .e8-s-timeline-line { position: absolute; left: 9.5pt; top: 0; bottom: 0; width: 1pt; background: #64748b; }
    
    .e8-s-section { margin-bottom: 25pt; position: relative; }
    .e8-s-heading-row { display: flex; align-items: center; margin-bottom: 15pt; }
    .e8-s-icon-node { width: 20pt; height: 20pt; border-radius: 50%; background: #0ea5e9; color: #1a2935; display: flex; justify-content: center; align-items: center; z-index: 3; font-size: 10pt; }
    .e8-s-heading { font-size: 12pt; font-weight: 800; color: #fff; margin-left: 15pt; letter-spacing: 1pt; }
    
    .e8-s-content { padding-left: 35pt; }
    .e8-s-item { font-size: 8.5pt; color: #cbd5e1; margin-bottom: 12pt; display: flex; align-items: flex-start; line-height: 1.4; position: relative; }
    .e8-s-item-icon { color: #fff; font-size: 10pt; margin-right: 8pt; margin-top: 1pt; }
    .e8-s-dot { position: absolute; left: -28pt; top: 3.5pt; width: 6pt; height: 6pt; border-radius: 50%; background: #0ea5e9; }
    
    .e8-edu-item { position: relative; }
    .e8-edu-school { font-size: 10pt; font-weight: 800; color: #fff; text-transform: uppercase; margin-bottom: 2pt; }
    .e8-edu-degree { font-size: 8.5pt; color: #cbd5e1; text-transform: uppercase; margin-bottom: 2pt; }
    .e8-edu-date { font-size: 8.5pt; color: #0ea5e9; }
    
    /* Main Area */
    .e8-main { flex: 1; display: flex; flex-direction: column; background: #fff; }
    .e8-header { background: #f1f5f9; padding: 40pt 30pt; text-align: center; margin-top: 30pt; }
    .e8-name { font-size: 28pt; margin-bottom: 5pt; letter-spacing: 1pt; text-transform: uppercase; }
    .e8-name-dark { font-weight: 900; color: #1a2935; }
    .e8-name-blue { font-weight: 900; color: #0ea5e9; }
    .e8-title { font-size: 11pt; font-weight: 600; color: #64748b; letter-spacing: 2pt; text-transform: uppercase; }
    
    .e8-m-timeline-container { position: relative; padding: 30pt 40pt; flex: 1; }
    .e8-m-timeline-line { position: absolute; left: 49.5pt; top: 30pt; bottom: 30pt; width: 1pt; background: #cbd5e1; }
    
    .e8-m-section { margin-bottom: 25pt; position: relative; }
    .e8-m-heading-row { display: flex; align-items: center; margin-bottom: 15pt; }
    .e8-m-icon-node { width: 20pt; height: 20pt; border-radius: 50%; background: #0ea5e9; color: #fff; display: flex; justify-content: center; align-items: center; z-index: 3; font-size: 10pt; }
    .e8-m-heading { font-size: 13pt; font-weight: 800; color: #1a2935; margin-left: 15pt; letter-spacing: 1pt; }
    
    .e8-m-content { padding-left: 35pt; }
    .e8-summary { font-size: 9.5pt; line-height: 1.7; color: #4b5563; text-align: justify; }
    
    .e8-skills-grid { display: flex; flex-wrap: wrap; gap: 10pt; }
    .e8-skill-item { font-size: 9pt; font-weight: 600; color: #4b5563; border-bottom: 2pt solid #0ea5e9; padding-bottom: 4pt; min-width: 80pt; }
    
    .e8-layout .exp-item { position: relative; margin-bottom: 20pt; }
    .e8-layout .exp-item::before {
       content: '';
       position: absolute;
       left: -28pt; 
       top: 4pt;
       width: 6pt; height: 6pt;
       border-radius: 50%;
       background: #0ea5e9;
    }
    .e8-layout .exp-row { display: flex; justify-content: space-between; align-items: baseline; }
    .e8-layout .exp-role { font-size: 11pt; font-weight: 800; color: #1a2935; text-transform: uppercase; margin-bottom: 4pt; }
    .e8-layout .exp-date { font-size: 9pt; font-weight: 700; color: #0ea5e9; }
    .e8-layout .exp-company { font-size: 9.5pt; font-style: italic; color: #64748b; margin-bottom: 6pt; }
    .e8-layout .exp-desc { font-size: 9.5pt; line-height: 1.6; color: #4b5563; }
    
    /* Titan-1: PRO (Curved Sidebar) */
    .t1-layout { display: flex; background: #fff; }
    
    .t1-sidebar { width: 210pt; display: flex; flex-direction: column; background: #e2e8f0; flex-shrink: 0; }
    .t1-photo-area { height: 200pt; display: flex; justify-content: center; align-items: center; padding-top: 15pt; }
    .t1-photo-box { width: 130pt; height: 130pt; border-radius: 15pt; overflow: hidden; background: #333; }
    .t1-photo { width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%); }
    .t1-dark-area { flex: 1; background: #1e293b; border-top-right-radius: 40pt; padding: 40pt 25pt; color: #fff; }
    
    .t1-s-section { margin-bottom: 25pt; }
    .t1-s-title { font-size: 11pt; font-weight: 800; color: #fff; text-transform: uppercase; margin-bottom: 12pt; padding-bottom: 5pt; border-bottom: 1.5pt solid #fff; display: inline-block; letter-spacing: 0.5pt; }
    .t1-s-item { margin-bottom: 12pt; font-size: 9pt; color: #cbd5e1; line-height: 1.4; }
    .t1-s-label { color: #fff; font-size: 9.5pt; font-weight: 700; }
    
    .t1-main { flex: 1; display: flex; flex-direction: column; background: #fff; }
    .t1-header { background: #facc15; height: 120pt; display: flex; flex-direction: column; justify-content: center; padding-left: 40pt; margin-top: 35pt; }
    .t1-name { font-size: 30pt; letter-spacing: 1pt; margin-bottom: 5pt; text-transform: uppercase; }
    .t1-name-bold { font-weight: 900; color: #1e293b; }
    .t1-name-light { font-weight: 300; color: #1e293b; }
    .t1-jobtitle { font-size: 10pt; font-weight: 600; color: #1e293b; letter-spacing: 1.5pt; text-transform: uppercase; }
    
    .t1-content { padding: 35pt 40pt; flex: 1; }
    
    .t1-m-section { margin-bottom: 25pt; }
    .t1-m-title { font-size: 13pt; font-weight: 800; color: #1e293b; text-transform: uppercase; margin-bottom: 15pt; padding-bottom: 6pt; border-bottom: 1.5pt solid #1e293b; letter-spacing: 0.5pt; }
    .t1-m-text { font-size: 9.5pt; color: #4b5563; line-height: 1.7; text-align: justify; }
    
    .t1-layout .exp-item {
      display: grid;
      grid-template-columns: 90pt 1fr;
      grid-template-areas: 
        "company row"
        ". desc";
      column-gap: 15pt;
      margin-bottom: 20pt;
    }
    .t1-layout .exp-company { grid-area: company; font-size: 9.5pt; font-weight: 700; color: #1e293b; margin-top: 2pt; line-height: 1.4; }
    .t1-layout .exp-row { grid-area: row; display: flex; flex-direction: column; }
    .t1-layout .exp-role { font-size: 11pt; font-weight: 800; color: #1e293b; margin-bottom: 2pt; }
    .t1-layout .exp-date { font-size: 9pt; font-weight: 600; color: #64748b; margin-bottom: 6pt; }
    .t1-layout .exp-desc { grid-area: desc; font-size: 9.5pt; color: #4b5563; line-height: 1.6; text-align: justify; }
    
    .t1-skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15pt; }
    .t1-skill-item { font-size: 9pt; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5pt; display: flex; align-items: center; }
    .t1-skill-item::before { content: '•'; margin-right: 6pt; color: #facc15; font-size: 14pt; }
    
    /* Titan-2: DOME */
    .t2-layout { display: flex; flex-direction: column; background: #fff; padding: 25pt; }
    
    .t2-top { display: flex; margin-bottom: 15pt; }
    .t2-dome-wrapper { width: 170pt; flex-shrink: 0; }
    .t2-dome { width: 170pt; height: 180pt; background: #2a1b38; border-top-left-radius: 85pt; border-top-right-radius: 85pt; display: flex; justify-content: center; align-items: flex-end; padding-bottom: 20pt; }
    .t2-photo-box { width: 110pt; height: 110pt; border-radius: 50%; border: 4pt solid #fff; overflow: hidden; background: #333; }
    .t2-photo { width: 100%; height: 100%; object-fit: cover; }
    
    .t2-header-right { flex: 1; padding-left: 20pt; padding-top: 25pt; }
    .t2-name { font-size: 32pt; letter-spacing: 1pt; margin-bottom: 5pt; text-transform: uppercase; color: #1e293b; }
    .t2-name-bold { font-weight: 900; }
    .t2-name-light { font-weight: 300; }
    .t2-title-badge { display: inline-block; background: #9b7eb5; color: #fff; font-size: 11pt; font-weight: 700; padding: 6pt 15pt; border-radius: 15pt; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 15pt; }
    .t2-summary { font-size: 9.5pt; color: #64748b; line-height: 1.6; text-align: justify; }
    
    .t2-pills-row { display: flex; gap: 10pt; margin-top: -10pt; margin-bottom: 25pt; position: relative; z-index: 5; }
    .t2-pill { font-size: 8pt; font-weight: 700; padding: 6pt 12pt; border-radius: 15pt; display: flex; align-items: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .t2-pill-dark { background: #9b7eb5; color: #fff; width: 146pt; justify-content: center; }
    .t2-pill-light { background: #9b7eb5; color: #fff; flex: 1; justify-content: center; }
    .t2-pill .t2-icon { margin-right: 5pt; font-size: 10pt; }
    
    .t2-columns { display: flex; flex: 1; }
    .t2-sidebar { width: 170pt; background: #2a1b38; border-bottom-left-radius: 20pt; border-bottom-right-radius: 20pt; padding: 25pt 20pt; color: #fff; flex-shrink: 0; }
    
    .t2-s-section { margin-bottom: 25pt; }
    .t2-s-title-row { display: flex; align-items: center; margin-bottom: 15pt; padding-bottom: 5pt; border-bottom: 1pt solid #fff; }
    .t2-s-icon { width: 20pt; height: 20pt; border-radius: 50%; background: #9b7eb5; color: #fff; display: flex; justify-content: center; align-items: center; margin-right: 8pt; font-size: 10pt; }
    .t2-s-heading { font-size: 11pt; font-weight: 800; color: #fff; text-transform: uppercase; letter-spacing: 0.5pt; }
    
    .t2-s-item { margin-bottom: 15pt; }
    .t2-s-subtitle { font-size: 9.5pt; font-weight: 700; color: #fff; margin-bottom: 2pt; }
    .t2-s-date { font-size: 8pt; color: #9b7eb5; margin-bottom: 4pt; font-weight: 700; }
    .t2-s-item-title { font-size: 10.5pt; font-weight: 800; color: #fff; text-transform: uppercase; }
    
    .t2-lang-row { display: flex; align-items: center; margin-bottom: 8pt; }
    .t2-lang-name { width: 50pt; font-size: 8.5pt; font-weight: 700; color: #fff; }
    .t2-lang-bar { flex: 1; height: 3pt; background: #4c336b; border-radius: 2pt; overflow: hidden; }
    .t2-lang-fill { width: 75%; height: 100%; background: #9b7eb5; }
    
    .t2-main { flex: 1; padding-left: 20pt; }
    .t2-m-section { margin-bottom: 25pt; }
    .t2-m-title-row { display: flex; align-items: center; margin-bottom: 15pt; }
    .t2-m-icon { width: 22pt; height: 22pt; border-radius: 50%; background: #9b7eb5; color: #fff; display: flex; justify-content: center; align-items: center; margin-right: 8pt; font-size: 11pt; }
    .t2-m-heading { font-size: 12pt; font-weight: 800; color: #2a1b38; text-transform: uppercase; letter-spacing: 0.5pt; }
    
    .t2-layout .exp-item {
      display: grid;
      grid-template-columns: 25pt 1fr;
      grid-template-areas: 
        "date company"
        "date role"
        "date desc";
      column-gap: 15pt;
      margin-bottom: 20pt;
      align-items: start;
    }
    .t2-layout .exp-row { display: contents; } 
    .t2-layout .exp-date { 
      grid-area: date; 
      background: #9b7eb5; 
      color: #fff; 
      font-size: 7.5pt; 
      font-weight: 700; 
      padding: 8pt 4pt; 
      border-radius: 12pt; 
      text-align: center; 
      writing-mode: vertical-rl; 
      transform: rotate(180deg); 
      height: 60pt; 
      display: flex; justify-content: center; align-items: center; 
      margin-top: 2pt;
    }
    .t2-layout .exp-company { grid-area: company; font-size: 9.5pt; font-style: italic; color: #64748b; margin-bottom: 2pt; font-weight: 600; }
    .t2-layout .exp-role { grid-area: role; font-size: 11pt; font-weight: 800; color: #2a1b38; margin-bottom: 6pt; text-transform: uppercase; }
    .t2-layout .exp-desc { grid-area: desc; font-size: 9.5pt; color: #4b5563; line-height: 1.6; text-align: justify; }
    
    .t2-skills-grid { display: grid; grid-template-columns: 1fr 1fr; column-gap: 15pt; row-gap: 10pt; }
    .t2-skill-row { display: flex; align-items: center; }
    .t2-skill-name { width: 80pt; font-size: 8.5pt; font-weight: 700; color: #2a1b38; }
    .t2-skill-bar { flex: 1; height: 3pt; background: #e2e8f0; border-radius: 2pt; overflow: hidden; }
    .t2-skill-fill { width: 75%; height: 100%; background: #9b7eb5; }

    /* Titan-3: ORANGE SPLIT (REDESIGNED) */
    .t3-layout { display: flex; background: #fff; height: 100%; font-family: 'Inter', sans-serif; }
    .t3-sidebar { width: 180pt; background: #1a1a1a; padding: 40pt 20pt; flex-shrink: 0; color: #fff; display: flex; flex-direction: column; }
    
    .t3-photo-area { margin-bottom: 30pt; text-align: center; }
    .t3-photo-box { width: 110pt; height: 110pt; border-radius: 50%; border: 3pt solid #ea580c; margin: 0 auto; overflow: hidden; background: #333; }
    .t3-photo { width: 100%; height: 100%; object-fit: cover; }
    
    .t3-s-section { margin-bottom: 25pt; }
    .t3-s-title { font-size: 10pt; font-weight: 800; color: #ea580c; letter-spacing: 2pt; margin-bottom: 15pt; text-transform: uppercase; display: flex; align-items: center; gap: 8pt; }
    .t3-s-title::after { content: ''; flex: 1; height: 1pt; background: rgba(234, 88, 12, 0.3); }
    
    .t3-s-item { margin-bottom: 12pt; }
    .t3-s-label { font-size: 8pt; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 3pt; }
    .t3-s-value { font-size: 9pt; color: #f1f5f9; word-break: break-all; line-height: 1.4; font-weight: 500; }
    .t3-s-item-small { font-size: 8.5pt; color: #cbd5e1; margin-bottom: 4pt; }
    
    .t3-main { flex: 1; padding: 40pt 30pt; background: #fff; }
    .t3-header { margin-bottom: 35pt; }
    .t3-name-row { margin-bottom: 5pt; }
    .t3-name-first { font-size: 36pt; font-weight: 200; color: #1e293b; text-transform: uppercase; letter-spacing: -1pt; }
    .t3-name-last { font-size: 36pt; font-weight: 900; color: #ea580c; text-transform: uppercase; letter-spacing: -1pt; }
    .t3-jobtitle { font-size: 13pt; font-weight: 600; color: #64748b; letter-spacing: 4pt; text-transform: uppercase; margin-top: 5pt; }
    
    .t3-m-section { margin-bottom: 30pt; }
    .t3-m-title { font-size: 12pt; font-weight: 800; color: #1e293b; letter-spacing: 1.5pt; margin-bottom: 15pt; text-transform: uppercase; display: flex; align-items: center; }
    .t3-m-title span { position: relative; padding-right: 10pt; }
    .t3-m-title::after { content: ''; flex: 1; height: 1.5pt; background: #ea580c; }
    
    .t3-m-text { font-size: 9.5pt; color: #334155; line-height: 1.6; text-align: justify; }
    
    .t3-exp-item { margin-bottom: 20pt; }
    .t3-exp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3pt; }
    .t3-exp-role { font-size: 11pt; font-weight: 800; color: #1e293b; }
    .t3-exp-date { font-size: 8.5pt; font-weight: 700; color: #ea580c; background: #fff7ed; padding: 2pt 8pt; border-radius: 4pt; }
    .t3-exp-company { font-size: 9.5pt; font-weight: 700; color: #64748b; margin-bottom: 6pt; }
    .t3-exp-desc { font-size: 9.5pt; color: #475569; line-height: 1.5; }
    
    .t3-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 25pt; }
    
    .t3-edu-item { margin-bottom: 12pt; }
    .t3-edu-degree { font-size: 10pt; font-weight: 800; color: #1e293b; margin-bottom: 2pt; }
    .t3-edu-school { font-size: 9pt; font-weight: 600; color: #64748b; }
    .t3-edu-year { font-size: 8.5pt; font-weight: 700; color: #ea580c; }
    
    /* Titan-3: ORANGE SPLIT (COMPACT REDESIGN) */
    .t3-layout { display: flex; background: #fff; height: 100%; font-family: 'Inter', sans-serif; overflow: hidden; }
    .t3-sidebar { width: 175pt; background: #1a1a1a; padding: 30pt 18pt; flex-shrink: 0; color: #fff; display: flex; flex-direction: column; }
    
    .t3-photo-area { margin-bottom: 20pt; text-align: center; }
    .t3-photo-box { width: 95pt; height: 95pt; border-radius: 50%; border: 3pt solid #ea580c; margin: 0 auto; overflow: hidden; background: #333; }
    .t3-photo { width: 100%; height: 100%; object-fit: cover; }
    
    .t3-s-section { margin-bottom: 20pt; }
    .t3-s-title { font-size: 9.5pt; font-weight: 800; color: #ea580c; letter-spacing: 1.5pt; margin-bottom: 12pt; text-transform: uppercase; display: flex; align-items: center; gap: 6pt; }
    .t3-s-title::after { content: ''; flex: 1; height: 1pt; background: rgba(234, 88, 12, 0.3); }
    
    .t3-s-item { margin-bottom: 10pt; }
    .t3-s-label { font-size: 7.5pt; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 2pt; }
    .t3-s-value { font-size: 8.5pt; color: #f1f5f9; word-break: break-all; line-height: 1.3; font-weight: 500; }
    .t3-s-item-small { font-size: 8pt; color: #cbd5e1; margin-bottom: 3pt; }
    
    .t3-main { flex: 1; padding: 30pt 25pt; background: #fff; overflow: hidden; display: flex; flex-direction: column; }
    .t3-header { margin-bottom: 20pt; }
    .t3-name-row { margin-bottom: 2pt; }
    .t3-name-first { font-size: 28pt; font-weight: 200; color: #1e293b; text-transform: uppercase; letter-spacing: -1pt; }
    .t3-name-last { font-size: 28pt; font-weight: 900; color: #ea580c; text-transform: uppercase; letter-spacing: -1pt; }
    .t3-jobtitle { font-size: 11pt; font-weight: 600; color: #64748b; letter-spacing: 3pt; text-transform: uppercase; margin-top: 2pt; }
    
    .t3-m-section { margin-bottom: 18pt; }
    .t3-m-title { font-size: 11pt; font-weight: 800; color: #1e293b; letter-spacing: 1pt; margin-bottom: 10pt; text-transform: uppercase; display: flex; align-items: center; }
    .t3-m-title span { position: relative; padding-right: 8pt; }
    .t3-m-title::after { content: ''; flex: 1; height: 1.2pt; background: #ea580c; }
    
    .t3-m-text { font-size: 9pt; color: #334155; line-height: 1.5; text-align: justify; }
    
    .t3-exp-list { display: flex; flex-direction: column; gap: 12pt; }
    .t3-exp-item { margin-bottom: 0; }
    .t3-exp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2pt; }
    .t3-exp-role { font-size: 10.5pt; font-weight: 800; color: #1e293b; }
    .t3-exp-date { font-size: 8pt; font-weight: 700; color: #ea580c; background: #fff7ed; padding: 1.5pt 6pt; border-radius: 3pt; }
    .t3-exp-company { font-size: 9pt; font-weight: 700; color: #64748b; margin-bottom: 4pt; }
    .t3-exp-desc { font-size: 9pt; color: #475569; line-height: 1.4; }
    
    .t3-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20pt; }
    
    .t3-edu-item { margin-bottom: 8pt; }
    .t3-edu-degree { font-size: 9.5pt; font-weight: 800; color: #1e293b; margin-bottom: 1pt; }
    .t3-edu-school { font-size: 8.5pt; font-weight: 600; color: #64748b; }
    .t3-edu-year { font-size: 8pt; font-weight: 700; color: #ea580c; }
    
    .t3-skills-grid { display: flex; flex-wrap: wrap; gap: 6pt; }
    .t3-skill-item { font-size: 8pt; font-weight: 700; color: #1e293b; display: flex; align-items: center; text-transform: uppercase; background: #f8fafc; border: 1pt solid #e2e8f0; padding: 4pt 8pt; border-radius: 5pt; }
    .t3-skill-dot { width: 4pt; height: 4pt; border-radius: 50%; background: #ea580c; margin-right: 5pt; }

    .t3-project-list { display: flex; flex-direction: column; gap: 10pt; }
    .t3-project-item { margin-bottom: 0; }
    .t3-project-name { font-size: 9.5pt; font-weight: 800; color: #1e293b; margin-bottom: 2pt; }
    .t3-project-desc { font-size: 8.5pt; color: #475569; line-height: 1.3; }

    .t3-cert-list { display: flex; flex-direction: column; gap: 8pt; }
    .t3-cert-item { border-left: 1.5pt solid #ea580c; padding-left: 8pt; }
    .t3-cert-name { font-size: 9pt; font-weight: 800; color: #1e293b; }
    .bw3-cert-issuer { font-size: 8.5pt; color: #64748b; margin-top: 2pt; }

    /* BlackWolf-4: Elite Two-Column Redesign */
    .bw4-layout { padding: 40pt; background: #fff; color: #1a202c; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; height: 100%; box-sizing: border-box; word-wrap: break-word; overflow-wrap: break-word; }
    
    .bw4-header-box { border-bottom: 3pt solid #1a202c; padding-bottom: 20pt; margin-bottom: 15pt; display: flex; justify-content: space-between; align-items: flex-end; }
    .bw4-name-wrapper { flex: 1; }
    .bw4-name { font-size: 38pt; font-weight: 900; color: #1a202c; letter-spacing: 1pt; text-transform: uppercase; line-height: 1; margin-bottom: 6pt; }
    .bw4-title { font-size: 14pt; font-weight: 600; color: #718096; text-transform: uppercase; letter-spacing: 2pt; }
    
    .bw4-summary-wide { margin-bottom: 25pt; padding-right: 20pt; }
    .bw4-summary-text { font-size: 10pt; line-height: 1.6; color: #4a5568; text-align: justify; }

    .bw4-main-grid { display: flex; flex: 1; gap: 30pt; }
    
    .bw4-left-col { flex: 0.35; display: flex; flex-direction: column; gap: 20pt; border-right: 1pt solid #e2e8f0; padding-right: 20pt; }
    .bw4-right-col { flex: 0.65; display: flex; flex-direction: column; gap: 20pt; }
    
    .bw4-s-title { font-size: 11pt; font-weight: 800; color: #1a202c; text-transform: uppercase; letter-spacing: 1.5pt; margin-bottom: 12pt; border-bottom: 1pt solid #1a202c; padding-bottom: 6pt; }
    
    .bw4-c-item { font-size: 9.5pt; font-weight: 500; color: #4a5568; margin-bottom: 8pt; word-break: break-all; display: flex; align-items: center; }
    .bw4-c-icon { display: inline-flex; align-items: center; justify-content: center; width: 14pt; color: #1a202c; margin-right: 6pt; }
    .bw4-c-icon svg { width: 12pt; height: 12pt; }
    
    .bw4-skills-list { display: flex; flex-wrap: wrap; gap: 6pt; }
    .bw4-skill-tag { font-size: 9pt; font-weight: 600; color: #2d3748; background: #f7fafc; padding: 4pt 8pt; border-radius: 4pt; border: 1pt solid #e2e8f0; }
    
    .bw4-edu-item { margin-bottom: 12pt; }
    .bw4-edu-year { font-size: 9pt; font-weight: 700; color: #a0aec0; margin-bottom: 2pt; }
    .bw4-edu-degree { font-size: 10pt; font-weight: 800; color: #1a202c; margin-bottom: 2pt; line-height: 1.2; }
    .bw4-edu-school { font-size: 9pt; font-weight: 500; color: #4a5568; line-height: 1.3; }
    
    .bw4-summary-text { font-size: 10pt; line-height: 1.6; color: #4a5568; text-align: justify; }
    
    .bw4-exp-item { margin-bottom: 20pt; }
    .bw4-exp-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4pt; flex-wrap: wrap; gap: 10pt; }
    .bw4-exp-role { font-size: 12pt; font-weight: 800; color: #1a202c; }
    .bw4-exp-date { font-size: 9.5pt; font-weight: 700; color: #718096; white-space: nowrap; }
    .bw4-exp-company { font-size: 10.5pt; font-weight: 600; color: #2d3748; margin-bottom: 8pt; font-style: italic; }
    .bw4-exp-desc { font-size: 10pt; line-height: 1.6; color: #4a5568; text-align: justify; }

    /* Titan-4: RUBY DARK */
    .t4-layout { display: flex; background: #fff; height: 100%; }
    .t4-sidebar { width: 220pt; background: #1c1c1c; padding: 30pt 20pt; flex-shrink: 0; color: #fff; }
    
    .t4-photo-box { width: 120pt; height: 120pt; border-radius: 50%; border: 3pt solid #fff; margin: 0 auto 20pt auto; overflow: hidden; background: #333; }
    .t4-photo { width: 100%; height: 100%; object-fit: cover; }
    
    .t4-header { text-align: center; margin-bottom: 30pt; padding-bottom: 15pt; border-bottom: 1pt solid #333; }
    .t4-name { font-size: 24pt; font-weight: 900; line-height: 1.1; letter-spacing: 1pt; margin-bottom: 5pt; text-transform: uppercase; }
    .t4-name-white { color: #fff; }
    .t4-name-red { color: #dc2626; }
    .t4-jobtitle { font-size: 10pt; font-weight: 600; color: #d1d5db; letter-spacing: 2pt; text-transform: uppercase; }
    
    .t4-s-section { margin-bottom: 25pt; }
    .t4-heading-wrapper { display: flex; align-items: center; margin-bottom: 15pt; }
    .t4-heading-icon { width: 22pt; height: 22pt; border-radius: 50%; background: #dc2626; color: #fff; display: flex; justify-content: center; align-items: center; margin-right: -10pt; z-index: 2; position: relative; font-size: 11pt; }
    .t4-heading-text { border: 1pt solid #fff; border-radius: 12pt; padding: 3pt 15pt 3pt 20pt; font-size: 10pt; font-weight: 800; color: #fff; letter-spacing: 1pt; position: relative; z-index: 1; }
    
    .t4-s-skill-row { margin-bottom: 10pt; }
    .t4-s-skill-name { font-size: 8.5pt; font-weight: 700; color: #fff; margin-bottom: 3pt; }
    .t4-s-skill-bar { height: 4pt; background: #333; border-radius: 2pt; overflow: hidden; }
    .t4-s-skill-fill { width: 80%; height: 100%; background: #dc2626; }
    
    .t4-s-lang-row { margin-bottom: 6pt; }
    .t4-s-lang-name { font-size: 9pt; font-weight: 700; color: #d1d5db; display: flex; align-items: center; }
    .t4-s-lang-name::before { content: ''; width: 6pt; height: 6pt; border-radius: 50%; background: #dc2626; margin-right: 8pt; }
    
    .t4-main { flex: 1; padding: 30pt 25pt; }
    .t4-heading-wrapper-m { display: flex; align-items: center; margin-bottom: 15pt; }
    .t4-heading-text-m { border: 1pt solid #d1d5db; border-radius: 12pt; padding: 3pt 15pt 3pt 20pt; font-size: 11pt; font-weight: 800; color: #1f2937; letter-spacing: 1pt; position: relative; z-index: 1; }
    
    .t4-m-text { font-size: 9.5pt; color: #4b5563; line-height: 1.6; text-align: justify; margin-bottom: 25pt; }
    
    .t4-contact-row { display: flex; flex-wrap: wrap; gap: 10pt; margin-bottom: 25pt; justify-content: space-between; }
    .t4-contact-pill { background: #dc2626; color: #fff; font-size: 8pt; font-weight: 700; padding: 6pt 12pt; border-radius: 15pt; display: flex; align-items: center; flex: 1; justify-content: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .t4-c-icon { margin-right: 6pt; font-size: 10pt; }
    
    .t4-edu-item { display: grid; grid-template-columns: 100pt 1fr; gap: 15pt; margin-bottom: 25pt; }
    .t4-edu-school { font-size: 9.5pt; font-weight: 700; color: #1f2937; font-style: italic; margin-bottom: 3pt; }
    .t4-edu-year { font-size: 9pt; font-weight: 800; color: #dc2626; }
    .t4-edu-degree { font-size: 11pt; font-weight: 800; color: #1f2937; text-transform: uppercase; margin-bottom: 4pt; }
    .t4-edu-text { font-size: 9pt; color: #6b7280; line-height: 1.5; }
    
    .t4-layout .exp-item {
      display: grid;
      grid-template-columns: 100pt 1fr;
      grid-template-areas: 
        "company row"
        "date role"
        ". desc";
      column-gap: 15pt;
      margin-bottom: 20pt;
    }
    .t4-layout .exp-company { grid-area: company; font-size: 9.5pt; font-weight: 700; color: #1f2937; font-style: italic; margin-bottom: 3pt; }
    .t4-layout .exp-row { display: contents; }
    .t4-layout .exp-date { grid-area: date; font-size: 9pt; font-weight: 800; color: #dc2626; }
    .t4-layout .exp-role { grid-area: role; font-size: 11pt; font-weight: 800; color: #1f2937; text-transform: uppercase; margin-bottom: 6pt; }
    .t4-layout .exp-desc { grid-area: desc; font-size: 9.5pt; color: #4b5563; line-height: 1.6; text-align: justify; }

    /* BlackWolf-1: Premium Minimalist Redesign */
    .bw1-layout { 
      padding: 45pt; 
      font-family: 'Inter', sans-serif; 
      background: #fff; 
      color: #1a1a1a; 
      height: 100%; 
      display: flex; 
      flex-direction: column;
      box-sizing: border-box; 
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .bw1-header { 
      margin-bottom: 15pt; 
      border-bottom: 2pt solid #000;
      padding-bottom: 15pt;
    }
    .bw1-name-row { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; margin-bottom: 12pt; gap: 10pt; }
    .bw1-name { font-size: 32pt; font-weight: 800; text-transform: uppercase; letter-spacing: -1pt; line-height: 1; }
    .bw1-title { font-size: 11pt; font-weight: 600; text-transform: uppercase; letter-spacing: 2pt; color: #666; }
    
    .bw1-contact-bar { display: flex; flex-wrap: wrap; gap: 20pt; margin-bottom: 5pt; }
    .bw1-c-item { font-size: 9pt; font-weight: 500; display: flex; align-items: center; gap: 6pt; color: #444; }
    .bw1-c-item svg { width: 10pt; height: 10pt; color: #000; }
    
    .bw1-content { display: flex; gap: 40pt; flex: 1; }
    .bw1-main { flex: 1.6; }
    .bw1-sidebar { flex: 1; }
    
    .bw1-section { margin-bottom: 30pt; }
    .bw1-heading { 
      font-size: 10pt; 
      font-weight: 800; 
      text-transform: uppercase; 
      letter-spacing: 2pt; 
      color: #000; 
      margin-bottom: 15pt; 
      background: #f3f4f6;
      padding: 4pt 10pt;
      display: inline-block;
    }
    
    .bw1-text { font-size: 10pt; line-height: 1.6; color: #333; text-align: justify; }
    
    .bw1-skills-grid { display: flex; flex-wrap: wrap; gap: 6pt; }
    .bw1-skill-pill { 
      font-size: 8.5pt; 
      font-weight: 600; 
      background: #fff; 
      color: #000; 
      border: 1pt solid #e5e7eb; 
      padding: 4pt 10pt;
      border-radius: 4pt;
    }
    
    .bw1-edu-item { margin-bottom: 15pt; }
    .bw1-edu-degree { font-size: 10pt; font-weight: 700; color: #000; margin-bottom: 2pt; }
    .bw1-edu-school { font-size: 9.5pt; color: #444; font-weight: 500; }
    .bw1-edu-year { font-size: 8.5pt; color: #666; font-weight: 600; margin-top: 2pt; }

    /* BlackWolf-1 Shared Logic */
    .bw1-layout .exp-item { margin-bottom: 25pt; position: relative; }
    .bw1-layout .exp-row { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; margin-bottom: 4pt; gap: 10pt; }
    .bw1-layout .exp-role { font-size: 11pt; font-weight: 800; color: #000; }
    .bw1-layout .exp-date { font-size: 9pt; font-weight: 700; color: #666; }
    .bw1-layout .exp-company { font-size: 10pt; font-weight: 600; color: #444; margin-bottom: 8pt; font-style: italic; }
    .bw1-layout .exp-desc { font-size: 9.5pt; line-height: 1.6; color: #333; text-align: justify; }

    /* BlackWolf-1: Modern Sidebar (Balanced) */
    .bw1-layout { display: flex; font-family: 'Inter', sans-serif; background: #fff; color: #1e293b; height: 100%; }
    .bw1-sidebar { width: 1.8fr; background: #f8fafc; padding: 30pt 20pt; border-right: 1.5pt solid #cbd5e1; }
    .bw1-main { flex: 1.8; padding: 35pt 25pt; background: #fff; }

    /* BlackWolf-2: Stacked Professional (Clean Redesign) */
    .bw2-layout { 
      padding: 28pt; 
      font-family: 'Inter', sans-serif; 
      color: #0f172a; 
      background: #fff; 
      display: flex;
      flex-direction: column;
    }
    .bw2-header {
      text-align: center;
      margin-bottom: 20pt;
      padding-bottom: 14pt;
      border-bottom: 1pt solid #e2e8f0;
    }
    .bw2-name {
      font-size: 32pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1pt;
      color: #0f172a;
      margin-bottom: 5pt;
    }
    .bw2-title {
      font-size: 13pt;
      font-weight: 500;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 3pt;
    }
    .bw2-contact-row {
      display: flex;
      justify-content: center;
      gap: 25pt;
      margin-top: 15pt;
      font-size: 9pt;
      color: #475569;
    }
    .bw2-c-item { display: flex; align-items: center; gap: 5pt; }
    .bw2-c-item svg { width: 10pt; height: 10pt; color: #0f172a; }

    .bw2-section { margin-bottom: 18pt; width: 100%; }
    .bw2-heading {
      font-size: 10pt;
      font-weight: 900;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 10pt;
      margin-bottom: 8pt;
      text-transform: uppercase;
      letter-spacing: 1pt;
    }
    .bw2-heading::after {
      content: '';
      flex: 1;
      height: 1pt;
      background: #e2e8f0;
    }
    
    .bw2-summary { font-size: 10pt; line-height: 1.5; color: #334155; }
    
    .bw2-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14pt;
    }
    
    .bw2-item { margin-bottom: 12pt; }
    .bw2-item-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4pt; }
    .bw2-item-title { font-size: 11pt; font-weight: 800; color: #0f172a; }
    .bw2-item-date { font-size: 9pt; font-weight: 700; color: #64748b; }
    .bw2-item-sub { font-size: 10pt; font-weight: 600; color: #475569; margin-bottom: 6pt; }
    .bw2-item-desc { font-size: 9.5pt; color: #334155; line-height: 1.5; }
    
    .bw2-skills-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 8pt;
    }
    .bw2-skill-tag {
      background: #f1f5f9;
      padding: 4pt 10pt;
      border-radius: 4pt;
      font-size: 9pt;
      font-weight: 600;
      color: #0f172a;
      border: 1pt solid #e2e8f0;
    }
    
    .bw2-bullet-list { margin-top: 5pt; padding-left: 12pt; }
    .bw2-bullet-item { font-size: 9.5pt; color: #334155; margin-bottom: 4pt; position: relative; }
    .bw2-bullet-item::before { content: '•'; position: absolute; left: -12pt; color: #0f172a; font-weight: 900; }
    
    .bw2-separator { border-bottom: 1pt solid #f1f5f9; margin: 15pt 0; }

    /* BlackWolf-3: Bordered Professional (New) */
    .bw3-layout { 
      padding: 0; 
      font-family: 'Inter', sans-serif; 
      color: #111; 
      background: #fff; 
      position: relative; 
      width: 595pt; 
      height: 842pt; 
    }
    .bw3-border-box { 
      position: absolute;
      top: 20pt;
      left: 20pt;
      right: 20pt;
      bottom: 20pt;
      border: 1.5pt solid #000; 
      padding: 35pt; 
      display: flex; 
      flex-direction: column; 
      overflow: hidden; 
    }
    .bw3-header { text-align: center; margin-bottom: 20pt; }
    .bw3-name { font-size: 32pt; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: 3pt; margin-bottom: 4pt; }
    .bw3-title { font-size: 13pt; font-weight: 400; color: #475569; text-transform: uppercase; letter-spacing: 5pt; margin-bottom: 15pt; }
    .bw3-contact-bar { display: flex; justify-content: center; gap: 20pt; padding: 8pt 0; border-top: 1pt solid #cbd5e1; border-bottom: 1pt solid #cbd5e1; margin-bottom: 20pt; }
    .bw3-c-item { display: flex; align-items: center; gap: 6pt; font-size: 8.5pt; font-weight: 600; color: #334155; }
    .bw3-c-item svg { width: 10pt; height: 10pt; }
    .bw3-section { margin-bottom: 20pt; }
    .bw3-s-title { font-size: 11pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 4pt; color: #0f172a; }
    .bw3-s-line { height: 1pt; background: #94a3b8; width: 100%; margin-bottom: 10pt; }
    .bw3-summary { font-size: 9pt; line-height: 1.5; color: #334155; }
    .bw3-split-row { display: flex; margin-bottom: 12pt; gap: 25pt; }
    .bw3-split-left { flex: 0.8; font-size: 8.5pt; font-weight: 700; color: #64748b; }
    .bw3-split-right { flex: 2.2; }
    .bw3-item-title { font-size: 10.5pt; font-weight: 800; color: #1e293b; }
    .bw3-item-subtitle { font-size: 8.5pt; font-weight: 700; color: #64748b; margin-top: 2pt; }
    .bw3-item-desc { font-size: 8.5pt; color: #475569; line-height: 1.5; margin-top: 4pt; }
    .bw3-skills-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10pt; margin-top: 8pt; }
    .bw3-skill-item { font-size: 8.5pt; font-weight: 600; display: flex; align-items: center; gap: 4pt; }
    .bw3-skill-item::before { content: '•'; color: #000; font-weight: 900; }
    .bw3-refs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25pt; }
    .bw3-ref-card { font-size: 8.5pt; }
    .bw3-ref-name { font-size: 9.5pt; font-weight: 800; color: #1e293b; margin-bottom: 2pt; }
    .bw3-ref-info { color: #64748b; line-height: 1.4; }

    /* Jocker-1: Redesigned Two-Column */
    .jk1-layout { display: flex; background: #fff; height: 100%; }
    .jk1-sidebar { width: 185pt; background: #343a40; color: #fff; padding: 35pt 20pt; flex-shrink: 0; }
    .jk1-photo-area { display: flex; justify-content: center; margin-bottom: 25pt; }
    .jk1-photo-box { width: 110pt; height: 110pt; border-radius: 50%; overflow: hidden; border: 3pt solid rgba(255,255,255,0.2); background: #495057; }
    .jk1-photo { width: 100%; height: 100%; object-fit: cover; }
    .jk1-sidebar-content { display: flex; flex-direction: column; gap: 25pt; }
    .jk1-s-title { font-size: 14pt; font-weight: 800; text-transform: uppercase; border-bottom: 1pt solid rgba(255,255,255,0.2); padding-bottom: 6pt; margin-bottom: 12pt; letter-spacing: 1pt; }
    .jk1-s-item { font-size: 9pt; line-height: 1.5; color: #dee2e6; margin-bottom: 10pt; }
    .jk1-s-item strong { color: #fff; font-size: 9.5pt; display: inline-block; margin-bottom: 2pt; }
    .jk1-s-list { list-style: none; padding: 0; }
    .jk1-s-list li { font-size: 9.5pt; color: #dee2e6; margin-bottom: 6pt; display: flex; align-items: center; gap: 8pt; }
    .jk1-s-list li::before { content: '•'; color: #ec4899; font-size: 14pt; }
    
    .jk1-main { flex: 1; padding: 45pt 35pt; background: #fff; display: flex; flex-direction: column; gap: 30pt; }
    .jk1-name { font-size: 32pt; font-weight: 800; color: #212529; text-transform: uppercase; letter-spacing: 1pt; line-height: 1.1; }
    .jk1-job { font-size: 14pt; font-weight: 600; color: #495057; text-transform: uppercase; letter-spacing: 2pt; margin: 8pt 0 15pt 0; }
    .jk1-summary { font-size: 10pt; line-height: 1.7; color: #495057; text-align: justify; border-top: 1pt solid #f1f5f9; padding-top: 15pt; }
    
    .jk1-section-title { font-size: 14pt; font-weight: 800; color: #212529; text-transform: uppercase; border-bottom: 2pt solid #f1f5f9; padding-bottom: 8pt; margin-bottom: 20pt; letter-spacing: 1.5pt; }
    .jk1-timeline { border-left: 1.5pt solid #dee2e6; margin-left: 8pt; padding-left: 20pt; display: flex; flex-direction: column; gap: 20pt; }
    .jk1-exp-item { position: relative; }
    .jk1-exp-dot { position: absolute; left: -24.5pt; top: 4pt; width: 8pt; height: 8pt; border-radius: 50%; background: #fff; border: 2pt solid #343a40; z-index: 2; }
    .jk1-exp-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5pt; }
    .jk1-exp-date { font-size: 9.5pt; font-weight: 800; color: #495057; }
    .jk1-exp-company { font-size: 10pt; font-weight: 600; color: #868e96; }
    .jk1-exp-role { font-size: 11pt; font-weight: 800; color: #212529; margin-bottom: 8pt; }
    .jk1-exp-desc { font-size: 9.5pt; line-height: 1.6; color: #495057; text-align: justify; }
    
    .jk1-ref-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20pt; }
    .jk1-ref-name { font-size: 11pt; font-weight: 800; color: #212529; margin-bottom: 2pt; }
    .jk1-ref-info { font-size: 9pt; font-weight: 600; color: #868e96; margin-bottom: 6pt; }
    .jk1-ref-contact { font-size: 8.5pt; color: #495057; margin-bottom: 2pt; }

    /* Jocker-2: Soft Pink Elegance (Canva Style) */
    .jk2-layout { display: flex; background: #fff; height: 100%; font-family: 'Montserrat', sans-serif; color: #2d2d2d; }
    .jk2-sidebar { width: 220pt; background: #f2e3e1; padding: 40pt 25pt; flex-shrink: 0; display: flex; flex-direction: column; gap: 25pt; }
    .jk2-photo-frame { border: 1pt solid #c5a992; padding: 8pt; background: #fff; margin-bottom: 10pt; }
    .jk2-photo-box { width: 100%; aspect-ratio: 1; overflow: hidden; background: #eee; }
    .jk2-photo { width: 100%; height: 100%; object-fit: cover; }
    
    .jk2-s-header { background: #fff; padding: 6pt 12pt; font-size: 11pt; font-weight: 800; text-transform: uppercase; letter-spacing: 2pt; margin-bottom: 12pt; text-align: center; color: #2d2d2d; }
    .jk2-s-text { font-size: 9pt; line-height: 1.6; color: #4a4a4a; margin-bottom: 15pt; }
    .jk2-c-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 10pt; }
    .jk2-c-item { display: flex; align-items: center; gap: 10pt; font-size: 8.5pt; color: #4a4a4a; }
    .jk2-c-icon { width: 14pt; height: 14pt; color: #a67c52; flex-shrink: 0; }
    .jk2-list { list-style: none; padding: 0; margin-left: 5pt; }
    .jk2-list li { font-size: 9.5pt; margin-bottom: 6pt; position: relative; padding-left: 12pt; }
    .jk2-list li::before { content: '•'; position: absolute; left: 0; color: #2d2d2d; }

    .jk2-main { flex: 1; padding: 40pt 35pt; display: flex; flex-direction: column; gap: 30pt; }
    .jk2-name-area { margin-bottom: 10pt; position: relative; }
    .jk2-name { font-size: 38pt; font-weight: 900; text-transform: uppercase; letter-spacing: 2pt; color: #2d2d2d; line-height: 1.1; }
    .jk2-job { font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 3pt; color: #2d2d2d; margin-top: 15pt; border-top: 2pt solid #f2e3e1; padding-top: 10pt; display: inline-block; }
    
    .jk2-section-bar { background: #f2e3e1; padding: 6pt 15pt; font-size: 12pt; font-weight: 800; text-transform: uppercase; letter-spacing: 2pt; color: #2d2d2d; margin-bottom: 20pt; }
    .jk2-exp-item { margin-bottom: 20pt; }
    .jk2-exp-role { font-size: 10.5pt; font-weight: 800; text-transform: uppercase; color: #2d2d2d; margin-bottom: 2pt; }
    .jk2-exp-company { font-size: 9.5pt; font-weight: 700; color: #4a4a4a; margin-bottom: 2pt; }
    .jk2-exp-date { font-size: 9pt; font-weight: 600; color: #666; margin-bottom: 8pt; }
    .jk2-exp-desc { font-size: 9.5pt; line-height: 1.6; color: #4a4a4a; text-align: justify; }
    .jk2-exp-desc { font-size: 9.5pt; line-height: 1.6; color: #4a4a4a; text-align: justify; }
    
    .jk2-card { background: #fff; padding: 20pt; border-radius: 12pt; box-shadow: 0 4pt 6pt -1pt rgba(0,0,0,0.05); }
    .jk2-card-title { font-size: 10pt; font-weight: 800; color: #1a202c; margin-bottom: 12pt; display: flex; align-items: center; gap: 8pt; }
    .jk2-card-title::after { content: ''; flex: 1; height: 1pt; background: #e2e8f0; }
    .jk2-text { font-size: 9.5pt; line-height: 1.6; color: #4a5568; }
    .jk2-exp-item { margin-bottom: 15pt; padding-left: 15pt; border-left: 2pt solid #f1f5f9; position: relative; }
    .jk2-exp-dot { position: absolute; left: -5pt; top: 4pt; width: 8pt; height: 8pt; border-radius: 50%; background: #ec4899; border: 2pt solid #fff; }
    .jk2-exp-header { display: flex; justify-content: space-between; align-items: baseline; }
    .jk2-exp-role { font-size: 10.5pt; font-weight: 800; color: #1a202c; }
    .jk2-exp-date { font-size: 8.5pt; font-weight: 700; color: #ec4899; }
    .jk2-exp-company { font-size: 9pt; font-weight: 600; color: #64748b; }
    .jk2-skills-wrap { display: flex; flex-wrap: wrap; gap: 8pt; }
    .jk2-skill-dot { font-size: 9pt; font-weight: 600; color: #1a202c; display: flex; align-items: center; gap: 4pt; }
    .jk2-skill-dot::before { content: ''; width: 4pt; height: 4pt; border-radius: 50%; background: #ec4899; }

    /* JOCKER-3: BOLD */
    .jk3-layout { display: flex; height: 100%; background: #fff; font-family: 'Inter', sans-serif; box-sizing: border-box; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; }
    .jk3-sidebar { width: 35%; padding: 40pt 25pt; color: #fff; display: flex; flex-direction: column; gap: 25pt; min-width: 0; }
    .jk3-photo-box { width: 120pt; height: 120pt; border-radius: 50%; overflow: hidden; border: 4pt solid rgba(255,255,255,0.2); margin: 0 auto 10pt auto; flex-shrink: 0; }
    .jk3-photo { width: 100%; height: 100%; object-fit: cover; }
    .jk3-s-title-light { font-size: 12pt; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 2pt; margin-bottom: 12pt; border-bottom: 2pt solid rgba(255,255,255,0.3); padding-bottom: 4pt; }
    .jk3-c-item { display: flex; align-items: flex-start; gap: 8pt; font-size: 9pt; font-weight: 500; margin-bottom: 10pt; color: rgba(255,255,255,0.9); word-break: break-all; }
    .jk3-c-item svg { width: 12pt; height: 12pt; color: #fff; flex-shrink: 0; margin-top: 1pt; }
    .jk3-skills-list { display: flex; flex-wrap: wrap; gap: 6pt; }
    .jk3-skill-tag { font-size: 9pt; font-weight: 700; color: #1a202c; background: #fff; padding: 4pt 10pt; border-radius: 12pt; margin-bottom: 4pt; word-break: normal; }
    
    .jk3-main { width: 65%; padding: 45pt 35pt; display: flex; flex-direction: column; gap: 25pt; min-width: 0; }
    .jk3-header { margin-bottom: 10pt; }
    .jk3-name { font-size: 38pt; font-weight: 900; color: #1a202c; text-transform: uppercase; letter-spacing: -1pt; line-height: 1.1; margin-bottom: 8pt; }
    .jk3-title { font-size: 14pt; font-weight: 800; text-transform: uppercase; letter-spacing: 3pt; line-height: 1.4; }
    
    .jk3-section { margin-bottom: 5pt; }
    .jk3-s-title { font-size: 14pt; font-weight: 900; color: #1a202c; text-transform: uppercase; letter-spacing: 1.5pt; margin-bottom: 12pt; display: inline-block; border-bottom: 3pt solid #1a202c; padding-bottom: 2pt; }
    .jk3-summary { font-size: 10pt; line-height: 1.6; color: #4a5568; text-align: justify; }
    
    .jk3-timeline { display: flex; flex-direction: column; gap: 18pt; }
    .jk3-exp-item { display: flex; gap: 15pt; }
    .jk3-exp-date { width: 85pt; font-size: 9.5pt; font-weight: 900; flex-shrink: 0; padding-top: 2pt; }
    .jk3-exp-content { flex: 1; min-width: 0; }
    .jk3-exp-role { font-size: 12pt; font-weight: 900; color: #1a202c; margin-bottom: 2pt; text-transform: uppercase; }
    .jk3-exp-company { font-size: 10.5pt; font-weight: 700; color: #718096; margin-bottom: 6pt; font-style: italic; }
    .jk3-exp-desc { margin: 0; padding-left: 15pt; list-style-type: disc; }
    .jk3-exp-desc li { font-size: 9.5pt; color: #4a5568; margin-bottom: 5pt; line-height: 1.5; }
    .jk3-edu-list { display: flex; flex-direction: column; gap: 10pt; }
    .jk3-edu-item { margin-bottom: 5pt; }
    .jk3-edu-year { font-size: 8.5pt; font-weight: 800; color: rgba(255,255,255,0.7); margin-bottom: 2pt; }
    .jk3-edu-degree { font-size: 9.5pt; font-weight: 800; color: #fff; margin-bottom: 1pt; line-height: 1.3; word-break: break-word; }
    .jk3-edu-school { font-size: 8.5pt; font-weight: 500; color: rgba(255,255,255,0.9); word-break: break-word; }

    /* Jocker-4: Design Studio (50/50 Split) */
    .jk4-layout { display: flex; height: 100%; font-family: 'Inter', sans-serif; background: #fff; color: #333; box-sizing: border-box; word-wrap: break-word; overflow-wrap: break-word; word-break: break-word; }
    
    .jk4-left { width: 35%; padding: 45pt 30pt; background: #f8fafc; border-right: 1pt solid #e2e8f0; display: flex; flex-direction: column; gap: 25pt; min-width: 0; }
    .jk4-name-box { margin-bottom: 5pt; }
    .jk4-name { font-size: 32pt; font-weight: 900; letter-spacing: -1pt; line-height: 1.1; margin-bottom: 8pt; color: #0f172a; text-transform: uppercase; }
    .jk4-job { font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 2pt; }
    
    .jk4-photo { width: 110pt; height: 110pt; object-fit: cover; border-radius: 12pt; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); margin-bottom: 5pt; }
    
    .jk4-contact-box { display: flex; flex-direction: column; gap: 6pt; font-size: 9.5pt; color: #475569; font-weight: 500; padding-bottom: 25pt; border-bottom: 2pt solid #e2e8f0; }
    .jk4-contact-item { word-break: break-all; display: flex; align-items: center; gap: 8pt; }
    .jk4-contact-item svg { width: 11pt; height: 11pt; color: #64748b; flex-shrink: 0; }
    .jk4-contact-item span { flex: 1; min-width: 0; }
    
    .jk4-side-section { display: flex; flex-direction: column; gap: 12pt; }
    .jk4-edu-list { display: flex; flex-direction: column; gap: 12pt; }
    .jk4-edu-item { display: flex; flex-direction: column; gap: 2pt; }
    .jk4-edu-degree { font-size: 10pt; font-weight: 800; color: #0f172a; line-height: 1.3; }
    .jk4-edu-school { font-size: 9.5pt; font-weight: 600; color: #475569; line-height: 1.3; }
    .jk4-edu-year { font-size: 9pt; font-weight: 700; color: #94a3b8; }
    
    .jk4-side-section { display: flex; flex-direction: column; gap: 12pt; }
    .jk4-skills-flex { display: flex; flex-wrap: wrap; gap: 8pt; }
    .jk4-skill-pill { font-size: 9pt; font-weight: 600; color: #0f172a; background: #fff; border: 1pt solid #cbd5e1; padding: 5pt 12pt; border-radius: 20pt; word-break: normal; }
    .jk4-lang-pill { background: #e2e8f0; border: none; }
    
    .jk4-right { width: 65%; padding: 45pt 35pt; min-width: 0; display: flex; flex-direction: column; gap: 30pt; }
    .jk4-section { display: flex; flex-direction: column; gap: 15pt; }
    .jk4-s-title { font-size: 15pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5pt; margin-bottom: 5pt; display: inline-block; }
    
    .jk4-text { font-size: 10.5pt; line-height: 1.7; color: #475569; text-align: justify; }
    
    .jk4-item { margin-bottom: 20pt; position: relative; }
    .jk4-item:last-child { margin-bottom: 0; }
    .jk4-item-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 4pt; }
    .jk4-item-role { font-size: 12.5pt; font-weight: 800; color: #0f172a; }
    .jk4-item-date { font-size: 9.5pt; font-weight: 700; color: #64748b; flex-shrink: 0; margin-left: 10pt; }
    .jk4-item-company { font-size: 10.5pt; font-weight: 600; color: #475569; margin-bottom: 8pt; text-transform: uppercase; letter-spacing: 0.5pt; }
    
    .jk4-desc-list { margin: 0; padding-left: 14pt; list-style-type: square; }
    .jk4-desc-list li { font-size: 10.5pt; line-height: 1.6; color: #475569; margin-bottom: 4pt; }

    /* Jocker-5: Bento Box Creative */
    .jk5-layout { background: #f1f5f9; padding: 25pt; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; gap: 15pt; font-family: 'Inter', sans-serif; color: #1e293b; }
    .jk5-bento-card { background: #fff; border-radius: 12pt; padding: 22pt; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05); }
    
    .jk5-bento-row { display: flex; gap: 15pt; }
    .jk5-card-profile { flex: 2; display: flex; align-items: center; justify-content: space-between; gap: 20pt; }
    .jk5-card-contact { flex: 1; display: flex; align-items: center; justify-content: center; }
    
    .jk5-profile-text { flex: 1; min-width: 0; }
    .jk5-name { font-size: 32pt; font-weight: 900; letter-spacing: -1pt; line-height: 1.1; margin-bottom: 6pt; color: #0f172a; }
    .jk5-title { font-size: 13pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5pt; }
    .jk5-photo { width: 85pt; height: 85pt; object-fit: cover; border-radius: 20pt; flex-shrink: 0; }
    
    .jk5-contact-list { display: flex; flex-direction: column; gap: 8pt; width: 100%; }
    .jk5-contact-item { display: flex; align-items: center; gap: 8pt; font-size: 9pt; font-weight: 600; color: #475569; }
    .jk5-contact-item svg { width: 12pt; height: 12pt; color: #94a3b8; flex-shrink: 0; }
    .jk5-contact-item span { flex: 1; min-width: 0; word-break: break-all; }
    
    .jk5-bento-cols { display: flex; gap: 15pt; flex: 1; }
    .jk5-bento-col-main { flex: 2; display: flex; flex-direction: column; gap: 15pt; }
    .jk5-bento-col-side { flex: 1; display: flex; flex-direction: column; gap: 15pt; }
    
    .jk5-s-title { font-size: 13pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5pt; margin-bottom: 12pt; display: inline-block; }
    
    .jk5-text { font-size: 10.5pt; line-height: 1.7; color: #475569; text-align: justify; }
    
    .jk5-exp-list { display: flex; flex-direction: column; gap: 20pt; }
    .jk5-exp-item { display: flex; flex-direction: column; }
    .jk5-exp-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3pt; }
    .jk5-exp-role { font-size: 12.5pt; font-weight: 800; color: #0f172a; }
    .jk5-exp-date { font-size: 9.5pt; font-weight: 700; color: #64748b; flex-shrink: 0; margin-left: 10pt; }
    .jk5-exp-company { font-size: 10.5pt; font-weight: 700; color: #475569; margin-bottom: 8pt; text-transform: uppercase; letter-spacing: 0.5pt; }
    .jk5-desc { margin: 0; padding-left: 14pt; list-style-type: square; }
    .jk5-desc li { font-size: 10.5pt; line-height: 1.6; color: #475569; margin-bottom: 4pt; }
    
    .jk5-skills-flex { display: flex; flex-wrap: wrap; gap: 8pt; }
    .jk5-skill-pill { font-size: 9.5pt; font-weight: 600; color: #0f172a; background: #f1f5f9; padding: 6pt 12pt; border-radius: 8pt; }
    .jk5-lang-pill { background: #e2e8f0; }
    
    .jk5-edu-list { display: flex; flex-direction: column; gap: 12pt; }
    .jk5-edu-item { display: flex; flex-direction: column; gap: 2pt; }
    .jk5-edu-degree { font-size: 10.5pt; font-weight: 800; color: #0f172a; line-height: 1.3; }
    .jk5-edu-school { font-size: 9.5pt; font-weight: 600; color: #475569; line-height: 1.3; margin-top: 2pt; }
    .jk5-edu-year { font-size: 9pt; font-weight: 700; color: #94a3b8; }

    /* Fresher-1: BLOOM - Modern Indigo Gradient for Fresh Graduates */
    .fr1-layout { display: flex; flex-direction: column; background: #fff; height: 100%; font-family: 'Inter', sans-serif; }
    /* --- HEADER --- */
    .fr1-header { position: relative; overflow: hidden; padding: 0; background: linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #7c3aed 100%); color: #fff; flex-shrink: 0; }
    .fr1-header-accent { position: absolute; bottom: -20pt; right: -20pt; width: 120pt; height: 120pt; background: rgba(255,255,255,0.07); border-radius: 50%; }
    .fr1-header-inner { position: relative; z-index: 1; display: flex; align-items: center; gap: 20pt; padding: 25pt 30pt; }
    .fr1-header-left { flex-shrink: 0; }
    .fr1-photo { width: 82pt; height: 82pt; border-radius: 50%; border: 3pt solid rgba(255,255,255,0.4); object-fit: cover; }
    .fr1-photo-placeholder { width: 82pt; height: 82pt; border-radius: 50%; background: rgba(255,255,255,0.15); }
    .fr1-header-info { flex: 1; min-width: 0; }
    .fr1-name { font-size: 26pt; font-weight: 900; letter-spacing: 0.3pt; margin-bottom: 3pt; line-height: 1.1; }
    .fr1-title { font-size: 12pt; font-weight: 500; opacity: 0.85; margin-bottom: 10pt; letter-spacing: 0.3pt; }
    .fr1-contact-row { display: flex; flex-wrap: wrap; gap: 6pt 14pt; font-size: 8.5pt; font-weight: 500; opacity: 0.9; }
    .fr1-c-item { display: inline-flex; align-items: center; gap: 4pt; }
    .fr1-c-item svg { width: 9pt; height: 9pt; vertical-align: text-bottom; flex-shrink: 0; }
    /* --- BODY --- */
    .fr1-body { display: flex; flex: 1; min-height: 0; }
    .fr1-main { flex: 1.65; padding: 24pt 28pt; overflow: hidden; }
    .fr1-section { margin-bottom: 20pt; }
    .fr1-heading { font-size: 9.5pt; font-weight: 800; color: #312e81; text-transform: uppercase; letter-spacing: 2pt; margin-bottom: 10pt; display: flex; align-items: center; gap: 7pt; }
    .fr1-h-bar { display: inline-block; width: 18pt; height: 3pt; background: linear-gradient(90deg, #4f46e5, #7c3aed); border-radius: 2pt; flex-shrink: 0; }
    .fr1-text { font-size: 9.5pt; line-height: 1.65; color: #374151; text-align: justify; }
    /* Education card */
    .fr1-edu-card { background: linear-gradient(135deg, #f0f0ff 0%, #eef2ff 100%); border-left: 3.5pt solid #4f46e5; border-radius: 0 8pt 8pt 0; padding: 11pt 14pt; margin-bottom: 10pt; }
    .fr1-edu-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8pt; margin-bottom: 3pt; }
    .fr1-edu-degree { font-size: 11pt; font-weight: 800; color: #1e1b4b; flex: 1; }
    .fr1-edu-cgpa-badge { font-size: 8pt; font-weight: 800; color: #4f46e5; background: rgba(79,70,229,0.12); padding: 2pt 7pt; border-radius: 10pt; white-space: nowrap; flex-shrink: 0; }
    .fr1-edu-school { font-size: 10pt; font-weight: 600; color: #4b5563; }
    .fr1-edu-meta { font-size: 8.5pt; color: #6b7280; margin-top: 4pt; display: flex; flex-wrap: wrap; gap: 6pt; align-items: center; }
    .fr1-edu-honors { font-style: italic; color: #6b7280; }
    .fr1-edu-coursework { font-size: 8.5pt; color: #6b7280; margin-top: 5pt; font-style: italic; line-height: 1.4; }
    /* Experience / Internship */
    .fr1-exp-item { margin-bottom: 14pt; padding-bottom: 14pt; border-bottom: 1pt solid #f3f4f6; }
    .fr1-exp-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .fr1-exp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3pt; gap: 8pt; }
    .fr1-exp-role { font-size: 10.5pt; font-weight: 800; color: #1f2937; }
    .fr1-intern-badge { font-size: 7.5pt; font-weight: 700; color: #7c3aed; background: rgba(124,58,237,0.1); padding: 1pt 6pt; border-radius: 8pt; margin-left: 6pt; vertical-align: middle; }
    .fr1-exp-date { font-size: 8.5pt; font-weight: 700; color: #6b7280; white-space: nowrap; flex-shrink: 0; }
    .fr1-exp-company { font-size: 9.5pt; font-weight: 600; color: #4f46e5; margin-bottom: 5pt; }
    .fr1-exp-desc { font-size: 9pt; line-height: 1.55; color: #4b5563; }
    /* Projects */
    .fr1-proj-item { margin-bottom: 12pt; padding-bottom: 12pt; border-bottom: 1pt solid #f3f4f6; }
    .fr1-proj-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .fr1-proj-name { font-size: 10.5pt; font-weight: 800; color: #1f2937; margin-bottom: 3pt; }
    .fr1-proj-desc { font-size: 9pt; line-height: 1.5; color: #4b5563; }
    .fr1-proj-link { font-size: 8.5pt; color: #4f46e5; margin-top: 3pt; display: flex; align-items: center; gap: 4pt; }
    /* Achievements */
    .fr1-achievement-item { font-size: 9.5pt; color: #374151; margin-bottom: 6pt; padding-left: 12pt; position: relative; line-height: 1.45; }
    .fr1-achievement-item::before { content: '▸'; position: absolute; left: 0; color: #4f46e5; font-size: 8pt; top: 1pt; }
    /* --- SIDEBAR --- */
    .fr1-sidebar { width: 155pt; flex-shrink: 0; background: #1e1b4b; color: #fff; padding: 22pt 18pt; }
    .fr1-s-section { margin-bottom: 20pt; }
    .fr1-s-heading { font-size: 8.5pt; font-weight: 800; color: #a5b4fc; text-transform: uppercase; letter-spacing: 2pt; margin-bottom: 10pt; padding-bottom: 5pt; border-bottom: 1pt solid rgba(165,180,252,0.25); }
    .fr1-skills-list { display: flex; flex-wrap: wrap; gap: 5pt; }
    .fr1-skill-tag { font-size: 8pt; font-weight: 600; color: #e0e7ff; background: rgba(255,255,255,0.1); border: 1pt solid rgba(165,180,252,0.3); padding: 3pt 8pt; border-radius: 8pt; }
    .fr1-tool-tag { color: #c7d2fe; background: rgba(99,102,241,0.2); border-color: rgba(99,102,241,0.4); }
    .fr1-lang-tag { color: #ddd6fe; background: rgba(124,58,237,0.2); border-color: rgba(124,58,237,0.4); }
    .fr1-cert-item { margin-bottom: 10pt; }
    .fr1-cert-title { font-size: 8.5pt; font-weight: 700; color: #e0e7ff; line-height: 1.3; }
    .fr1-cert-issuer { font-size: 7.5pt; color: #a5b4fc; margin-top: 2pt; }

    /* Fresher-2: SPARK - Black & White Sidebar */
    .fr2-layout { display: flex; background: #fff; height: 100%; font-family: 'Inter', sans-serif; }
    .fr2-sidebar { width: 190pt; background: #000; color: #fff; padding: 35pt 20pt; flex-shrink: 0; }
    .fr2-photo-box { width: 100pt; height: 100pt; border-radius: 50%; overflow: hidden; border: 3pt solid rgba(255,255,255,0.2); margin: 0 auto 25pt auto; }
    .fr2-photo { width: 100%; height: 100%; object-fit: cover; }
    .fr2-s-section { margin-bottom: 28pt; }
    .fr2-s-heading { font-size: 11pt; font-weight: 800; color: #ccc; text-transform: uppercase; letter-spacing: 1.5pt; margin-bottom: 12pt; padding-bottom: 4pt; border-bottom: 1.5pt solid rgba(255,255,255,0.15); }
    .fr2-s-item { font-size: 9pt; margin-bottom: 10pt; color: #ddd; display: flex; align-items: center; gap: 8pt; word-break: break-all; }
    .fr2-s-item svg { width: 10pt; height: 10pt; flex-shrink: 0; color: #fff; }
    .fr2-skills-list { display: flex; flex-wrap: wrap; gap: 5pt; }
    .fr2-skill-pill { font-size: 8.5pt; font-weight: 600; color: #fff; background: rgba(255,255,255,0.1); border: 1pt solid rgba(255,255,255,0.25); padding: 3pt 8pt; border-radius: 10pt; }
    .fr2-cert-item { margin-bottom: 8pt; }
    .fr2-cert-title { font-size: 9pt; font-weight: 700; color: #fff; }
    .fr2-cert-meta { font-size: 8pt; color: #aaa; margin-top: 2pt; }
    .fr2-lang-list { display: flex; flex-direction: column; gap: 4pt; }
    .fr2-lang-item { font-size: 9pt; color: #ddd; }
    .fr2-main { flex: 1; display: flex; flex-direction: column; }
    .fr2-header { padding: 30pt 30pt 20pt 30pt; }
    .fr2-name { font-size: 30pt; font-weight: 900; color: #000; margin-bottom: 4pt; }
    .fr2-title { font-size: 13pt; font-weight: 600; color: #666; margin-bottom: 10pt; }
    .fr2-summary { font-size: 9.5pt; line-height: 1.6; color: #444; text-align: justify; }
    .fr2-body { padding: 0 30pt 30pt 30pt; flex: 1; }
    .fr2-section { margin-bottom: 20pt; }
    .fr2-heading { font-size: 11pt; font-weight: 800; color: #000; text-transform: uppercase; letter-spacing: 1.5pt; margin-bottom: 12pt; border-bottom: 2pt solid #ccc; padding-bottom: 4pt; }
    .fr2-edu-item { margin-bottom: 12pt; }
    .fr2-edu-row { display: flex; justify-content: space-between; align-items: baseline; }
    .fr2-edu-degree { font-size: 11pt; font-weight: 800; color: #000; }
    .fr2-edu-year { font-size: 9pt; font-weight: 700; color: #555; }
    .fr2-edu-school { font-size: 10pt; font-weight: 600; color: #555; margin-top: 2pt; }
    .fr2-edu-cgpa { font-size: 9pt; font-weight: 700; color: #555; margin-top: 2pt; }
    .fr2-exp-item { margin-bottom: 16pt; }
    .fr2-exp-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3pt; }
    .fr2-exp-role { font-size: 11pt; font-weight: 800; color: #000; }
    .fr2-exp-date { font-size: 8.5pt; font-weight: 700; color: #555; background: #eee; padding: 1pt 8pt; border-radius: 4pt; }
    .fr2-exp-company { font-size: 9.5pt; font-weight: 600; color: #555; margin-bottom: 5pt; }
    .fr2-exp-desc { font-size: 9.5pt; line-height: 1.5; color: #333; }

    /* Fresher-3: RISE - Black & White Two Column */
    .fr3-layout { display: flex; flex-direction: column; background: #fff; height: 100%; font-family: 'Inter', sans-serif; }
    .fr3-top-bar { background: #000; color: #fff; padding: 30pt 35pt; text-align: center; }
    .fr3-name { font-size: 30pt; font-weight: 900; letter-spacing: 0.5pt; margin-bottom: 4pt; }
    .fr3-title { font-size: 13pt; font-weight: 600; opacity: 0.8; margin-bottom: 10pt; }
    .fr3-contact-line { font-size: 9.5pt; font-weight: 500; opacity: 0.8; }
    .fr3-contact-line svg { width: 10pt; height: 10pt; vertical-align: text-bottom; }
    .fr3-body { display: flex; flex: 1; }
    .fr3-left { flex: 1.6; padding: 30pt 35pt; }
    .fr3-right { flex: 1; background: #f5f5f5; padding: 30pt 25pt; }
    .fr3-section { margin-bottom: 22pt; }
    .fr3-heading { font-size: 11pt; font-weight: 800; color: #000; text-transform: uppercase; letter-spacing: 1.5pt; margin-bottom: 12pt; border-bottom: 2pt solid #ccc; padding-bottom: 4pt; }
    .fr3-text { font-size: 10pt; line-height: 1.6; color: #333; text-align: justify; }
    .fr3-edu-card { background: #f5f5f5; border-left: 3pt solid #000; padding: 12pt 15pt; margin-bottom: 12pt; border-radius: 0 8pt 8pt 0; }
    .fr3-edu-degree { font-size: 11pt; font-weight: 800; color: #000; }
    .fr3-edu-school { font-size: 10pt; font-weight: 600; color: #555; margin-top: 2pt; }
    .fr3-edu-cgpa { font-size: 9.5pt; font-weight: 700; color: #555; margin-top: 4pt; }
    .fr3-edu-honors { font-size: 9pt; color: #666; margin-top: 2pt; font-style: italic; }
    .fr3-proj-item { margin-bottom: 14pt; }
    .fr3-proj-name { font-size: 11pt; font-weight: 800; color: #000; }
    .fr3-proj-desc { font-size: 9.5pt; color: #444; margin-top: 4pt; line-height: 1.5; }
    .fr3-proj-link { font-size: 9pt; color: #555; margin-top: 2pt; font-weight: 600; }
    .fr3-exp-item { margin-bottom: 14pt; }
    .fr3-exp-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3pt; }
    .fr3-exp-role { font-size: 11pt; font-weight: 800; color: #000; }
    .fr3-exp-date { font-size: 8.5pt; font-weight: 700; color: #555; }
    .fr3-exp-company { font-size: 9.5pt; font-weight: 600; color: #555; margin-bottom: 4pt; }
    .fr3-exp-desc { font-size: 9.5pt; line-height: 1.5; color: #333; }
    .fr3-achievement { font-size: 9.5pt; color: #333; margin-bottom: 6pt; }
    .fr3-skills-list { display: flex; flex-wrap: wrap; gap: 6pt; }
    .fr3-skill-tag { font-size: 9pt; font-weight: 600; color: #000; background: #fff; border: 1pt solid #999; padding: 4pt 10pt; border-radius: 6pt; }
    .fr3-cert-item { margin-bottom: 10pt; }
    .fr3-cert-title { font-size: 9.5pt; font-weight: 700; color: #000; }
    .fr3-cert-meta { font-size: 8.5pt; color: #666; margin-top: 2pt; }
    .fr3-link-item { font-size: 9pt; color: #444; margin-bottom: 4pt; word-break: break-all; }

    /* Fresher-4: PRO - Black & White Professional */
    .fr4-layout { display: flex; background: #fff; height: 100%; font-family: 'Inter', sans-serif; }
    .fr4-sidebar { width: 200pt; background: #1a1a1a; color: #fff; padding: 35pt 25pt; flex-shrink: 0; }
    .fr4-photo-box { width: 100pt; height: 100pt; border-radius: 50%; overflow: hidden; border: 3pt solid #fff; margin: 0 auto 20pt auto; }
    .fr4-photo { width: 100%; height: 100%; object-fit: cover; }
    .fr4-name { font-size: 20pt; font-weight: 900; text-align: center; color: #fff; margin-bottom: 4pt; }
    .fr4-title { font-size: 10pt; font-weight: 600; text-align: center; color: #ccc; letter-spacing: 1pt; text-transform: uppercase; margin-bottom: 20pt; }
    .fr4-s-divider { height: 1pt; background: rgba(255,255,255,0.12); margin-bottom: 25pt; }
    .fr4-s-section { margin-bottom: 25pt; }
    .fr4-s-heading { font-size: 10pt; font-weight: 800; color: #fff; text-transform: uppercase; letter-spacing: 1.5pt; margin-bottom: 12pt; }
    .fr4-s-item { font-size: 9pt; color: #ccc; margin-bottom: 10pt; display: flex; align-items: center; gap: 8pt; word-break: break-all; }
    .fr4-s-item svg { width: 10pt; height: 10pt; flex-shrink: 0; color: #fff; }
    .fr4-skill-row { margin-bottom: 8pt; }
    .fr4-skill-name { font-size: 9pt; color: #ddd; display: flex; align-items: center; }
    .fr4-skill-name::before { content: ''; width: 4pt; height: 4pt; border-radius: 50%; background: #fff; margin-right: 8pt; flex-shrink: 0; }
    .fr4-lang-item { font-size: 9pt; color: #ccc; margin-bottom: 4pt; }
    .fr4-main { flex: 1; padding: 35pt; }
    .fr4-section { margin-bottom: 22pt; }
    .fr4-heading { font-size: 11pt; font-weight: 800; color: #000; text-transform: uppercase; letter-spacing: 1.5pt; margin-bottom: 12pt; border-bottom: 2pt solid #000; padding-bottom: 4pt; display: inline-block; }
    .fr4-text { font-size: 10pt; line-height: 1.6; color: #333; text-align: justify; }
    .fr4-edu-item { margin-bottom: 12pt; }
    .fr4-edu-header { display: flex; justify-content: space-between; align-items: baseline; }
    .fr4-edu-degree { font-size: 11pt; font-weight: 800; color: #000; }
    .fr4-edu-year { font-size: 9pt; font-weight: 700; color: #555; }
    .fr4-edu-school { font-size: 10pt; font-weight: 600; color: #555; margin-top: 2pt; }
    .fr4-edu-cgpa { font-size: 9pt; color: #666; margin-top: 2pt; }
    .fr4-exp-item { margin-bottom: 16pt; }
    .fr4-exp-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3pt; }
    .fr4-exp-role { font-size: 11pt; font-weight: 800; color: #000; }
    .fr4-exp-date { font-size: 9pt; font-weight: 700; color: #555; }
    .fr4-exp-company { font-size: 10pt; font-weight: 600; color: #555; margin-bottom: 5pt; }
    .fr4-exp-desc { font-size: 9.5pt; line-height: 1.5; color: #333; }
    .fr4-cert-item { margin-bottom: 8pt; display: flex; justify-content: space-between; align-items: baseline; }
    .fr4-cert-title { font-size: 10pt; font-weight: 700; color: #000; }
    .fr4-cert-meta { font-size: 9pt; color: #666; }

    /* Fresher-5: BUILD - Black & White Achievement */
    .fr5-layout { display: flex; flex-direction: column; background: #fff; height: 100%; font-family: 'Inter', sans-serif; }
    .fr5-hero { display: flex; align-items: center; justify-content: space-between; padding: 30pt 35pt; background: #000; color: #fff; gap: 20pt; }
    .fr5-hero-content { flex: 1; min-width: 0; }
    .fr5-name { font-size: 30pt; font-weight: 900; letter-spacing: 0.5pt; margin-bottom: 4pt; }
    .fr5-title { font-size: 13pt; font-weight: 600; opacity: 0.8; margin-bottom: 10pt; }
    .fr5-contact { display: flex; flex-wrap: wrap; gap: 15pt; font-size: 9pt; font-weight: 500; opacity: 0.8; }
    .fr5-contact svg { width: 10pt; height: 10pt; vertical-align: text-bottom; }
    .fr5-photo { width: 85pt; height: 85pt; border-radius: 50%; border: 3pt solid rgba(255,255,255,0.3); object-fit: cover; flex-shrink: 0; }
    .fr5-body { display: flex; flex: 1; }
    .fr5-col { flex: 1; padding: 30pt 25pt; }
    .fr5-col:first-child { border-right: 1pt solid #ddd; }
    .fr5-section { margin-bottom: 22pt; }
    .fr5-heading { font-size: 11pt; font-weight: 800; color: #000; text-transform: uppercase; letter-spacing: 1.5pt; margin-bottom: 12pt; border-bottom: 2pt solid #ddd; padding-bottom: 4pt; }
    .fr5-text { font-size: 10pt; line-height: 1.6; color: #333; text-align: justify; }
    .fr5-edu-item { margin-bottom: 14pt; }
    .fr5-edu-degree { font-size: 11pt; font-weight: 800; color: #000; }
    .fr5-edu-school { font-size: 10pt; font-weight: 600; color: #555; margin-top: 2pt; }
    .fr5-edu-meta { font-size: 9pt; color: #666; margin-top: 3pt; }
    .fr5-edu-honors { font-size: 9pt; color: #555; font-weight: 700; margin-top: 2pt; }
    .fr5-exp-item { margin-bottom: 14pt; }
    .fr5-exp-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 3pt; }
    .fr5-exp-role { font-size: 11pt; font-weight: 800; color: #000; }
    .fr5-exp-date { font-size: 8.5pt; font-weight: 700; color: #555; }
    .fr5-exp-company { font-size: 9.5pt; font-weight: 600; color: #555; margin-bottom: 4pt; }
    .fr5-exp-desc { font-size: 9.5pt; line-height: 1.5; color: #333; }
    .fr5-proj-item { margin-bottom: 12pt; }
    .fr5-proj-name { font-size: 10.5pt; font-weight: 800; color: #000; }
    .fr5-proj-desc { font-size: 9.5pt; color: #444; margin-top: 3pt; line-height: 1.5; }
    .fr5-skills-list { display: flex; flex-wrap: wrap; gap: 6pt; }
    .fr5-skill-tag { font-size: 9pt; font-weight: 600; color: #000; background: #f5f5f5; border: 1pt solid #999; padding: 4pt 10pt; border-radius: 6pt; }
    .fr5-achieve-item { font-size: 9.5pt; color: #333; margin-bottom: 6pt; }
    .fr5-cert-item { margin-bottom: 8pt; }
    .fr5-cert-title { font-size: 9.5pt; font-weight: 700; color: #000; }
    .fr5-cert-meta { font-size: 8.5pt; color: #666; margin-top: 2pt; }
    .fr5-link-item { font-size: 9pt; color: #444; margin-bottom: 4pt; word-break: break-all; }
  `;

  const printStyles = `
    ${styles}
    @page { size: 595pt 842pt; margin: 0; }
    html, body { width: 595pt; height: 842pt; margin: 0; padding: 0; overflow: hidden; }
    .page { width: 595pt; height: 842pt; margin: 0; padding: 0; }
  `;

  if (isPrint) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Montserrat:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>${printStyles}</style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
  }

  const previewStyles = `
    ${styles}
    html, body { 
      background: ${isThumbnail ? "transparent" : "#e2e8f0"}; 
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    #center-wrapper {
      width: 100vw;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    #resume-scaler { 
      position: absolute;
      top: 50%;
      left: 50%;
      transform-origin: center center; 
      width: 595pt; 
      height: 842pt;
      box-shadow: ${isThumbnail ? "none" : "0 30px 60px rgba(0,0,0,0.25)"}; 
      background: #fff;
      flex-shrink: 0;
    }
  `;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Montserrat:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>${previewStyles}</style>
</head>
<body>
  <div id="center-wrapper">
    <div id="resume-scaler">
      ${htmlContent}
    </div>
  </div>
  <script>
    (function() {
      var scaler = document.getElementById('resume-scaler');
      function doScale() {
        var winW = document.documentElement.clientWidth || window.innerWidth;
        var winH = document.documentElement.clientHeight || window.innerHeight;
        var contentW = 793.33; 
        var contentH = 1122.66;
        
        // Reduced margins so the preview takes up much more screen space
        var marginW = ${isThumbnail ? 0 : 20};
        var marginH = ${isThumbnail ? 0 : 20};
        var scaleW = (winW - marginW) / contentW;
        var scaleH = (winH - marginH) / contentH;
        var scale = Math.min(scaleW, scaleH);
        
        if (scale > 1) scale = 1;
        window.currentScale = scale;
        scaler.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
      }
      window.addEventListener('resize', doScale);
      doScale();
      setTimeout(doScale, 300);
      setTimeout(doScale, 1000);

      // Canva-Level Interactive Editing & Dragging handlers!
      if (!${isThumbnail}) {
        (function() {
          // 1. Automatically make all text elements editable and touch-interactive
          function makeEditable() {
            var selectors = [
              'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'span',
              '.exp-role', '.exp-company', '.exp-desc', '.exp-date',
              '.sidebar-name', '.sidebar-title', '.sidebar-desc',
              '.bw1-name', '.bw1-title', '.bw1-role',
              '.contact-item', '.contact-text',
              '.skill-tag', '.lang-item', '.tool-tag',
              '.bw1-skill-pill', '.bw2-skill-tag', '.bw3-skill-item', '.bw4-skill-tag',
              '.jk1-s-list li', '.jk2-list li', '.jk3-skill-pill', '.jk3-skill-item',
              '.skill-pill', '.skill-tag', '.tool-pill', '.tool-tag',
              '.identity', '.identity *', '.ats-layout *', '.linkedin-layout *', 
              '.e4-sidebar *', '.e6-sidebar *', '.e7-sidebar *', '.e8-sidebar *', 
              '.t1-sidebar *', '.t2-sidebar *', '.t3-sidebar *', '.t4-sidebar *'
            ];
            
            selectors.forEach(function(sel) {
              document.querySelectorAll(sel).forEach(function(el) {
                if (el.children.length > 0) return; // avoid outer wrappers
                
                el.setAttribute('contenteditable', 'true');
                el.setAttribute('spellcheck', 'false');
                el.style.outline = 'none';
                el.style.cursor = 'pointer';
                el.style.borderRadius = '4px';
                el.style.transition = 'box-shadow 0.15s ease';
                
                // Hover style
                el.addEventListener('mouseover', function(e) {
                  if (document.activeElement !== el) {
                    el.style.boxShadow = '0 0 0 2px rgba(236, 72, 153, 0.4)';
                  }
                });
                el.addEventListener('mouseout', function(e) {
                  if (document.activeElement !== el) {
                    el.style.boxShadow = 'none';
                  }
                });
                
                // Focus style only, no popup options toolbar
                el.addEventListener('focus', function() {
                  el.style.boxShadow = '0 0 0 2px #ec4899';
                });
                
                el.addEventListener('blur', function() {
                  el.style.boxShadow = 'none';
                  
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'update:field',
                      field: el.className || el.tagName.toLowerCase(),
                      value: el.innerHTML || el.innerText
                    }));
                  }
                });
              });
            });
          }
          
          var activeEl = null;
          // Bind focus/blur styles to dynamic clones
          function setupCloneEditable(clone) {
            clone.addEventListener('focus', function() {
              clone.style.boxShadow = '0 0 0 2px #ec4899';
              activeEl = clone;
            });
            clone.addEventListener('blur', function() {
              clone.style.boxShadow = 'none';
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'update:field',
                  field: clone.className || clone.tagName.toLowerCase(),
                  value: clone.innerHTML || clone.innerText
                }));
              }
            });
          }

          
          // 3. Make block layout items and selected text draggable (anywhere on the layout)
          var activeDragEl = null;
          var startX, startY;
          
          function initDraggable(el) {
            el.style.position = 'relative';
            el.style.cursor = 'grab';
            
            el.addEventListener('mousedown', function(e) {
              // Drag if holding Alt, or if we drag from the border, or if not focused/editing text
              var isEditing = e.target.getAttribute('contenteditable') === 'true' && document.activeElement === e.target;
              if (!isEditing && e.target.tagName !== 'INPUT' && !e.target.closest('#canva-bubble-toolbar')) {
                activeDragEl = el;
                startX = e.clientX - (el.dataset.x ? parseFloat(el.dataset.x) : 0);
                startY = e.clientY - (el.dataset.y ? parseFloat(el.dataset.y) : 0);
                el.style.cursor = 'grabbing';
                el.style.zIndex = '1000';
              }
            });

            // Mobile Touch Support
            el.addEventListener('touchstart', function(e) {
              var isEditing = e.target.getAttribute('contenteditable') === 'true' && document.activeElement === e.target;
              if (!isEditing && e.target.tagName !== 'INPUT' && !e.target.closest('#canva-bubble-toolbar')) {
                activeDragEl = el;
                var touch = e.touches[0];
                startX = touch.clientX - (el.dataset.x ? parseFloat(el.dataset.x) : 0);
                startY = touch.clientY - (el.dataset.y ? parseFloat(el.dataset.y) : 0);
                el.style.zIndex = '1000';
              }
            }, { passive: true });
          }

          document.querySelectorAll('.exp-item, .bw1-header, .sidebar-section, h1, h2, h3, h4, h5, h6, p, li, span').forEach(function(el) {
            if (el.children.length === 0 || el.classList.contains('exp-item') || el.classList.contains('sidebar-section')) {
              initDraggable(el);
            }
          });
          
          document.addEventListener('mousemove', function(e) {
            if (activeDragEl) {
              var dx = e.clientX - startX;
              var dy = e.clientY - startY;
              // Snap to 10px Grid placement
              dx = Math.round(dx / 10) * 10;
              dy = Math.round(dy / 10) * 10;
              activeDragEl.dataset.x = dx;
              activeDragEl.dataset.y = dy;
              activeDragEl.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
            }
          });

          document.addEventListener('touchmove', function(e) {
            if (activeDragEl) {
              var touch = e.touches[0];
              var dx = touch.clientX - startX;
              var dy = touch.clientY - startY;
              // Snap to 10px Grid placement
              dx = Math.round(dx / 10) * 10;
              dy = Math.round(dy / 10) * 10;
              activeDragEl.dataset.x = dx;
              activeDragEl.dataset.y = dy;
              activeDragEl.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
            }
          }, { passive: true });
          
          document.addEventListener('mouseup', function() {
            if (activeDragEl) {
              activeDragEl.style.cursor = 'grab';
              activeDragEl.style.zIndex = '';
              activeDragEl = null;
            }
          });

          document.addEventListener('touchend', function() {
            if (activeDragEl) {
              activeDragEl.style.zIndex = '';
              activeDragEl = null;
            }
          });
          
          // Initialize
          makeEditable();
        })();
      }
    })();
  </script>
</body>
</html>`;
};
