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
    
  const svgUser = `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
  const svgBriefcase = `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>`;
  const svgEdu = `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2.12-1.15V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9z"/></svg>`;
  const svgSkills = `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2 0v8h8c-.5-4.25-3.75-7.5-8-8zm0 10v10c4.25-.5 7.5-3.75 8-8h-8z"/></svg>`;

  const svgPhone = `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>`;
  const svgEmail = `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`;
  const svgLocation = `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
  const svgLink = `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>`;
  const svgAward = `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M12 2C9.24 2 7 4.24 7 7c0 1.94 1.11 3.61 2.72 4.41L7 22l5-2 5 2-2.72-10.59C18.89 10.61 20 8.94 20 7c0-2.76-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z"/></svg>`;
  const svgTool = `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.5 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>`;

  const languages = (data.languages || "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);

  const tools = (data.tools || "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);

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

  const projectItems = (data.projects || []).map((proj: any) => `
    <div class="exp-item">
      <div class="exp-row">
        <div class="exp-role">${esc(proj.name)}</div>
      </div>
      <div class="exp-desc">${esc(proj.description)}</div>
    </div>
  `).join("");

  // Template-specific Layout Logic
  let htmlContent = "";

  if (templateId === "Elder-2" || templateId === "ats") {
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
            <div class="skills-grid-ats">${skills.map(s => `<div class="skill-tag-ats">${esc(s)}</div>`).join("")}</div>
          </div>

          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
            <div class="m-heading">PROFESSIONAL EXPERIENCE</div>
            ${expItems}
          </div>

          ${projectItems ? `
          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
            <div class="m-heading">KEY PROJECTS</div>
            ${projectItems}
          </div>
          ` : ""}

          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
            <div class="m-heading">EDUCATION</div>
            <div class="edu-item">
              <div class="exp-row">
                <div class="exp-role">${esc(data.education.degree)}</div>
                <div class="exp-date">${esc(data.education.year)}</div>
              </div>
              <div class="exp-company">${esc(data.education.school)}</div>
            </div>
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
          ${projectItems ? `
          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
            <div class="m-heading-li">PROJECTS</div>
            ${projectItems}
          </div>
          ` : ""}
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
              ${skills.map(s => `<li>${esc(s)}</li>`).join("")}
            </ul>
          </div>
          
          <div class="e4-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="e4-s-heading">LANGUAGES</div>
            <ul class="e4-s-list">
              ${languages.map(l => `<li>${esc(l)}</li>`).join("")}
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
            
            ${projectItems ? `
            <div class="e4-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
              <div class="e4-m-heading">PROJECTS</div>
              <div class="e4-timeline">
                ${projectItems}
              </div>
            </div>
            ` : ""}
            
            <div class="e4-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
              <div class="e4-m-heading">EDUCATION</div>
              <div class="e4-timeline">
                <div class="exp-item e4-edu-item">
                  <div class="exp-role e4-edu-degree">${esc(data.education.degree)}</div>
                  <div class="exp-company e4-edu-school">${esc(data.education.school)}</div>
                  <div class="exp-date e4-edu-date">${esc(data.education.year)}</div>
                </div>
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
          ${projectItems ? `
          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
            <div class="m-heading">PROJECTS</div>
            ${projectItems}
          </div>
          ` : ""}
          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
            <div class="m-heading">EDUCATION</div>
            <div class="edu-item">
              <div class="edu-degree">${esc(data.education.degree)}</div>
              <div class="edu-date">${esc(data.education.year)}</div>
              <div class="edu-school">${esc(data.education.school)}</div>
            </div>
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
            <div class="e6-edu-item">
              <div class="e6-edu-degree">${esc(data.education.degree)}</div>
              <div class="e6-edu-school">${esc(data.education.school)}</div>
              <div class="e6-edu-date">${esc(data.education.year)}</div>
            </div>
          </div>
          
          <div class="e6-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="e6-ribbon-heading">Skills</div>
            <ul class="e6-s-list">
              ${skills.map(s => `<li>${esc(s)}</li>`).join("")}
            </ul>
          </div>
          
          <div class="e6-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="e6-ribbon-heading">Language</div>
            <ul class="e6-s-list">
              ${languages.map(l => `<li>${esc(l)}</li>`).join("")}
            </ul>
          </div>
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
          
          ${projectItems ? `
          <div class="e6-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
            <div class="e6-m-heading"><span>Projects</span></div>
            ${projectItems}
          </div>
          ` : ""}
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
              <div class="e7-edu-item">
                <div class="e7-edu-degree">${esc(data.education.degree)}</div>
                <div class="e7-edu-school">${esc(data.education.school)}</div>
                <div class="e7-edu-date">${esc(data.education.year)}</div>
              </div>
            </div>
          </div>
          
          <div class="e7-sidebar-bottom">
            <div class="e7-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="e7-s-heading e7-dark-text">EXPERTISE</div>
              <ul class="e7-skills-list">
                ${skills.map(s => `<li>${esc(s)}</li>`).join("")}
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
            
            ${projectItems ? `
            <div class="e7-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
              <div class="e7-m-heading">PROJECTS</div>
              ${projectItems}
            </div>
            ` : ""}
            
            <div class="e7-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="e7-m-heading">LANGUAGES</div>
              <div class="e7-interests-list">
                ${languages.map(l => `<div class="e7-interest-item">${esc(l)}</div>`).join("")}
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
                  <div class="e8-edu-item">
                    <div class="e8-s-dot"></div>
                    <div class="e8-edu-school">${esc(data.education.school)}</div>
                    <div class="e8-edu-degree">${esc(data.education.degree)}</div>
                    <div class="e8-edu-date">${esc(data.education.year)}</div>
                  </div>
               </div>
            </div>
            
            <div class="e8-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
               <div class="e8-s-heading-row">
                  <div class="e8-s-icon-node">${svgSkills}</div>
                  <div class="e8-s-heading">LANGUAGES</div>
               </div>
               <div class="e8-s-content">
                  ${languages.map(l => `<div class="e8-s-item" style="margin-bottom: 6pt;"><div class="e8-s-dot"></div> ${esc(l)}</div>`).join("")}
               </div>
            </div>
            
            ${tools && tools.length > 0 ? `
            <div class="e8-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
               <div class="e8-s-heading-row">
                  <div class="e8-s-icon-node">${svgTool}</div>
                  <div class="e8-s-heading">TOOLS</div>
               </div>
               <div class="e8-s-content">
                  ${tools.map((t: string) => `<div class="e8-s-item" style="margin-bottom: 6pt;"><div class="e8-s-dot"></div> ${esc(t)}</div>`).join("")}
               </div>
            </div>
            ` : ""}
            
            ${data.certifications && data.certifications.length > 0 ? `
            <div class="e8-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
               <div class="e8-s-heading-row">
                  <div class="e8-s-icon-node">${svgAward}</div>
                  <div class="e8-s-heading">CERTIFICATES</div>
               </div>
               <div class="e8-s-content">
                  ${data.certifications.map((c: any) => `<div class="e8-s-item" style="margin-bottom: 8pt; display: block;"><div class="e8-s-dot"></div> <div style="font-weight: 800; color: #fff; margin-bottom: 2pt;">${esc(c.title)}</div><div style="font-size: 8pt; color: #0ea5e9;">${esc(c.issuer)} - ${esc(c.year)}</div></div>`).join("")}
               </div>
            </div>
            ` : ""}
            
            ${data.links && data.links.length > 0 ? `
            <div class="e8-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
               <div class="e8-s-heading-row">
                  <div class="e8-s-icon-node">${svgLink}</div>
                  <div class="e8-s-heading">LINKS</div>
               </div>
               <div class="e8-s-content">
                  ${data.links.map((l: any) => `<div class="e8-s-item" style="margin-bottom: 6pt;"><div class="e8-s-dot"></div> <strong style="color: #fff; margin-right: 4pt;">${esc(l.label)}:</strong> ${esc(l.url)}</div>`).join("")}
               </div>
            </div>
            ` : ""}
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
            
            ${projectItems ? `
            <div class="e8-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
               <div class="e8-m-heading-row">
                  <div class="e8-m-icon-node">${svgBriefcase}</div>
                  <div class="e8-m-heading">PROJECTS</div>
               </div>
               <div class="e8-m-content">
                  ${projectItems}
               </div>
            </div>
            ` : ""}
            
            <div class="e8-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
               <div class="e8-m-heading-row">
                  <div class="e8-m-icon-node">${svgSkills}</div>
                  <div class="e8-m-heading">SKILLS</div>
               </div>
               <div class="e8-m-content">
                  <div class="e8-skills-grid">
                     ${skills.map(s => `<div class="e8-skill-item">${esc(s)}</div>`).join("")}
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
              <div class="t1-s-item">
                <strong class="t1-s-label">${esc(data.education.degree)}</strong><br/>
                ${esc(data.education.school)}<br/>
                From ${esc(data.education.year)}
              </div>
            </div>
            
            ${data.certifications && data.certifications.length > 0 ? `
            <div class="t1-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="t1-s-title">CERTIFICATES</div>
              ${data.certifications.map((c: any) => `
                <div class="t1-s-item">
                  <strong class="t1-s-label">${esc(c.title)}</strong><br/>
                  ${esc(c.issuer)}<br/>
                  ${esc(c.year)}
                </div>
              `).join("")}
            </div>
            ` : ""}
            
            ${tools && tools.length > 0 ? `
            <div class="t1-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="t1-s-title">TOOLS</div>
              ${tools.map((t: string) => `
                <div class="t1-s-item" style="margin-bottom: 4pt;">• ${esc(t)}</div>
              `).join("")}
            </div>
            ` : ""}
            
            ${data.links && data.links.length > 0 ? `
            <div class="t1-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="t1-s-title">LINKS</div>
              ${data.links.map((l: any) => `
                <div class="t1-s-item"><strong class="t1-s-label">${esc(l.label)} :</strong><br/>${esc(l.url)}</div>
              `).join("")}
            </div>
            ` : ""}
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
            
            ${projectItems ? `
            <div class="t1-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
              <div class="t1-m-title">PROJECTS</div>
              ${projectItems}
            </div>
            ` : ""}
            
            <div class="t1-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="t1-m-title">SKILLS</div>
              <div class="t1-skills-grid">
                ${skills.map(s => `<div class="t1-skill-item">${esc(s)}</div>`).join("")}
              </div>
            </div>
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
              <div class="t2-s-item">
                <div class="t2-s-subtitle">${esc(data.education.school)}</div>
                <div class="t2-s-date">${esc(data.education.year)}</div>
                <div class="t2-s-item-title">${esc(data.education.degree)}</div>
              </div>
            </div>
            
            ${data.certifications && data.certifications.length > 0 ? `
            <div class="t2-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
              <div class="t2-s-title-row">
                <div class="t2-s-icon">${svgAward}</div>
                <div class="t2-s-heading">CERTIFICATES</div>
              </div>
              ${data.certifications.map((c: any) => `
                <div class="t2-s-item">
                  <div class="t2-s-subtitle">${esc(c.issuer)}</div>
                  <div class="t2-s-date">${esc(c.year)}</div>
                  <div class="t2-s-item-title">${esc(c.title)}</div>
                </div>
              `).join("")}
            </div>
            ` : ""}
            
            <div class="t2-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="t2-s-title-row">
                <div class="t2-s-icon">${svgSkills}</div>
                <div class="t2-s-heading">LANGUAGES</div>
              </div>
              ${languages.map(l => `
                <div class="t2-lang-row">
                  <div class="t2-lang-name">${esc(l)}</div>
                  <div class="t2-lang-bar"><div class="t2-lang-fill"></div></div>
                </div>
              `).join("")}
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
            
            ${projectItems ? `
            <div class="t2-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
              <div class="t2-m-title-row">
                <div class="t2-m-icon">${svgBriefcase}</div>
                <div class="t2-m-heading">PROJECTS</div>
              </div>
              ${projectItems}
            </div>
            ` : ""}
            
            <div class="t2-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
              <div class="t2-m-title-row">
                <div class="t2-m-icon">${svgTool}</div>
                <div class="t2-m-heading">SKILLS</div>
              </div>
              <div class="t2-skills-grid">
                ${skills.map(s => `
                  <div class="t2-skill-row">
                    <div class="t2-skill-name">${esc(s)}</div>
                    <div class="t2-skill-bar"><div class="t2-skill-fill"></div></div>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    `;
  } else if (templateId === "Titan-3") {
    // TITAN-3: SPLIT (Orange Accent)
    const nameParts = (data.name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");
    
    htmlContent = `
      <div class="page t3-layout">
        <div class="t3-sidebar">
          <div class="t3-s-section" style="margin-bottom: 10pt;" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="t3-s-heading" style="color: #ea580c; font-size: 10pt; margin-bottom: 2pt;">Address</div>
            <div class="t3-s-text">${esc(data.location)}</div>
          </div>
          
          <div class="t3-photo-box" onclick="window.ReactNativeWebView.postMessage('edit:personal:photo')">
            ${data.photo ? `<img src="${data.photo}" class="t3-photo">` : ""}
          </div>
          
          <div class="t3-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="t3-s-title">CONTACT</div>
            <div class="t3-s-item">
              <div class="t3-s-label">Phone</div>
              <div class="t3-s-value">${esc(data.phone)}</div>
            </div>
            <div class="t3-s-item">
              <div class="t3-s-label">Email</div>
              <div class="t3-s-value">${esc(data.email)}</div>
            </div>
            ${data.links && data.links.length > 0 ? `
            <div class="t3-s-item">
              <div class="t3-s-label">${esc(data.links[0].label)}</div>
              <div class="t3-s-value">${esc(data.links[0].url)}</div>
            </div>
            ` : ""}
          </div>
          
          <div class="t3-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="t3-s-title">LANGUAGES</div>
            ${languages.map(l => `<div class="t3-s-value" style="margin-bottom: 4pt;">• ${esc(l)}</div>`).join("")}
          </div>
        </div>
        
        <div class="t3-main">
          <div class="t3-header" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="t3-name">${esc(firstName)}<br/>${esc(lastName)}</div>
            <div class="t3-jobtitle">${esc(data.title)}</div>
          </div>
          
          <div class="t3-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="t3-m-title">ABOUT ME</div>
            <div class="t3-m-text">${esc(data.summary)}</div>
          </div>
          
          <div class="t3-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
            <div class="t3-m-title">EDUCATION</div>
            <div class="t3-edu-grid">
              <div class="t3-edu-item">
                <div class="t3-edu-degree">${esc(data.education.degree)}</div>
                <div class="t3-edu-school">${esc(data.education.school)}</div>
                <div class="t3-edu-year">${esc(data.education.year)}</div>
              </div>
            </div>
          </div>
          
          <div class="t3-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:experience')">
            <div class="t3-m-title">EXPERIENCE</div>
            ${expItems}
          </div>
          
          <div class="t3-m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="t3-m-title">EXPERTISE</div>
            <div class="t3-skills-grid">
              ${skills.map(s => `<div class="t3-skill-item"><div class="t3-skill-dot"></div>${esc(s)}</div>`).join("")}
            </div>
          </div>
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
            ${skills.map(s => `
              <div class="t4-s-skill-row">
                <div class="t4-s-skill-name">${esc(s)}</div>
                <div class="t4-s-skill-bar"><div class="t4-s-skill-fill"></div></div>
              </div>
            `).join("")}
          </div>
          
          ${tools && tools.length > 0 ? `
          <div class="t4-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="t4-heading-wrapper">
              <div class="t4-heading-icon">${svgTool}</div>
              <div class="t4-heading-text">TOOLS</div>
            </div>
            ${tools.map(t => `
              <div class="t4-s-skill-row">
                <div class="t4-s-skill-name">${esc(t)}</div>
                <div class="t4-s-skill-bar"><div class="t4-s-skill-fill"></div></div>
              </div>
            `).join("")}
          </div>
          ` : ""}
          
          <div class="t4-s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="t4-heading-wrapper">
              <div class="t4-heading-icon">${svgAward}</div>
              <div class="t4-heading-text">LANGUAGES</div>
            </div>
            ${languages.map(l => `
              <div class="t4-s-lang-row">
                <div class="t4-s-lang-name">${esc(l)}</div>
              </div>
            `).join("")}
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
            <div class="t4-edu-item">
              <div class="t4-edu-left">
                <div class="t4-edu-school">${esc(data.education.school)}</div>
                <div class="t4-edu-year">${esc(data.education.year)}</div>
              </div>
              <div class="t4-edu-right">
                <div class="t4-edu-degree">${esc(data.education.degree)}</div>
                <div class="t4-edu-text">Focused on core principles of engineering and software development.</div>
              </div>
            </div>
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
          ${tools && tools.length > 0 ? `
          <div class="s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:skills')">
            <div class="s-heading">TOOLS</div>
            <div class="s-list">
              ${tools.map((t: string) => `<div class="s-list-item">• ${esc(t)}</div>`).join("")}
            </div>
          </div>
          ` : ""}
          ${data.certifications && data.certifications.length > 0 ? `
          <div class="s-section" onclick="window.ReactNativeWebView.postMessage('edit:section:personal')">
            <div class="s-heading">CERTIFICATES</div>
            <div class="s-list">
              ${data.certifications.map((c: any) => `
                <div class="s-list-item" style="margin-bottom: 8pt;">
                  <div style="font-weight: 700; color: #fff; margin-bottom: 2pt;">• ${esc(c.title)}</div>
                  <div style="font-size: 8.5pt; color: #94a3b8; padding-left: 10pt;">${esc(c.issuer)} - ${esc(c.year)}</div>
                </div>
              `).join("")}
            </div>
          </div>
          ` : ""}
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
          ${projectItems ? `
          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:projects')">
            <div class="m-heading">PROJECTS</div>
            ${projectItems}
          </div>
          ` : ""}
          <div class="m-section" onclick="window.ReactNativeWebView.postMessage('edit:section:education')">
            <div class="m-heading">EDUCATION</div>
            <div class="edu-item">
              <div class="edu-degree">${esc(data.education.degree)}</div>
              <div class="edu-date">${esc(data.education.year)}</div>
              <div class="edu-school">${esc(data.education.school)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; }
    body { font-family: 'Inter', sans-serif; }
    svg { vertical-align: text-bottom; }
    
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

    /* Elder-2: ATS MASTER */
    .ats-layout { display: block; padding: 40pt; }
    .full-width { width: 100% !important; padding: 0 !important; }
    .identity-ats { text-align: center; margin-bottom: 25pt; border-bottom: 2pt solid #000; padding-bottom: 15pt; }
    .name-ats { font-size: 24pt; font-weight: 900; margin-bottom: 5pt; text-transform: uppercase; }
    .title-ats { font-size: 12pt; font-weight: 700; color: #334155; margin-bottom: 10pt; }
    .contact-row-ats { font-size: 10pt; color: #475569; }
    .skills-grid-ats { display: flex; flex-wrap: wrap; gap: 8pt; margin-top: 10pt; }
    .skill-tag-ats { font-size: 9.5pt; font-weight: 600; background: #f1f5f9; padding: 4pt 10pt; border-radius: 4pt; border: 1pt solid #e2e8f0; }

    /* Elder-3: LINKEDIN SIGNATURE */
    .linkedin-layout { display: block; }
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

    /* Titan-3: ORANGE SPLIT */
    .t3-layout { display: flex; background: #fff; height: 100%; }
    .t3-sidebar { width: 190pt; background: #f3f4f6; padding: 30pt 20pt; flex-shrink: 0; }
    .t3-s-text { font-size: 9pt; color: #6b7280; line-height: 1.4; }
    
    .t3-photo-box { width: 100%; height: 160pt; border-top: 4pt solid #ea580c; border-bottom: 4pt solid #ea580c; margin: 15pt 0 25pt 0; background: #ddd; overflow: hidden; }
    .t3-photo { width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%); }
    
    .t3-s-section { margin-bottom: 25pt; }
    .t3-s-title { font-size: 13pt; font-weight: 800; color: #1f2937; letter-spacing: 1pt; margin-bottom: 15pt; }
    .t3-s-item { margin-bottom: 12pt; }
    .t3-s-label { font-size: 10pt; font-weight: 700; color: #1f2937; margin-bottom: 2pt; }
    .t3-s-value { font-size: 9pt; color: #6b7280; word-break: break-all; }
    
    .t3-main { flex: 1; padding: 35pt 30pt; }
    .t3-header { margin-bottom: 30pt; }
    .t3-name { font-size: 38pt; font-weight: 800; color: #1f2937; line-height: 1.1; letter-spacing: 2pt; text-transform: uppercase; margin-bottom: 10pt; }
    .t3-jobtitle { font-size: 12pt; font-weight: 600; color: #1f2937; letter-spacing: 3pt; text-transform: uppercase; position: relative; padding-bottom: 8pt; }
    .t3-jobtitle::after { content: ''; position: absolute; left: 0; bottom: 0; width: 30pt; height: 2pt; background: #ea580c; }
    
    .t3-m-section { margin-bottom: 25pt; }
    .t3-m-title { font-size: 13pt; font-weight: 800; color: #1f2937; letter-spacing: 1pt; margin-bottom: 15pt; text-transform: uppercase; }
    .t3-m-text { font-size: 9.5pt; color: #6b7280; line-height: 1.7; text-align: justify; }
    
    .t3-edu-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15pt; }
    .t3-edu-degree { font-size: 10pt; font-weight: 800; color: #1f2937; text-transform: uppercase; margin-bottom: 2pt; }
    .t3-edu-school { font-size: 9pt; color: #6b7280; margin-bottom: 2pt; }
    .t3-edu-year { font-size: 8.5pt; color: #9ca3af; }
    
    .t3-layout .exp-item { margin-bottom: 20pt; }
    .t3-layout .exp-row { display: flex; align-items: center; flex-direction: row-reverse; justify-content: flex-end; margin-bottom: 4pt; }
    .t3-layout .exp-date { background: #ea580c; color: #fff; font-size: 8pt; font-weight: 700; padding: 2pt 6pt; border-radius: 2pt; margin-right: 10pt; }
    .t3-layout .exp-role { font-size: 11pt; font-weight: 800; color: #1f2937; text-transform: uppercase; }
    .t3-layout .exp-company { font-size: 10pt; font-weight: 600; color: #6b7280; margin-bottom: 6pt; }
    .t3-layout .exp-desc { font-size: 9.5pt; color: #6b7280; line-height: 1.6; text-align: justify; }
    
    .t3-skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10pt; }
    .t3-skill-item { font-size: 10pt; font-weight: 700; color: #4b5563; display: flex; align-items: center; text-transform: uppercase; border: 1pt solid #e5e7eb; padding: 6pt 10pt; border-radius: 20pt; }
    .t3-skill-dot { width: 8pt; height: 8pt; border-radius: 50%; background: #ea580c; margin-right: 8pt; flex-shrink: 0; }

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
      background: #e2e8f0; 
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
      box-shadow: 0 30px 60px rgba(0,0,0,0.25); 
      background: #fff;
      flex-shrink: 0;
    }
  `;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
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
        var contentW = 595; 
        var contentH = 842;
        
        // Much larger margins to ensure space on all devices
        var scaleW = (winW - 120) / contentW;
        var scaleH = (winH - 150) / contentH;
        var scale = Math.min(scaleW, scaleH);
        
        if (scale > 1) scale = 1;
        scaler.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
      }
      window.addEventListener('resize', doScale);
      doScale();
      setTimeout(doScale, 300);
      setTimeout(doScale, 1000);
    })();
  </script>
</body>
</html>`;
};
