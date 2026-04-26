import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { ResumeData } from '@/components/resume-templates';

export const exportToPDF = async (resumeData: ResumeData, templateName: string = 'Modern') => {
  const html = generateHTML(resumeData, templateName);
  
  try {
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false
    });
    
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Download Resume',
      UTI: 'com.adobe.pdf'
    });
  } catch (error) {
    console.error('Error exporting PDF:', error);
  }
};

const generateHTML = (data: ResumeData, template: string) => {
  const styles = `
    <style>
      @page {
        size: A4;
        margin: 0;
      }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact;
      }
      body { 
        font-family: 'Helvetica', 'Arial', sans-serif; 
        padding: 0; 
        margin: 0; 
        color: #333; 
        line-height: 1.5;
        background: #fff;
      }
      .page {
        width: 210mm;
        height: 297mm;
        overflow: hidden;
        position: relative;
        background: white;
      }
      .container { padding: 25mm; height: 100%; }
      h1, h2, h3 { margin: 0; padding: 0; }
      .header { margin-bottom: 25px; border-bottom: 2px solid #000; padding-bottom: 15px; text-align: center; }
      .title { color: #666; font-size: 14px; margin-top: 5px; }
      .contact { font-size: 11px; color: #666; margin-top: 5px; }
      .section { margin-bottom: 25px; }
      .section-title { font-size: 13px; font-weight: bold; border-left: 4px solid #FF69B4; padding-left: 10px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
      .exp-item { margin-bottom: 18px; }
      .exp-header { display: flex; justify-content: space-between; font-weight: bold; }
      .exp-company { font-style: italic; color: #FF69B4; margin-bottom: 3px; font-size: 12px; }
      .skills-grid { display: flex; flex-wrap: wrap; gap: 8px; }
      .skill-tag { background: #f1f5f9; padding: 4px 10px; border-radius: 4px; font-size: 10px; color: #475569; }
      
      /* Modern Template Styles */
      .modern-layout { display: flex; height: 100%; width: 100%; }
      .sidebar { width: 32%; background: #0f172a; color: #fff; padding: 30mm 15px 15mm 15px; }
      .main { width: 68%; padding: 25mm 20mm; }
      .modern-name { font-size: 24px; font-weight: 900; line-height: 1.1; margin-bottom: 10px; }
      .modern-contact-title { color: #FF69B4; font-size: 10px; font-weight: bold; margin-bottom: 8px; margin-top: 25px; text-transform: uppercase; letter-spacing: 1px; }
      .sidebar-item { font-size: 10px; color: #cbd5e1; margin-bottom: 8px; }
      .sidebar-divider { width: 35px; height: 3px; background: #FF69B4; margin-bottom: 25px; }
    </style>
  `;

  if (template === 'Modern') {
    return `
      <html>
        <head>${styles}</head>
        <body>
          <div class="page">
            <div class="modern-layout">
              <div class="sidebar">
                <div class="modern-name">${data.name.toUpperCase()}</div>
                <div class="sidebar-divider"></div>
                
                <div class="modern-contact-title">CONTACT</div>
                <div class="sidebar-item">${data.email}</div>
                <div class="sidebar-item">${data.phone}</div>
                
                <div class="modern-contact-title">CORE SKILLS</div>
                ${data.skills.split(',').map(s => `<div class="sidebar-item">• ${s.trim()}</div>`).join('')}
              </div>
              <div class="main">
                <div class="section">
                  <div class="section-title">Profile</div>
                  <div style="font-size: 11px; color: #475569;">${data.summary}</div>
                </div>
                <div class="section">
                  <div class="section-title">Work History</div>
                  ${data.experience.map(exp => `
                    <div class="exp-item">
                      <div class="exp-header">
                        <div style="font-size: 13px;">${exp.role}</div>
                        <div style="font-size: 10px; color: #64748b;">${exp.period}</div>
                      </div>
                      <div class="exp-company">${exp.company.toUpperCase()}</div>
                      <div style="font-size: 11px; color: #475569; margin-top: 4px;">• ${exp.description}</div>
                     </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Fallback for Executive / Others
  return `
    <html>
      <head>${styles}</head>
      <body>
        <div class="page">
          <div class="container">
            <div class="header">
              <h1>${data.name.toUpperCase()}</h1>
              <div class="title">${data.title}</div>
              <div class="contact">${data.email} | ${data.phone}</div>
            </div>
            <div class="section">
              <div class="section-title">Executive Summary</div>
              <p style="font-size: 12px;">${data.summary}</p>
            </div>
            <div class="section">
              <div class="section-title">Experience</div>
              ${data.experience.map(exp => `
                <div class="exp-item">
                  <div class="exp-header">
                    <span style="font-size: 13px;">${exp.role}</span>
                    <span style="font-size: 10px; color: #64748b;">${exp.period}</span>
                  </div>
                  <div class="exp-company">${exp.company}</div>
                  <p style="font-size: 11px;">${exp.description}</p>
                </div>
              `).join('')}
            </div>
            <div class="section">
              <div class="section-title">Skills</div>
              <div class="skills-grid">
                ${data.skills.split(',').map(s => `<div class="skill-tag">${s.trim()}</div>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
