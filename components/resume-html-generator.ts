/**
 * resume-html-generator.ts
 *
 * ELITE CANVA TEMPLATE (Nina Lane Style)
 * 1. Strict A4 Standard (595pt x 842pt).
 * 2. 8pt Spacing System.
 */

export const generateResumeHtml = (
  data: any,
  templateId: string = "Elite",
  primaryColor: string = "#f59e0b",
  fontFamily: string = "Inter",
  isPrint: boolean = false,
): string => {
  const PAGE_W = 595;
  const PAGE_H = 842;
  const SIDEBAR_W = 200;

  const esc = (s: string) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const skills = (data.skills || "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);

  const skillBars = skills.map((s: string) => `
    <div class="skill-item">
      <div class="skill-name">${esc(s)}</div>
      <div class="skill-track"><div class="skill-fill" style="width: ${Math.floor(Math.random() * 40) + 60}%"></div></div>
    </div>
  `).join("");

  const expItems = (data.experience || []).map((exp: any) => `
    <div class="timeline-item" onclick="window.ReactNativeWebView.postMessage('edit:experience:${exp.id}')">
      <div class="timeline-dot"></div>
      <div class="exp-header">
        <div class="exp-role">${esc(exp.role)}</div>
        <div class="exp-period">${esc(exp.period)}</div>
      </div>
      <div class="exp-company">${esc(exp.company)}</div>
      <div class="exp-desc">${esc(exp.description)}</div>
    </div>
  `).join("");

  const pageContent = `
    <div class="page">
      <div class="top-accent"></div>
      <div class="photo-container" onclick="window.ReactNativeWebView.postMessage('edit:personal:photo')">
        ${data.photo ? `<img src="${data.photo}" class="photo">` : ""}
      </div>
      <div class="sidebar">
        <div class="s-name">${esc(data.name)}</div>
        <div class="s-title">${esc(data.title)}</div>
        <div class="s-section">
          <div class="s-heading"><span class="s-icon">📞</span>Contact</div>
          <div class="contact-item"><span class="contact-label">Email</span><div class="contact-value">${esc(data.email)}</div></div>
          <div class="contact-item"><span class="contact-label">Phone</span><div class="contact-value">${esc(data.phone)}</div></div>
          <div class="contact-item"><span class="contact-label">Location</span><div class="contact-value">${esc(data.location)}</div></div>
        </div>
        <div class="s-section">
          <div class="s-heading"><span class="s-icon">⚙</span>Skills</div>
          ${skillBars}
        </div>
      </div>
      <div class="main">
        <div class="m-section">
          <div class="m-heading"><span class="m-icon">👤</span>Profile</div>
          <div class="summary">${esc(data.summary)}</div>
        </div>
        <div class="m-section">
          <div class="m-heading"><span class="m-icon">💼</span>Experience</div>
          <div class="timeline">${expItems}</div>
        </div>
        <div class="m-section">
          <div class="m-heading"><span class="m-icon">🎓</span>Education</div>
          <div class="edu-item">
            <div class="edu-degree">${esc(data.education.degree)}</div>
            <div class="edu-school">${esc(data.education.school)}</div>
            <div class="edu-year">${esc(data.education.year)}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (isPrint) {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; }
@page { size: 595pt 842pt; margin: 0; }
body { font-family: 'Inter', sans-serif; width: 595pt; height: 842pt; overflow: hidden; }
.page { width: 595pt; height: 842pt; display: flex; position: relative; overflow: hidden; }
.top-accent { position: absolute; top: 0; left: 0; width: 100%; height: 120pt; background: ${primaryColor}; z-index: 0; }
.sidebar { width: ${SIDEBAR_W}pt; height: 100%; background: #1e293b; color: #fff; padding: 185pt 24pt 40pt; display: flex; flex-direction: column; z-index: 1; }
.photo-container { position: absolute; top: 40pt; left: 32pt; width: 136pt; height: 136pt; border-radius: 50%; border: 6pt solid #fff; overflow: hidden; z-index: 2; }
.photo { width: 100%; height: 100%; object-fit: cover; }
.s-name { font-size: 24pt; font-weight: 800; color: ${primaryColor}; line-height: 1.1; margin-bottom: 8pt; }
.s-title { font-size: 11pt; font-weight: 500; text-transform: uppercase; letter-spacing: 1.5pt; color: #94a3b8; margin-bottom: 40pt; }
.s-section { margin-bottom: 32pt; }
.s-heading { display: flex; align-items: center; gap: 8pt; font-size: 11pt; font-weight: 700; text-transform: uppercase; margin-bottom: 16pt; }
.s-icon { width: 18pt; height: 18pt; background: ${primaryColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10pt; }
.contact-item { font-size: 8.5pt; margin-bottom: 14pt; color: #cbd5e1; display: flex; flex-direction: column; }
.contact-label { font-weight: 700; color: #fff; margin-bottom: 3pt; font-size: 8pt; text-transform: uppercase; opacity: 0.7; }
.contact-value { white-space: nowrap; }
.skill-item { margin-bottom: 16pt; }
.skill-name { font-size: 9pt; color: #fff; margin-bottom: 6pt; }
.skill-track { height: 4pt; background: rgba(255,255,255,0.1); border-radius: 2pt; }
.skill-fill { height: 100%; background: ${primaryColor}; border-radius: 2pt; }
.main { flex: 1; padding: 145pt 40pt 40pt; z-index: 1; }
.m-section { margin-bottom: 40pt; }
.m-heading { display: flex; align-items: center; gap: 12pt; font-size: 13pt; font-weight: 800; text-transform: uppercase; margin-bottom: 24pt; color: #1e293b; }
.m-icon { width: 24pt; height: 24pt; background: ${primaryColor}; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.m-heading::after { content: ''; flex: 1; height: 1.5pt; background: #f1f5f9; }
.summary { font-size: 11pt; line-height: 1.8; color: #475569; text-align: justify; }
.timeline { position: relative; padding-left: 20pt; border-left: 1.5pt solid #e2e8f0; }
.timeline-item { position: relative; margin-bottom: 32pt; }
.timeline-dot { position: absolute; left: -24.5pt; top: 4pt; width: 8pt; height: 8pt; background: ${primaryColor}; border-radius: 50%; border: 2pt solid #fff; }
.exp-header { display: flex; justify-content: space-between; align-items: baseline; }
.exp-role { font-size: 12.5pt; font-weight: 800; color: #1e293b; }
.exp-period { font-size: 9pt; font-weight: 700; color: ${primaryColor}; }
.exp-company { font-size: 10.5pt; font-weight: 700; color: #64748b; margin-bottom: 10pt; }
.exp-desc { font-size: 10pt; line-height: 1.75; color: #475569; }
.edu-item { margin-bottom: 16pt; }
.edu-degree { font-size: 11pt; font-weight: 700; color: #1e293b; }
.edu-school { font-size: 10pt; color: #64748b; }
.edu-year { font-size: 9pt; font-weight: 600; color: ${primaryColor}; }
</style>
</head>
<body>${pageContent}</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #cbd5e1; font-family: 'Inter', sans-serif; width: 100%; }
#preview-container { display: flex; flex-direction: column; align-items: center; width: 100%; padding: 24pt 0; }
#resume-scaler { transform-origin: top center; width: 595pt; }
.page { width: 595pt; height: 842pt; background: #fff; display: flex; position: relative; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.2); }
.top-accent { position: absolute; top: 0; left: 0; width: 100%; height: 120pt; background: ${primaryColor}; z-index: 0; }
.sidebar { width: ${SIDEBAR_W}pt; height: 100%; background: #1e293b; color: #fff; padding: 160pt 24pt 40pt; display: flex; flex-direction: column; z-index: 1; }
.photo-container { position: absolute; top: 40pt; left: 32pt; width: 136pt; height: 136pt; border-radius: 50%; border: 6pt solid #fff; overflow: hidden; z-index: 2; }
.photo { width: 100%; height: 100%; object-fit: cover; }
.s-name { font-size: 24pt; font-weight: 800; color: ${primaryColor}; line-height: 1.1; margin-bottom: 8pt; }
.s-title { font-size: 11pt; font-weight: 500; text-transform: uppercase; color: #94a3b8; margin-bottom: 40pt; }
.s-section { margin-bottom: 32pt; }
.s-heading { display: flex; align-items: center; gap: 8pt; font-size: 11pt; font-weight: 700; text-transform: uppercase; margin-bottom: 16pt; }
.s-icon { width: 18pt; height: 18pt; background: ${primaryColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10pt; }
.contact-item { font-size: 8.5pt; margin-bottom: 14pt; color: #cbd5e1; display: flex; flex-direction: column; }
.contact-label { font-weight: 700; color: #fff; margin-bottom: 3pt; font-size: 8pt; text-transform: uppercase; opacity: 0.7; }
.contact-value { white-space: nowrap; }
.skill-item { margin-bottom: 16pt; }
.skill-name { font-size: 9pt; color: #fff; margin-bottom: 6pt; }
.skill-track { height: 4pt; background: rgba(255,255,255,0.1); border-radius: 2pt; }
.skill-fill { height: 100%; background: ${primaryColor}; border-radius: 2pt; }
.main { flex: 1; padding: 140pt 40pt 40pt; z-index: 1; }
.m-section { margin-bottom: 40pt; }
.m-heading { display: flex; align-items: center; gap: 12pt; font-size: 13pt; font-weight: 800; text-transform: uppercase; margin-bottom: 24pt; color: #1e293b; }
.m-icon { width: 24pt; height: 24pt; background: ${primaryColor}; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.m-heading::after { content: ''; flex: 1; height: 1.5pt; background: #f1f5f9; }
.summary { font-size: 11pt; line-height: 1.8; color: #475569; text-align: justify; }
.timeline { position: relative; padding-left: 20pt; border-left: 1.5pt solid #e2e8f0; }
.timeline-item { position: relative; margin-bottom: 32pt; }
.timeline-dot { position: absolute; left: -24.5pt; top: 4pt; width: 8pt; height: 8pt; background: ${primaryColor}; border-radius: 50%; border: 2pt solid #fff; }
.exp-header { display: flex; justify-content: space-between; align-items: baseline; }
.exp-role { font-size: 12.5pt; font-weight: 800; color: #1e293b; }
.exp-period { font-size: 9pt; font-weight: 700; color: ${primaryColor}; }
.exp-company { font-size: 10.5pt; font-weight: 700; color: #64748b; margin-bottom: 10pt; }
.exp-desc { font-size: 10pt; line-height: 1.75; color: #475569; }
.edu-item { margin-bottom: 16pt; }
.edu-degree { font-size: 11pt; font-weight: 700; color: #1e293b; }
.edu-school { font-size: 10pt; color: #64748b; }
.edu-year { font-size: 9pt; font-weight: 600; color: ${primaryColor}; }
</style>
</head>
<body>
<div id="preview-container">
  <div id="resume-scaler">
    ${pageContent}
  </div>
</div>
<script>
  (function() {
    var scaler = document.getElementById('resume-scaler');
    var container = document.getElementById('preview-container');
    function doScale() {
      var winW = window.innerWidth;
      var contentW = scaler.offsetWidth;
      var scale = Math.min(1, (winW - 24) / contentW);
      scaler.style.transform = 'scale(' + scale + ')';
      container.style.height = (scaler.offsetHeight * scale + 60) + 'px';
    }
    window.addEventListener('resize', doScale);
    doScale();
    setTimeout(doScale, 500); 
  })();
</script>
</body>
</html>`;
};
