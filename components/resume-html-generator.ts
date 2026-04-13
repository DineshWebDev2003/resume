import { ResumeData } from "./resume-templates";

export const generateResumeHtml = (
  resumeData: ResumeData,
  template: string,
  primaryColor: string,
  fontFamily: string,
  width: number = 794,
  height: number = 1123,
): string => {
  // --- Auto Scaling Font Logic ---
  const calculateTotalLength = () => {
    let length = 0;
    length += (resumeData.name || "").length;
    length += (resumeData.title || "").length;
    length += (resumeData.summary || "").length;
    length += (resumeData.skills || "").length;
    (resumeData.experience || []).forEach(exp => {
      length += (exp.role || "").length + (exp.company || "").length + (exp.description || "").length;
    });
    (resumeData.projects || []).forEach(proj => {
      length += (proj.title || "").length + (proj.description || "").length;
    });
    length += (resumeData.education?.degree || "").length + (resumeData.education?.school || "").length;
    return length;
  };

  const totalLength = calculateTotalLength();
  let baseFontSize = 10;
  if (totalLength < 500) baseFontSize = 14;
  else if (totalLength < 1000) baseFontSize = 12;

  const bodyFontSize = `${baseFontSize}pt`;
  const sectionTitleSize = `${baseFontSize + 2}pt`;
  const nameSize = `${baseFontSize + 18}pt`;
  const itemTitleSize = `${baseFontSize + 1}pt`;

  const cssFont =
    fontFamily === "OpenSans"
      ? "'Open Sans', sans-serif"
      : `'${fontFamily}', sans-serif`;

  const baseStyles = `
    @page { 
      size: ${width}px ${height}px; 
      margin: 0; 
    }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
    body { 
      margin: 0; 
      padding: 0; 
      font-family: ${cssFont}; 
      color: #334155; 
      line-height: 1.5; 
      background: white; 
      width: ${width}px; 
      height: ${height}px;
      overflow: hidden;
      font-size: ${bodyFontSize};
    }
    .page { 
      width: ${width}px; 
      height: ${height}px; 
      padding: 40px; 
      position: relative; 
      background: white;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    h1, h2, h3, h4, h5, h6 { margin: 0; padding: 0; }
    .section-title { 
      font-size: ${sectionTitleSize}; 
      font-weight: 800; 
      letter-spacing: 1.5px; 
      margin-top: 20px;
      margin-bottom: 10px; 
      text-transform: uppercase; 
      border-bottom: 1.5px solid #334155; 
      padding-bottom: 4px; 
      color: #0f172a;
    }
    .profile-img { width: 90px; height: 90px; border-radius: 50%; margin-bottom: 15px; object-fit: cover; }
    .bullet-point { margin-bottom: 5px; position: relative; padding-left: 15px; }
    .bullet-point:before { content: "•"; position: absolute; left: 0; color: ${primaryColor}; }
  `;

  let templateHtml = "";

  if (template === "Executive") {
    templateHtml = `
      <style>
        ${baseStyles}
        .header { text-align: center; margin-bottom: 25px; }
        .name { font-size: ${nameSize}; font-weight: 800; letter-spacing: 3px; color: #000; text-transform: uppercase; line-height: 1.1; }
        .title { font-size: ${baseFontSize + 1}pt; font-weight: 600; color: #475569; margin-top: 5px; letter-spacing: 1.5px; text-transform: uppercase; }
        .contact { font-size: ${baseFontSize - 1}pt; margin-top: 8px; color: #64748b; font-weight: 500; }
        .summary { font-size: ${bodyFontSize}; text-align: justify; margin-bottom: 20px; line-height: 1.4; color: #334155; }
        .exp-item { margin-bottom: 15px; }
        .exp-header { display: flex; justify-content: space-between; font-weight: 800; font-size: ${itemTitleSize}; color: #0f172a; }
        .exp-meta { font-weight: 700; color: #475569; font-size: ${baseFontSize - 0.5}pt; margin-top: 3pt; margin-bottom: 6pt; }
        .content { flex: 1; }
      </style>
      <div class="page">
        <div class="header">
          ${resumeData.photo ? `<img src="${resumeData.photo}" class="profile-img">` : ""}
          <div class="name">${resumeData.name}</div>
          <div class="title">${resumeData.title}</div>
          <div class="contact">
            ${resumeData.email} &bull; ${resumeData.phone}
          </div>
        </div>
        <div class="content">
          <div style="font-size: 12pt; font-weight: 800; margin-bottom: 8px; text-align: left; text-transform: uppercase; color: #0f172a; border-bottom: 1.5px solid #334155; padding-bottom: 4px;">Professional Summary</div>
          <div class="summary">${resumeData.summary}</div>
          
          <div class="section-title">Work Experience</div>
          ${(resumeData.experience || [])
            .map(
              (exp) => `
            <div class="exp-item">
              <div class="exp-header"><span>${exp.role}</span><span>${exp.period}</span></div>
              <div class="exp-meta">${exp.company} ${exp.workType ? `&bull; ${exp.workType}` : ""}</div>
              <div style="font-size:10.5pt; line-height: 1.4; color: #444;">${exp.description}</div>
            </div>
          `,
            )
            .join("")}
          
          <div style="display:flex; gap:40px; margin-top:20px">
            <div style="flex:1">
              <div class="section-title">Education</div>
              <div style="font-weight:700; font-size:11pt; color: #0f172a">${resumeData.education?.degree || ""}</div>
              <div style="font-size:10.5pt; color:#475569; margin-top:2px">${resumeData.education?.school || ""}</div>
              <div style="font-size:10pt; color:#94a3b8; margin-top:2px">${resumeData.education?.year || ""}</div>
            </div>
            <div style="flex:1.2">
              <div class="section-title">Technical Skills</div>
              <div style="font-size:10.5pt; line-height:1.5; color: #334155">${resumeData.skills || ""}</div>
            </div>
          </div>

          ${
            resumeData.projects && resumeData.projects.length > 0
              ? `
            <div class="section-title">Key Projects</div>
            ${resumeData.projects
              .map(
                (proj) => `
              <div style="margin-bottom: 12px;">
                <div style="font-weight: 700; font-size: 11pt; color: #0f172a;">${proj.title}</div>
                <div style="font-size: 10.5pt; color: #444; margin-top: 3px;">${proj.description}</div>
              </div>
            `,
              )
              .join("")}
          `
              : ""
          }
        </div>
      </div>
    `;
  } else if (template === "Modern") {
    const sidebarWidth = Math.round(width * 0.35);
    templateHtml = `
      <style>
        ${baseStyles}
        .page { padding: 0; display: flex; flex-direction: row; }
        .sidebar { width: ${sidebarWidth}px; background-color: #0f172a; color: white; padding: 30px 25px; min-height: ${height}px; display: flex; flex-direction: column; }
        .main { flex: 1; padding: 35px 30px; display: flex; flex-direction: column; background-color: #fff; }
        .sidebar-name { font-size: ${baseFontSize + 10}pt; font-weight: 800; line-height: 1.1; margin-bottom: 15px; text-transform: uppercase; }
        .accent { width: 40px; height: 5px; background-color: ${primaryColor}; margin-bottom: 25px; }
        .sidebar-title { font-size: ${baseFontSize - 1}pt; font-weight: 800; color: ${primaryColor}; text-transform: uppercase; margin-bottom: 10px; margin-top: 25px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; }
        .main-title { font-size: ${sectionTitleSize}; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1.5px solid #e5e7eb; padding-bottom: 6px; margin-top: 25px; }
        .exp-role { font-size: ${itemTitleSize}; font-weight: 800; color: #111827; }
        .exp-company { color: #475569; font-weight: 700; font-size: ${baseFontSize - 0.5}pt; }
        .profile-img-sidebar { width: 110px; height: 110px; border-radius: 50%; border: 3px solid ${primaryColor}; margin-bottom: 20px; align-self: center; object-fit: cover; }
        .skill-item { font-size: ${baseFontSize - 1}pt; margin-bottom: 6px; color: #e2e8f0; display: flex; align-items: center; }
        .skill-item:before { content: "•"; color: ${primaryColor}; margin-right: 8px; font-weight: bold; }
      </style>
      <div class="page">
        <div class="sidebar">
          ${resumeData.photo ? `<img src="${resumeData.photo}" class="profile-img-sidebar">` : ""}
          <div class="sidebar-name">${resumeData.name}</div>
          <div class="accent"></div>
          
          <div class="sidebar-title" style="margin-top:0">Contact</div>
          <div style="font-size:10pt; margin-bottom:8px; color: #cbd5e1; word-break: break-all;">${resumeData.email}</div>
          <div style="font-size:10pt; color: #cbd5e1">${resumeData.phone}</div>
          
          <div class="sidebar-title">Skills</div>
          ${(resumeData.skills || "")
            .split(",")
            .map(
              (s) =>
                `<div class="skill-item">${s.trim()}</div>`,
            )
            .join("")}
          
          <div class="sidebar-title">Education</div>
          <div style="font-size:10.5pt; font-weight:700; color: white">${resumeData.education?.degree || ""}</div>
          <div style="font-size:10pt; color: #cbd5e1; margin-top:4px">${resumeData.education?.school || ""}</div>
          <div style="font-size:9.5pt; color: ${primaryColor}; margin-top:4px; font-weight: 600;">${resumeData.education?.year || ""}</div>
        </div>
        <div class="main">
          <div class="main-title" style="margin-top:0">Professional Profile</div>
          <div style="font-size: 11pt; line-height: 1.6; color: #334155; text-align: justify;">${resumeData.summary}</div>
          
          <div class="main-title">Work Experience</div>
          <div style="flex: 1">
            ${(resumeData.experience || [])
              .map(
                (exp) => `
              <div style="margin-bottom:20px">
                <div style="display:flex; justify-content:space-between; align-items: baseline">
                  <span class="exp-role">${exp.role}</span>
                  <span style="color:${primaryColor}; font-weight:700; font-size:10pt">${exp.period}</span>
                </div>
                <div class="exp-company" style="margin-top:4px">${exp.company} ${exp.workType ? `| ${exp.workType}` : ""}</div>
                <div style="font-size:10.5pt; margin-top:8px; color: #4b5563; line-height: 1.4;">${exp.description}</div>
              </div>
            `,
              )
              .join("")}

            ${
              resumeData.projects && resumeData.projects.length > 0
                ? `
              <div class="main-title">Key Projects</div>
              ${resumeData.projects
                .map(
                  (proj) => `
                <div style="margin-bottom: 15px;">
                  <div style="font-weight: 700; font-size: 11pt; color: #111827;">${proj.title}</div>
                  <div style="font-size: 10.5pt; color: #4b5563; margin-top: 4px; line-height: 1.4;">${proj.description}</div>
                </div>
              `,
                )
                .join("")}
            `
                : ""
            }
          </div>
        </div>
      </div>
    `;
  } else {
    // Creative/Professional Styles
    const brand = template === "Creative" ? "#d946ef" : "#1e3a8a";
    const isCreative = template === "Creative";
    templateHtml = `
      <style>
        ${baseStyles}
        .header { background-color: ${isCreative ? "#09090b" : "white"}; padding: 40px; color: ${isCreative ? "white" : "#1e3a8a"}; display: flex; align-items: center; gap: 30px; ${!isCreative ? "border-left: 20px solid " + brand : "border-bottom: 8px solid " + brand}; }
        .name { font-size: ${nameSize}; font-weight: 800; }
        .title { color: ${brand}; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px; font-size: ${baseFontSize + 3}pt; }
        .section-title { color: ${brand}; border-bottom-color: ${brand}; font-size: ${sectionTitleSize}; margin-top: 30px; }
        .item-role { font-size: ${itemTitleSize}; font-weight: 800; color: #09090b; }
        .profile-img-header { width: 110px; height: 110px; border-radius: ${isCreative ? "50%" : "8px"}; border: 4px solid ${brand}; object-fit: cover; }
        .main-content { flex: 1; display: flex; gap: 40px; padding: 0 40px 40px 40px; ${!isCreative ? "border-left: 20px solid " + brand : ""}; }
      </style>
      <div class="page" style="padding:0">
        <div class="header">
          ${resumeData.photo ? `<img src="${resumeData.photo}" class="profile-img-header">` : ""}
          <div>
            <div class="name">${resumeData.name}</div>
            <div class="title">${resumeData.title}</div>
            <div style="margin-top:20px; font-size:12pt; opacity: 0.8">${resumeData.email} &bull; ${resumeData.phone}</div>
          </div>
        </div>
        <div class="main-content">
          <div style="flex: 1.8">
            <div class="section-title" style="margin-top: 30px">Summary</div>
            <div style="font-size: ${bodyFontSize}; line-height:1.6; color: #27272a">${resumeData.summary}</div>
            <div class="section-title">Experience</div>
            ${(resumeData.experience || [])
              .map(
                (exp) => `
              <div style="margin-bottom:30px">
                <div style="display:flex; justify-content:space-between; align-items: baseline">
                  <span class="item-role">${exp.role}</span>
                  <span style="color:${brand}; font-weight:800; font-size:11pt">${exp.period}</span>
                </div>
                <div style="font-weight:700; color:#64748b; font-size: ${baseFontSize + 0.5}pt; margin: 4px 0">${exp.company}</div>
                <div style="font-size: ${baseFontSize - 0.5}pt; color: #444">&bull; ${exp.description}</div>
              </div>
            `,
              )
              .join("")}
          </div>
          <div style="flex: 1">
            <div class="section-title">Skills</div>
            <div style="font-size: ${baseFontSize - 1}pt; line-height:1.5; color: #27272a">${resumeData.skills || ""}</div>
            
            ${
              resumeData.projects && resumeData.projects.length > 0
                ? `
              <div class="section-title">Projects</div>
              ${resumeData.projects
                .map(
                  (p) => `
                <div style="margin-bottom:10px">
                  <div style="font-weight:800; font-size: ${itemTitleSize}; color: #09090b">${p.title}</div>
                  <div style="font-size: ${baseFontSize - 1}pt; color: #444; margin-top:3px">${p.description}</div>
                </div>
              `,
                )
                .join("")}
            `
                : ""
            }

            <div class="section-title">Education</div>
            <div style="font-weight:800; font-size: ${itemTitleSize}; color: #09090b">${resumeData.education?.degree || ""}</div>
            <div style="font-size: ${baseFontSize - 1}pt; color: #71717a; margin-top: 3px">${resumeData.education?.school || ""}</div>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&family=Open+Sans:wght@400;700;800&family=Lato:wght@400;700;900&family=Poppins:wght@400;600;700;900&family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet">
      </head>
      <body>${templateHtml}</body>
    </html>
  `;
};
