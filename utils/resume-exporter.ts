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
      body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 0; margin: 0; color: #333; line-height: 1.6; }
      .container { padding: 40px; min-height: 100vh; background: #fff; box-sizing: border-box; }
      h1, h2, h3 { margin: 0; padding: 0; }
      .header { margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; text-align: center; }
      .title { color: #666; font-size: 16px; margin-top: 5px; }
      .contact { font-size: 12px; color: #666; margin-top: 5px; }
      .section { margin-bottom: 30px; }
      .section-title { font-size: 14px; font-weight: bold; border-left: 4px solid #FF69B4; padding-left: 10px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
      .exp-item { margin-bottom: 20px; }
      .exp-header { display: flex; justify-content: space-between; font-weight: bold; }
      .exp-company { font-style: italic; color: #FF69B4; margin-bottom: 5px; }
      .skills-grid { display: flex; flex-wrap: wrap; gap: 10px; }
      .skill-tag { background: #f0f0f0; padding: 5px 12px; border-radius: 4px; font-size: 12px; }
      
      /* Modern Template Styles */
      .modern-layout { display: flex; min-height: 1100px; }
      .sidebar { width: 30%; background: #1e293b; color: #fff; padding: 40px 20px; }
      .main { width: 70%; padding: 40px; }
      .modern-name { font-size: 28px; font-weight: 900; line-height: 1.2; word-break: break-all; }
      .modern-contact-title { color: #FF69B4; font-size: 12px; font-weight: bold; margin-bottom: 10px; margin-top: 30px; }
      .sidebar-item { font-size: 11px; color: #cbd5e1; margin-bottom: 10px; }
    </style>
  `;

  if (template === 'Modern') {
    return `
      <html>
        <head>${styles}</head>
        <body>
          <div class="modern-layout">
            <div class="sidebar">
              <div class="modern-name">${data.name.toUpperCase()}</div>
              <div style="width: 40px; height: 4px; background: #FF69B4; margin-top: 15px;"></div>
              
              <div class="modern-contact-title">CONTACT</div>
              <div class="sidebar-item">${data.email}</div>
              <div class="sidebar-item">${data.phone}</div>
              
              <div class="modern-contact-title">CORE SKILLS</div>
              ${data.skills.split(',').map(s => `<div class="sidebar-item">• ${s.trim()}</div>`).join('')}
            </div>
            <div class="main">
              <div class="section">
                <div class="section-title">Profile</div>
                <div style="font-size: 12px; color: #475569;">${data.summary}</div>
              </div>
              <div class="section">
                <div class="section-title">Work History</div>
                ${data.experience.map(exp => `
                  <div class="exp-item">
                    <div class="exp-header">
                      <div style="font-size: 14px;">${exp.role}</div>
                      <div style="font-size: 11px; color: #64748b;">${exp.period}</div>
                    </div>
                    <div style="color: #FF69B4; font-size: 12px; font-weight: bold;">${exp.company.toUpperCase()}</div>
                    <div style="font-size: 12px; color: #475569; margin-top: 5px;">• ${exp.description}</div>
                   </div>
                `).join('')}
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
        <div class="container">
          <div class="header">
            <h1>${data.name.toUpperCase()}</h1>
            <div class="title">${data.title}</div>
            <div class="contact">${data.email} | ${data.phone}</div>
          </div>
          <div class="section">
            <div class="section-title">Executive Summary</div>
            <p>${data.summary}</p>
          </div>
          <div class="section">
            <div class="section-title">Experience</div>
            ${data.experience.map(exp => `
              <div class="exp-item">
                <div class="exp-header">
                  <span>${exp.role}</span>
                  <span>${exp.period}</span>
                </div>
                <div class="exp-company">${exp.company}</div>
                <p>${exp.description}</p>
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
      </body>
    </html>
  `;
};
