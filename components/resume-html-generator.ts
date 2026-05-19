/**
 * resume-html-generator.ts
 *
 * PRECISE RECREATION OF MODERN SIDEBAR TEMPLATE
 * 1. Strict A4 Standard (595pt x 842pt).
 * 2. Solid Sidebar Layout.
 */

export const generateResumeHtml = (
  data: any,
  templateId: string = "Modern",
  primaryColor: string = "#1e293b",
  fontFamily: string = "Inter",
  isPrint: boolean = false,
  isThumbnail: boolean = false,
): string => {
  const esc = (s: string) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const skills = (data.skills || "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);

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

  const languages = (data.languages || "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);

  const tools = (data.tools || "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);

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
                ${(data.languages || "")
                  .split(",")
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
                ${(data.interests || "")
                  .split(",")
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

        <div class="bw2-section">
          <div class="bw2-heading">DECLARATION</div>
          <div class="bw2-summary" style="font-style: italic; font-size: 9pt; opacity: 0.8;">
            I hereby declare that the information provided above is true to the best of my knowledge and I am responsible for its authenticity.
          </div>
        </div>
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
                <div class="bw3-split-left">
                  <div style="font-weight: 800; color: #1e293b; margin-bottom: 2pt;">Project</div>
                  <div>Link: ${esc(proj.link || "N/A")}</div>
                </div>
                <div class="bw3-split-right">
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
        <div class="bw4-header" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div class="bw4-name">${esc(data.name)}</div>
          <div class="bw4-contact-bar">
            ${esc(data.email)} | ${esc(data.phone)} | ${esc(data.location)}
          </div>
          ${data.website ? `<div class="bw4-website">${esc(data.website)}</div>` : ""}
        </div>

        <div class="bw4-divider"></div>

        <div class="bw4-container">
          <div class="bw4-left-col">
            <div class="bw4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="bw4-s-title">SUMMARY</div>
              <div class="bw4-summary-text">${esc(data.summary)}</div>
            </div>

            <div class="bw4-divider-short"></div>

            <div class="bw4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
              <div class="bw4-s-title">EXPERIENCE</div>
              <div class="bw4-timeline">
                ${(data.experience || [])
                  .map(
                    (exp: any) => `
                  <div class="bw4-exp-item">
                    <div class="bw4-exp-dot"></div>
                    <div class="bw4-exp-header">
                      <div class="bw4-exp-company">${esc(exp.company)}</div>
                      <div class="bw4-exp-date">${esc(exp.period)}</div>
                    </div>
                    <div class="bw4-exp-role">${esc(exp.role)}</div>
                    <ul class="bw4-exp-bullets">
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

            <div class="bw4-divider-short"></div>

            ${
              data.references && data.references.length > 0
                ? `
            <div class="bw4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="bw4-s-title">REFERENCES</div>
              <div class="bw4-refs-grid">
                ${data.references
                  .map(
                    (ref: any) => `
                  <div class="bw4-ref-item">
                    <div class="bw4-ref-name">${esc(ref.name)}</div>
                    <div class="bw4-ref-company">${esc(ref.company)}</div>
                    <div class="bw4-ref-contact">Phone: ${esc(ref.phone)}</div>
                    <div class="bw4-ref-contact">${esc(ref.email).includes("@") ? "Email: " : ""}${esc(ref.email)}</div>
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

          <div class="bw4-v-line"></div>

          <div class="bw4-right-col">
            <div class="bw4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="bw4-s-title">SKILLS</div>
              <ul class="bw4-skills-list">
                ${skills.map((s) => `<li>${esc(s)}</li>`).join("")}
              </ul>
            </div>

            <div class="bw4-divider-short"></div>

            <div class="bw4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
              <div class="bw4-s-title">EDUCATION</div>
              ${eduArray
                .map(
                  (edu) => `
                <div class="bw4-edu-item">
                  <div class="bw4-edu-year">${esc(edu.year)}</div>
                  <div class="bw4-edu-school">${esc(edu.school)}</div>
                  <div class="bw4-edu-degree">${esc(edu.degree)}</div>
                </div>
              `,
                )
                .join("")}
            </div>

            <div class="bw4-divider-short"></div>

            <div class="bw4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="bw4-s-title">LANGUAGE</div>
              ${languages
                .map(
                  (l) => `
                <div class="bw4-lang-item">
                  <div class="bw4-lang-name">${esc(l)}</div>
                  <div class="bw4-lang-bar"><div class="bw4-lang-fill" style="width: ${l.toLowerCase().includes("english") ? "90%" : "75%"}"></div></div>
                </div>
              `,
                )
                .join("")}
            </div>
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
                ${skills.map(s => `<li class="editable" data-field="skills">${esc(s)}</li>`).join('')}
              </ul>
            </div>

            <div class="jk2-s-section draggable-section" data-section="languages">
              <div class="jk2-s-header">LANGUAGES</div>
              <ul class="jk2-list">
                ${languages.map(l => `<li class="editable" data-field="languages">${esc(l)}</li>`).join('')}
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
            ${(data.experience || []).map((exp: any) => `
              <div class="jk2-exp-item">
                <div class="jk2-exp-role editable" data-field="exp-role" data-id="${exp.id}">${esc(exp.role)}</div>
                <div class="jk2-exp-company editable" data-field="exp-company" data-id="${exp.id}">${esc(exp.company)}</div>
                <div class="jk2-exp-date editable" data-field="exp-period" data-id="${exp.id}">${esc(exp.period)}</div>
                <div class="jk2-exp-desc editable" data-field="exp-description" data-id="${exp.id}">${esc(exp.description)}</div>
              </div>
            `).join('')}
          </div>

          <div class="jk2-section draggable-section" data-section="education">
            <div class="jk2-section-bar">EDUCATION</div>
            ${eduArray.map(edu => `
              <div class="jk2-exp-item">
                <div class="jk2-exp-role editable" data-field="edu-degree" data-id="${edu.id}">${esc(edu.degree)}</div>
                <div class="jk2-exp-company editable" data-field="edu-school" data-id="${edu.id}">${esc(edu.school)}</div>
                <div class="jk2-exp-date editable" data-field="edu-year" data-id="${edu.id}">${esc(edu.year)}</div>
              </div>
            `).join('')}
          </div>

          ${data.projects && data.projects.length > 0 ? `
          <div class="jk2-section draggable-section" data-section="projects">
            <div class="jk2-section-bar">PROJECTS</div>
            ${(data.projects || []).map((proj: any) => `
              <div class="jk2-exp-item">
                <div class="jk2-exp-role editable" data-field="proj-name" data-id="${proj.id}">${esc(proj.name)}</div>
                <div class="jk2-exp-desc editable" data-field="proj-description" data-id="${proj.id}">${esc(proj.description)}</div>
                ${proj.link ? `<div class="jk2-exp-desc editable" data-field="proj-link" data-id="${proj.id}" style="color: #a67c52; font-weight: 700; margin-top: 2pt;">${esc(proj.link)}</div>` : ""}
              </div>
            `).join('')}
          </div>
          ` : ""}
        </div>
      </div>
    `;
  } else if (templateId === "Jocker-3") {
    const nameParts = (data.name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    htmlContent = `
      <div class="page jk3-layout">
        <div class="jk3-sidebar">
          <div class="jk3-photo-box placeable" data-field="photo">
            ${data.photo ? `<img src="${data.photo}" class="jk3-photo">` : ""}
          </div>

          <div class="jk3-name-box">
            <div class="jk3-f-name editable placeable" data-field="name">${esc(firstName)}</div>
            <div class="jk3-l-name editable placeable" data-field="name">${esc(lastName)}</div>
            <div class="jk3-job editable placeable" data-field="title">${esc(data.title)}</div>
          </div>

          <div class="draggable-group">
            <div class="jk3-s-section draggable-section" data-section="contact">
              <div class="jk3-header-bar">
                <div class="jk3-header-icon">${svgContact}</div>
                <span>Contact</span>
              </div>
              <div class="jk3-c-list">
                <div class="jk3-c-item">
                  <div class="jk3-c-icon">${svgLocation}</div>
                  <span class="editable" data-field="location">${esc(data.location)}</span>
                </div>
                <div class="jk3-c-item">
                  <div class="jk3-c-icon">${svgPhone}</div>
                  <span class="editable" data-field="phone">${esc(data.phone)}</span>
                </div>
                <div class="jk3-c-item">
                  <div class="jk3-c-icon">${svgEmail}</div>
                  <span class="editable" data-field="email">${esc(data.email)}</span>
                </div>
              </div>
            </div>

            <div class="jk3-s-section draggable-section" data-section="skills">
              <div class="jk3-header-bar">
                <div class="jk3-header-icon">${svgSkills}</div>
                <span>Skills</span>
              </div>
              <div class="jk3-skills-list">
                ${skills.map(s => `
                  <div class="jk3-skill-item">
                    <div class="jk3-skill-name editable" data-field="skills">${esc(s)}</div>
                    <div class="jk3-skill-dots">
                      <div class="jk3-dot filled"></div>
                      <div class="jk3-dot filled"></div>
                      <div class="jk3-dot filled"></div>
                      <div class="jk3-dot filled"></div>
                      <div class="jk3-dot"></div>
                      <div class="jk3-dot"></div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <div class="jk3-main">
          <div class="jk3-m-section draggable-section" data-section="personal">
            <div class="jk3-header-bar">
              <div class="jk3-header-icon">${svgUser}</div>
              <span>About Me</span>
            </div>
            <div class="jk3-m-text editable" data-field="summary">${esc(data.summary)}</div>
          </div>

          <div class="jk3-m-section draggable-section" data-section="education">
            <div class="jk3-header-bar">
              <div class="jk3-header-icon">${svgGraduation}</div>
              <span>Education</span>
            </div>
            <div class="jk3-timeline">
              ${eduArray.map(edu => `
                <div class="jk3-timeline-item">
                  <div class="jk3-timeline-dot"></div>
                  <div class="jk3-exp-role editable" data-field="edu-degree" data-id="${edu.id}">${esc(edu.degree)}</div>
                  <div class="jk3-exp-date editable" data-field="edu-year" data-id="${edu.id}">${esc(edu.year)}</div>
                  <div class="jk3-exp-company editable" data-field="edu-school" data-id="${edu.id}">${esc(edu.school)}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="jk3-m-section draggable-section" data-section="experience">
            <div class="jk3-header-bar">
              <div class="jk3-header-icon">${svgBriefcase}</div>
              <span>Work Experience</span>
            </div>
            <div class="jk3-timeline">
              ${(data.experience || []).map((exp: any) => `
                <div class="jk3-timeline-item">
                  <div class="jk3-timeline-dot"></div>
                  <div class="jk3-exp-company editable" data-field="exp-company" data-id="${exp.id}">${esc(exp.company)}</div>
                  <div class="jk3-exp-date editable" data-field="exp-period" data-id="${exp.id}">${esc(exp.period)}</div>
                  <div class="jk3-exp-role editable" data-field="exp-role" data-id="${exp.id}">${esc(exp.role)}</div>
                  <div class="jk3-m-text editable" data-field="exp-description" data-id="${exp.id}">${esc(exp.description)}</div>
                </div>
              `).join('')}
            </div>
          </div>

          ${data.projects && data.projects.length > 0 ? `
          <div class="jk3-m-section draggable-section" data-section="projects">
            <div class="jk3-header-bar">
              <div class="jk3-header-icon">${svgBriefcase}</div>
              <span>Projects</span>
            </div>
            <div class="jk3-timeline">
              ${(data.projects || []).map((proj: any) => `
                <div class="jk3-timeline-item">
                  <div class="jk3-timeline-dot"></div>
                  <div class="jk3-exp-role editable" data-field="proj-name" data-id="${proj.id}">${esc(proj.name)}</div>
                  <div class="jk3-m-text editable" data-field="proj-description" data-id="${proj.id}">${esc(proj.description)}</div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ""}
        </div>
      </div>
    `;
  } else if (templateId === "Jocker-4") {
    // JOCKER-4: THE MINIMALIST TRICK (Typographic Focus)
    htmlContent = `
      <div class="page jk4-layout">
        <div class="jk4-header" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div class="jk4-name">${esc(data.name)}</div>
          <div class="jk4-job">${esc(data.title)}</div>
          <div class="jk4-contact">
            ${esc(data.location)} • ${esc(data.phone)} • ${esc(data.email)}
          </div>
        </div>

        <div class="jk4-content">
          <div class="jk4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="jk4-s-title">Summary</div>
            <div class="jk4-text">${esc(data.summary)}</div>
          </div>

          <div class="jk4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
            <div class="jk4-s-title">Experience</div>
            ${(data.experience || [])
              .map(
                (exp: any) => `
              <div class="jk4-item">
                <div class="jk4-item-role">${esc(exp.role)} <span style="font-weight: 400; color: #94a3b8; margin: 0 5pt;">/</span> ${esc(exp.company)}</div>
                <div class="jk4-item-date">${esc(exp.period)}</div>
                <div class="jk4-text" style="margin-top: 5pt;">${esc(exp.description)}</div>
              </div>
            `,
              )
              .join("")}
          </div>

          <div class="jk4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="jk4-s-title">Skills</div>
            <div class="jk4-skills">${skills.join(" • ")}</div>
          </div>

          <div class="jk4-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
            <div class="jk4-s-title">Education</div>
            ${eduArray
              .map(
                (edu) => `
              <div class="jk4-item">
                <div class="jk4-item-role">${esc(edu.degree)}</div>
                <div class="jk4-item-date">${esc(edu.school)} — ${esc(edu.year)}</div>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>
      </div>
    `;
  } else if (templateId === "Jocker-5") {
    // JOCKER-5: THE ROYAL FLUSH (Hero Bar, Timeline Stacked)
    htmlContent = `
      <div class="page jk5-layout">
        <div class="jk5-hero" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
          <div class="jk5-hero-left">
            <div class="jk5-name">${esc(data.name)}</div>
            <div class="jk5-title">${esc(data.title)}</div>
          </div>
          <div class="jk5-hero-right">
            <div>${svgEmail} ${esc(data.email)}</div>
            <div>${svgPhone} ${esc(data.phone)}</div>
            <div>${svgLocation} ${esc(data.location)}</div>
          </div>
        </div>

        <div class="jk5-main">
          <div class="jk5-left">
            <div class="jk5-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
              <div class="jk5-s-title">EXPERIENCE</div>
              ${(data.experience || [])
                .map(
                  (exp: any) => `
                <div class="jk5-exp-item">
                  <div class="jk5-exp-line"></div>
                  <div class="jk5-exp-dot"></div>
                  <div class="jk5-exp-date">${esc(exp.period)}</div>
                  <div class="jk5-exp-role">${esc(exp.role)}</div>
                  <div class="jk5-exp-company">${esc(exp.company)}</div>
                  <div class="jk5-exp-desc">${esc(exp.description)}</div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>

          <div class="jk5-right">
            <div class="jk5-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="jk5-s-title">PROFILE</div>
              <div class="jk5-text">${esc(data.summary)}</div>
            </div>

            <div class="jk5-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="jk5-s-title">SKILLS</div>
              <div class="jk5-skills-list">
                ${skills.map((s) => `<div>${esc(s)}</div>`).join("")}
              </div>
            </div>

            <div class="jk5-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
              <div class="jk5-s-title">EDUCATION</div>
              ${eduArray
                .map(
                  (edu) => `
                <div class="jk5-edu-item">
                  <div class="jk5-edu-year">${esc(edu.year)}</div>
                  <div class="jk5-edu-degree">${esc(edu.degree)}</div>
                  <div class="jk5-edu-school">${esc(edu.school)}</div>
                </div>
              `,
                )
                .join("")}
            </div>
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
            
            <div class="e7-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="e7-m-heading">LANGUAGES</div>
              <div class="e7-interests-list">
                ${languages.map((l) => `<div class="e7-interest-item">${esc(l)}</div>`).join("")}
              </div>
            </div>
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
            
            <div class="e8-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
               <div class="e8-s-heading-row">
                  <div class="e8-s-icon-node">${svgSkills}</div>
                  <div class="e8-s-heading">LANGUAGES</div>
               </div>
               <div class="e8-s-content">
                  ${languages.map((l) => `<div class="e8-s-item" style="margin-bottom: 6pt;"><div class="e8-s-dot"></div> ${esc(l)}</div>`).join("")}
               </div>
            </div>
            
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
                  ${data.links.map((l: any) => `<div class="e8-s-item" style="margin-bottom: 6pt;"><div class="e8-s-dot"></div> <strong style="color: #fff; margin-right: 4pt;">${esc(l.label)}:</strong> ${esc(l.url)}</div>`).join("")}
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
            
            <div class="e8-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
               <div class="e8-m-heading-row">
                  <div class="e8-m-icon-node">${svgSkills}</div>
                  <div class="e8-m-heading">SKILLS</div>
               </div>
               <div class="e8-m-content">
                  <div class="e8-skills-grid">
                     ${skills.map((s) => `<div class="e8-skill-item">${esc(s)}</div>`).join("")}
                  </div>
               </div>
            </div>
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
                <div class="t1-s-item"><strong class="t1-s-label">${esc(l.label)} :</strong><br/>${esc(l.url)}</div>
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
          <div class="t2-pill t2-pill-light"><span class="t2-icon">${svgLink}</span> ${esc(data.links?.[0]?.url || data.email)}</div>
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
              <div class="t3-s-value">${esc(data.links[0].url)}</div>
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
      margin-bottom: 12pt; 
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

    /* BlackWolf-4: MINIMALIST (From Image) */
    .bw4-layout { flex-direction: column; padding: 40pt; background: #fff; color: #1a202c; }
    .bw4-header { text-align: center; margin-bottom: 20pt; }
    .bw4-name { font-size: 42pt; font-weight: 900; color: #1a202c; letter-spacing: 2pt; text-transform: uppercase; margin-bottom: 10pt; }
    .bw4-contact-bar { font-size: 10pt; color: #4a5568; margin-bottom: 5pt; }
    .bw4-website { font-size: 10pt; color: #4a5568; }
    
    .bw4-divider { width: 100%; height: 1.5pt; background: #cbd5e0; margin-bottom: 25pt; }
    .bw4-divider-short { width: 100%; height: 1pt; background: #e2e8f0; margin: 20pt 0; }
    
    .bw4-container { display: flex; flex: 1; }
    .bw4-left-col { flex: 1.8; padding-right: 25pt; }
    .bw4-v-line { width: 1pt; background: #e2e8f0; align-self: stretch; }
    .bw4-right-col { flex: 1; padding-left: 25pt; }
    
    .bw4-section { margin-bottom: 20pt; }
    .bw4-s-title { font-size: 13pt; font-weight: 800; color: #1a202c; margin-bottom: 15pt; text-transform: uppercase; letter-spacing: 1pt; }
    
    .bw4-summary-text { font-size: 9.5pt; line-height: 1.6; color: #4a5568; text-align: justify; }
    
    .bw4-timeline { position: relative; padding-left: 10pt; border-left: 1pt solid #cbd5e0; margin-left: 5pt; }
    .bw4-exp-item { position: relative; margin-bottom: 25pt; padding-left: 15pt; }
    .bw4-exp-dot { position: absolute; left: -14pt; top: 4pt; width: 8pt; height: 8pt; border-radius: 50%; background: #1a202c; }
    .bw4-exp-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4pt; }
    .bw4-exp-company { font-size: 10.5pt; font-weight: 800; color: #1a202c; }
    .bw4-exp-date { font-size: 9.5pt; font-weight: 800; color: #1a202c; }
    .bw4-exp-role { font-size: 10pt; font-weight: 600; color: #4a5568; margin-bottom: 8pt; }
    .bw4-exp-bullets { margin: 0; padding-left: 15pt; list-style-type: disc; }
    .bw4-exp-bullets li { font-size: 9pt; color: #4a5568; margin-bottom: 5pt; line-height: 1.4; }
    
    .bw4-refs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20pt; }
    .bw4-ref-name { font-size: 10.5pt; font-weight: 800; color: #1a202c; margin-bottom: 4pt; }
    .bw4-ref-company { font-size: 9.5pt; font-weight: 600; color: #4a5568; margin-bottom: 4pt; }
    .bw4-ref-contact { font-size: 9pt; color: #4a5568; margin-bottom: 2pt; }
    
    .bw4-skills-list { list-style: none; padding: 0; margin: 0; }
    .bw4-skills-list li { font-size: 9.5pt; color: #4a5568; margin-bottom: 8pt; display: flex; align-items: flex-start; }
    .bw4-skills-list li::before { content: '•'; margin-right: 10pt; color: #1a202c; }
    
    .bw4-edu-item { margin-bottom: 18pt; }
    .bw4-edu-year { font-size: 10.5pt; font-weight: 800; color: #1a202c; margin-bottom: 4pt; }
    .bw4-edu-school { font-size: 10.5pt; font-weight: 800; color: #1a202c; margin-bottom: 2pt; }
    .bw4-edu-degree { font-size: 9.5pt; color: #4a5568; }
    
    .bw4-lang-item { margin-bottom: 15pt; }
    .bw4-lang-name { font-size: 10pt; font-weight: 600; color: #1a202c; margin-bottom: 6pt; }
    .bw4-lang-bar { height: 6pt; background: #e2e8f0; border-radius: 3pt; overflow: hidden; }
    .bw4-lang-fill { height: 100%; background: #1a202c; border-radius: 3pt; }

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
    }
    
    .bw1-header { 
      margin-bottom: 35pt; 
      border-bottom: 2pt solid #000;
      padding-bottom: 20pt;
    }
    .bw1-name-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12pt; }
    .bw1-name { font-size: 32pt; font-weight: 800; text-transform: uppercase; letter-spacing: -1pt; line-height: 1; }
    .bw1-title { font-size: 11pt; font-weight: 600; text-transform: uppercase; letter-spacing: 2pt; color: #666; }
    
    .bw1-contact-bar { display: flex; gap: 20pt; }
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
    .bw1-layout .exp-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4pt; }
    .bw1-layout .exp-role { font-size: 11pt; font-weight: 800; color: #000; }
    .bw1-layout .exp-date { font-size: 9pt; font-weight: 700; color: #666; }
    .bw1-layout .exp-company { font-size: 10pt; font-weight: 600; color: #444; margin-bottom: 8pt; font-style: italic; }
    .bw1-layout .exp-desc { font-size: 9.5pt; line-height: 1.6; color: #333; text-align: justify; }

    /* BlackWolf-2: Structured Timeline */
    .bw2-layout {
      padding: 35pt;
      font-family: 'Inter', sans-serif;
      color: #000;
      background: #fff;
    }
    .bw2-name {
      font-size: 26pt;
      font-weight: 800;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 2pt;
      margin-bottom: 8pt;
      font-family: serif;
    }
    .bw2-contact-bar {
      display: flex;
      justify-content: space-around;
      border-top: 1.5pt solid #000;
      border-bottom: 1.5pt solid #000;
      padding: 6pt 0;
      margin-bottom: 25pt;
      font-size: 8.5pt;
      font-weight: 600;
    }
    .bw2-content { display: flex; gap: 25pt; }
    .bw2-sidebar { flex: 1.2; }
    .bw2-main { flex: 2; }
    
    .bw2-section { margin-bottom: 20pt; }
    .bw2-heading {
      font-size: 11pt;
      font-weight: 900;
      display: flex;
      align-items: center;
      gap: 12pt;
      margin-bottom: 10pt;
      font-family: serif;
      letter-spacing: 0.5pt;
    }
    .bw2-icon-box {
      font-size: 18pt;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bw2-icon-box svg { width: 18pt; height: 18pt; }
    
    .bw2-timeline-box {
      position: relative;
      padding-left: 18pt;
      margin-left: 8pt;
    }
    .bw2-v-line {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 1pt;
      background: #888;
    }
    .bw2-v-line::before {
      content: '';
      position: absolute;
      left: -2.5pt;
      top: -12pt;
      width: 6pt;
      height: 6pt;
      background: #000;
      border-radius: 50%;
    }
    
    .bw2-comp-group { margin-bottom: 12pt; }
    .bw2-comp-title { font-size: 9pt; font-weight: 900; margin-bottom: 4pt; text-decoration: underline; }
    .bw2-comp-item { font-size: 8.5pt; color: #111; margin-bottom: 2pt; font-weight: 500; }
    
    .bw2-timeline-item { margin-bottom: 12pt; position: relative; }
    .bw2-item-title { font-size: 10pt; font-weight: 900; text-transform: uppercase; }
    .bw2-item-sub { font-size: 9pt; font-weight: 800; color: #222; margin-top: 2pt; }
    .bw2-item-date { font-size: 8pt; color: #444; font-style: italic; margin: 2pt 0; font-weight: 600; }
    .bw2-item-desc { font-size: 8.5pt; color: #333; line-height: 1.4; margin-top: 4pt; }
    
    .bw2-bullet-line { 
      font-size: 8.5pt; 
      color: #111; 
      margin-bottom: 4pt; 
      line-height: 1.4;
      display: flex;
      gap: 6pt;
    }
    
    .bw2-separator {
      border-bottom: 1pt dashed #bbb;
      margin: 15pt 0;
      width: 100%;
    }
    
    /* BlackWolf-1: Modern Sidebar (Balanced) */
    .bw1-layout { display: flex; font-family: 'Inter', sans-serif; background: #fff; color: #1e293b; height: 100%; }
    .bw1-sidebar { width: 1.8fr; background: #f8fafc; padding: 30pt 20pt; border-right: 1.5pt solid #cbd5e1; }
    .bw1-main { flex: 1.8; padding: 35pt 25pt; background: #fff; }

    /* BlackWolf-2: Stacked Professional (Clean Redesign) */
    .bw2-layout { 
      padding: 40pt; 
      font-family: 'Inter', sans-serif; 
      color: #0f172a; 
      background: #fff; 
      display: flex;
      flex-direction: column;
    }
    .bw2-header {
      text-align: center;
      margin-bottom: 30pt;
      padding-bottom: 20pt;
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

    .bw2-section { margin-bottom: 25pt; width: 100%; }
    .bw2-heading {
      font-size: 11pt;
      font-weight: 900;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 10pt;
      margin-bottom: 12pt;
      text-transform: uppercase;
      letter-spacing: 1pt;
    }
    .bw2-heading::after {
      content: '';
      flex: 1;
      height: 1pt;
      background: #e2e8f0;
    }
    
    .bw2-summary { font-size: 10pt; line-height: 1.6; color: #334155; }
    
    .bw2-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20pt;
    }
    
    .bw2-item { margin-bottom: 15pt; }
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

    .jk3-heading { font-size: 12pt; font-weight: 900; color: #fff; background: #1a202c; display: inline-block; padding: 4pt 12pt; transform: skewX(-15pt); margin-bottom: 15pt; }
    .jk3-summary { font-size: 10.5pt; line-height: 1.7; color: #334155; }
    .jk3-item { margin-bottom: 20pt; }
    .jk3-item-header { display: flex; justify-content: space-between; font-size: 11pt; font-weight: 800; }
    .jk3-item-role { color: #1a202c; }
    .jk3-item-date { color: #ec4899; }
    .jk3-item-company { font-size: 10pt; font-weight: 700; color: #64748b; margin-bottom: 8pt; }
    .jk3-item-desc { font-size: 10pt; line-height: 1.6; color: #475569; }
    .jk3-skills-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10pt; }
    .jk3-skill-item { font-size: 9.5pt; font-weight: 700; color: #1a202c; display: flex; align-items: center; gap: 8pt; }
    .jk3-skill-item span { width: 12pt; height: 3pt; background: #ec4899; }

    /* Jocker-4: Minimalist Trick */
    .jk4-layout { padding: 50pt; font-family: 'Inter', sans-serif; }
    .jk4-header { margin-bottom: 40pt; }
    .jk4-name { font-size: 32pt; font-weight: 800; letter-spacing: -1pt; color: #0f172a; }
    .jk4-job { font-size: 12pt; font-weight: 500; color: #ec4899; text-transform: uppercase; letter-spacing: 3pt; margin: 8pt 0; }
    .jk4-contact { font-size: 9pt; color: #94a3b8; font-weight: 500; }
    .jk4-content { border-top: 1pt solid #f1f5f9; padding-top: 30pt; }
    .jk4-section { display: grid; grid-template-columns: 120pt 1fr; gap: 30pt; margin-bottom: 35pt; }
    .jk4-s-title { font-size: 9pt; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 1pt; }
    .jk4-text { font-size: 10pt; line-height: 1.7; color: #334155; }
    .jk4-item { margin-bottom: 20pt; }
    .jk4-item-role { font-size: 11pt; font-weight: 700; color: #0f172a; }
    .jk4-item-date { font-size: 8.5pt; font-weight: 600; color: #ec4899; margin-top: 2pt; }
    .jk4-skills { font-size: 10pt; font-weight: 600; color: #334155; line-height: 2; }

    /* Jocker-5: Royal Flush */
    .jk5-layout { display: flex; flex-direction: column; background: #fff; }
    .jk5-hero { background: #ec4899; color: #fff; padding: 40pt; display: flex; justify-content: space-between; align-items: center; }
    .jk5-name { font-size: 28pt; font-weight: 900; text-transform: uppercase; }
    .jk5-title { font-size: 12pt; font-weight: 600; opacity: 0.9; letter-spacing: 2pt; }
    .jk5-hero-right { text-align: right; font-size: 9pt; font-weight: 600; display: flex; flex-direction: column; gap: 4pt; }
    .jk5-hero-right svg { width: 10pt; height: 10pt; margin-right: 4pt; }
    .jk5-main { display: flex; flex: 1; }
    .jk5-left { flex: 2; padding: 30pt 40pt; border-right: 1pt solid #f1f5f9; }
    .jk5-right { flex: 1; padding: 30pt 25pt; background: #fafafa; }
    .jk5-section { margin-bottom: 30pt; }
    .jk5-s-title { font-size: 10pt; font-weight: 900; color: #ec4899; margin-bottom: 15pt; letter-spacing: 1.5pt; }
    .jk5-exp-item { position: relative; padding-left: 20pt; margin-bottom: 25pt; }
    .jk5-exp-line { position: absolute; left: 0; top: 5pt; bottom: -25pt; width: 1pt; background: #e2e8f0; }
    .jk5-exp-dot { position: absolute; left: -3.5pt; top: 5pt; width: 8pt; height: 8pt; border-radius: 50%; background: #fff; border: 2pt solid #ec4899; z-index: 2; }
    .jk5-exp-date { font-size: 8.5pt; font-weight: 800; color: #ec4899; margin-bottom: 4pt; }
    .jk5-exp-role { font-size: 11pt; font-weight: 800; color: #1a202c; }
    .jk5-exp-company { font-size: 9.5pt; font-weight: 600; color: #64748b; margin-bottom: 6pt; }
    .jk5-exp-desc { font-size: 9pt; line-height: 1.6; color: #4a5568; }
    .jk5-text { font-size: 9.5pt; line-height: 1.6; color: #4a5568; text-align: justify; }
    .jk5-skills-list { display: grid; grid-template-columns: 1fr 1fr; gap: 8pt; }
    .jk5-skills-list div { font-size: 9pt; font-weight: 700; color: #1a202c; display: flex; align-items: center; gap: 6pt; }
    .jk5-skills-list div::before { content: '♠'; color: #ec4899; }
    .jk5-edu-item { margin-bottom: 15pt; }
    .jk5-edu-year { font-size: 8.5pt; font-weight: 800; color: #ec4899; }
    .jk5-edu-degree { font-size: 10pt; font-weight: 800; color: #1a202c; margin: 2pt 0; }
    .jk5-edu-school { font-size: 9pt; color: #64748b; font-weight: 600; }
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
              '.skill-tag', '.lang-item', '.tool-tag'
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
                
                // Focus & Toolbar
                el.addEventListener('focus', function() {
                  el.style.boxShadow = '0 0 0 2px #ec4899';
                  showToolbar(el);
                });
                
                el.addEventListener('blur', function() {
                  el.style.boxShadow = 'none';
                  setTimeout(hideToolbar, 200); // delay to allow toolbar clicks
                  
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
          
          // 2. Create Floating Toolbar
          var toolbar = document.createElement('div');
          toolbar.id = 'canva-bubble-toolbar';
          toolbar.style.cssText = 'position: fixed; display: none; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; padding: 6px 12px; flex-direction: row; align-items: center; gap: 8px; z-index: 100000; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); pointer-events: auto;';
          
          toolbar.innerHTML = '<button id="tb-bold" style="background: none; border: none; color: #fff; font-weight: bold; cursor: pointer; padding: 4px 8px; font-size: 14px;">B</button>' +
                              '<button id="tb-italic" style="background: none; border: none; color: #fff; font-style: italic; cursor: pointer; padding: 4px 8px; font-size: 14px;">I</button>' +
                              '<div style="width: 1px; height: 16px; background: rgba(255,255,255,0.2);"></div>' +
                              '<button id="tb-size-minus" style="background: none; border: none; color: #fff; cursor: pointer; padding: 4px 6px; font-size: 14px;">A-</button>' +
                              '<button id="tb-size-plus" style="background: none; border: none; color: #fff; cursor: pointer; padding: 4px 6px; font-size: 14px;">A+</button>' +
                              '<div style="width: 1px; height: 16px; background: rgba(255,255,255,0.2);"></div>' +
                              '<div style="display: flex; gap: 6px; align-items: center;">' +
                                '<div class="tb-color" data-color="#1e293b" style="width: 14px; height: 14px; border-radius: 7px; background: #1e293b; border: 1px solid rgba(255,255,255,0.5); cursor: pointer;"></div>' +
                                '<div class="tb-color" data-color="#3b82f6" style="width: 14px; height: 14px; border-radius: 7px; background: #3b82f6; cursor: pointer;"></div>' +
                                '<div class="tb-color" data-color="#10b981" style="width: 14px; height: 14px; border-radius: 7px; background: #10b981; cursor: pointer;"></div>' +
                                '<div class="tb-color" data-color="#ec4899" style="width: 14px; height: 14px; border-radius: 7px; background: #ec4899; cursor: pointer;"></div>' +
                              '</div>';
          
          document.body.appendChild(toolbar);
          var activeEl = null;
          
          function showToolbar(el) {
            activeEl = el;
            var rect = el.getBoundingClientRect();
            toolbar.style.display = 'flex';
            
            var top = rect.top - 45;
            var left = rect.left + (rect.width / 2) - (toolbar.offsetWidth / 2);
            
            if (top < 10) top = rect.bottom + 10;
            if (left < 10) left = 10;
            
            toolbar.style.top = top + 'px';
            toolbar.style.left = left + 'px';
          }
          
          function hideToolbar() {
            if (document.activeElement !== activeEl) {
              toolbar.style.display = 'none';
            }
          }
          
          // Toolbar Event Listeners
          document.getElementById('tb-bold').addEventListener('mousedown', function(e) {
            e.preventDefault();
            document.execCommand('bold', false, null);
          });
          
          document.getElementById('tb-italic').addEventListener('mousedown', function(e) {
            e.preventDefault();
            document.execCommand('italic', false, null);
          });
          
          document.getElementById('tb-size-plus').addEventListener('mousedown', function(e) {
            e.preventDefault();
            if (activeEl) {
              var curSize = window.getComputedStyle(activeEl).fontSize;
              var newSize = parseFloat(curSize) + 1;
              activeEl.style.fontSize = newSize + 'px';
            }
          });
          
          document.getElementById('tb-size-minus').addEventListener('mousedown', function(e) {
            e.preventDefault();
            if (activeEl) {
              var curSize = window.getComputedStyle(activeEl).fontSize;
              var newSize = parseFloat(curSize) - 1;
              if (newSize > 6) activeEl.style.fontSize = newSize + 'px';
            }
          });
          
          toolbar.querySelectorAll('.tb-color').forEach(function(btn) {
            btn.addEventListener('mousedown', function(e) {
              e.preventDefault();
              var color = btn.getAttribute('data-color');
              if (activeEl) {
                activeEl.style.color = color;
              }
            });
          });
          
          // 3. Make block layout items draggable (Experiences / Projects / Skills wrapper)
          var activeDragEl = null;
          var startX, startY;
          
          document.querySelectorAll('.exp-item, .bw1-header, .sidebar-section').forEach(function(el) {
            el.style.position = 'relative';
            el.style.cursor = 'grab';
            
            el.addEventListener('mousedown', function(e) {
              if (e.target.tagName !== 'INPUT' && e.target.getAttribute('contenteditable') !== 'true' && !e.target.closest('#canva-bubble-toolbar')) {
                activeDragEl = el;
                startX = e.clientX - (el.dataset.x ? parseFloat(el.dataset.x) : 0);
                startY = e.clientY - (el.dataset.y ? parseFloat(el.dataset.y) : 0);
                el.style.cursor = 'grabbing';
                el.style.zIndex = '1000';
              }
            });
          });
          
          document.addEventListener('mousemove', function(e) {
            if (activeDragEl) {
              var dx = e.clientX - startX;
              var dy = e.clientY - startY;
              activeDragEl.dataset.x = dx;
              activeDragEl.dataset.y = dy;
              activeDragEl.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
            }
          });
          
          document.addEventListener('mouseup', function() {
            if (activeDragEl) {
              activeDragEl.style.cursor = 'grab';
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
