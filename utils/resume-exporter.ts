import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateResumeHtml } from '../components/resume-html-generator';

export const exportToPDF = async (
  resumeData: any,
  templateName: string = 'Modern',
  primaryColor: string = '#1e293b'
) => {
  // Generate the high-fidelity A4 A-grade print HTML structure
  const html = generateResumeHtml(
    resumeData,
    templateName,
    primaryColor,
    'Inter',
    true // isPrint = true for strict PDF/A4 print styling
  );
  
  try {
    // Generate the PDF file with exact A4 dimensions matching generateResumeHtml (595pt x 842pt)
    const { uri } = await Print.printToFileAsync({
      html,
      width: 595,
      height: 842,
      margins: { left: 0, right: 0, top: 0, bottom: 0 }
    });
    
    // Trigger sharing sheet to download or share the PDF
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Download Resume',
      UTI: 'com.adobe.pdf'
    });
  } catch (error) {
    console.error('Error exporting PDF:', error);
  }
};
