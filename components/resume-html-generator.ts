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

  const languages = (data.languages || "")
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

  const sidebarContent = `
    <div class="sidebar">
      <div class="photo-wrapper">
        <div class="photo-container">
          ${data.photo ? `<img src="${data.photo}" class="photo">` : ""}
        </div>
      </div>
      
      <div class="identity">
        <div class="name">${esc(data.name)}</div>
        <div class="title">${esc(data.title)}</div>
      </div>

      <div class="s-section">
        <div class="s-heading">CONTACT</div>
        <div class="s-item"><span class="s-icon">📞</span> ${esc(data.phone)}</div>
        <div class="s-item"><span class="s-icon">✉</span> ${esc(data.email)}</div>
        <div class="s-item"><span class="s-icon">📍</span> ${esc(data.location)}</div>
      </div>

      <div class="s-section">
        <div class="s-heading">SKILLS</div>
        <div class="s-list">
          ${skills.map((s) => `<div class="s-list-item">• ${esc(s)}</div>`).join("")}
        </div>
      </div>

      <div class="s-section">
        <div class="s-heading">LANGUAGES</div>
        <div class="s-list">
          ${languages.map((l) => `<div class="s-list-item">• ${esc(l)}</div>`).join("")}
        </div>
      </div>

      <div class="s-section">
        <div class="s-heading">HOBBIES</div>
        <div class="s-list">
          <div class="s-list-item">• Writing</div>
          <div class="s-list-item">• Cricket</div>
          <div class="s-list-item">• Music</div>
        </div>
      </div>
    </div>
  `;

  const mainContent = `
    <div class="main">
      <div class="m-section">
        <div class="m-heading">PROFILE</div>
        <div class="m-text">${esc(data.summary)}</div>
      </div>

      <div class="m-section">
        <div class="m-heading">WORK EXPERIENCE</div>
        ${expItems}
      </div>

      <div class="m-section">
        <div class="m-heading">EDUCATION</div>
        <div class="edu-item">
          <div class="edu-degree">${esc(data.education.degree)}</div>
          <div class="edu-date">${esc(data.education.year)}</div>
          <div class="edu-school">${esc(data.education.school)}</div>
        </div>
      </div>
    </div>
  `;

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; }
    body { font-family: 'Inter', sans-serif; }
    
    .page { 
      width: 595pt; 
      height: 842pt; 
      display: flex; 
      background: #fff; 
      overflow: hidden; 
    }

    /* Sidebar */
    .sidebar { 
      width: 180pt; 
      height: 100%; 
      background: #1e293b; 
      color: #fff; 
      padding: 30pt 15pt;
    }
    .photo-wrapper { 
      display: flex; 
      justify-content: center; 
      margin-bottom: 20pt; 
    }
    .photo-container { 
      width: 100pt; 
      height: 100pt; 
      border-radius: 50%; 
      border: 3pt solid #fff; 
      overflow: hidden; 
      background: #334155;
    }
    .photo { width: 100%; height: 100%; object-fit: cover; }
    
    .identity { text-align: center; margin-bottom: 30pt; }
    .name { font-size: 20pt; font-weight: 800; margin-bottom: 4pt; }
    .title { font-size: 10pt; font-weight: 500; opacity: 0.8; text-transform: uppercase; letter-spacing: 1pt; }

    .s-section { margin-bottom: 20pt; }
    .s-heading { 
      font-size: 10pt; 
      font-weight: 800; 
      margin-bottom: 10pt; 
      border-bottom: 1pt solid rgba(255,255,255,0.2); 
      padding-bottom: 4pt;
      letter-spacing: 1pt;
    }
    .s-item { font-size: 8.5pt; margin-bottom: 8pt; display: flex; align-items: center; gap: 6pt; opacity: 0.9; }
    .s-icon { font-size: 10pt; }
    .s-list-item { font-size: 8.5pt; margin-bottom: 5pt; opacity: 0.9; }

    /* Main Content */
    .main { flex: 1; padding: 40pt 30pt; }
    .m-section { margin-bottom: 25pt; }
    .m-heading { 
      font-size: 12pt; 
      font-weight: 800; 
      color: #1e293b; 
      margin-bottom: 12pt; 
      border-bottom: 1.5pt solid #e2e8f0;
      padding-bottom: 4pt;
      letter-spacing: 1pt;
    }
    .m-text { font-size: 9.5pt; line-height: 1.6; color: #334155; text-align: justify; }

    .exp-item { margin-bottom: 15pt; }
    .exp-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2pt; }
    .exp-role { font-size: 11pt; font-weight: 700; color: #1e293b; }
    .exp-date { font-size: 8.5pt; font-weight: 600; color: #64748b; }
    .exp-company { font-size: 9.5pt; font-weight: 600; color: #475569; margin-bottom: 6pt; }
    .exp-desc { font-size: 9pt; line-height: 1.5; color: #334155; }

    .edu-item { margin-top: 10pt; }
    .edu-degree { font-size: 11pt; font-weight: 700; color: #1e293b; }
    .edu-date { font-size: 9pt; font-weight: 600; color: #64748b; margin-top: 2pt; }
    .edu-school { font-size: 10pt; font-weight: 500; color: #475569; margin-top: 4pt; }
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
  <div class="page">
    ${sidebarContent}
    ${mainContent}
  </div>
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
      <div class="page">
        ${sidebarContent}
        ${mainContent}
      </div>
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
