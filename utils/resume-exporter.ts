import { Alert, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { generateResumeHtml } from '../components/resume-html-generator';

/**
 * A4 Layout Standard (A4-PDF-LAYOUT-GUIDE)
 * A4 = 210mm × 297mm = 595.276pt × 841.89pt at 72 PPI
 * expo-print defaults to US Letter (612x792) without these explicit options.
 * Exact 595.276 x 841.89 constants prevent the 1px overflow caused by rounding to 595 x 842.
 */
export const A4_WIDTH = 595.276;
export const A4_HEIGHT = 841.89;

export const A4_OPTIONS = {
  width: A4_WIDTH,
  height: A4_HEIGHT,
  margins: { top: 0, right: 0, bottom: 0, left: 0 },
};

export interface ExportPDFOptions {
  fileName?: string;
  title?: string;
  primaryColor?: string;
  fontFamily?: string;
}

/**
 * Generates and downloads/shares a true A4-sized PDF resume.
 * Follows the A4 PDF Layout Guide:
 * 1. Generates HTML styled with @page { size: A4 portrait; margin: 0; }
 * 2. Uses exact A4 dimensions (595.276 x 841.89) to eliminate 1px overflow
 * 3. Moves file to cacheDirectory with clean safe filename (e.g., Resume_John_Doe.pdf)
 * 4. Invokes native OS share / save sheet (Drive, WhatsApp, Files, etc.)
 */
export const exportToPDF = async (
  resumeData: any,
  templateName: string = 'Modern',
  primaryColorOrOptions: string | ExportPDFOptions = '#1e293b',
  fontFamily: string = 'Inter',
  customFileName?: string
): Promise<string | null> => {
  let primaryColor = '#1e293b';
  let title = 'Save Resume';
  let fileName = customFileName;

  if (typeof primaryColorOrOptions === 'object' && primaryColorOrOptions !== null) {
    primaryColor = primaryColorOrOptions.primaryColor || '#1e293b';
    fontFamily = primaryColorOrOptions.fontFamily || fontFamily;
    title = primaryColorOrOptions.title || title;
    fileName = primaryColorOrOptions.fileName || fileName;
  } else if (typeof primaryColorOrOptions === 'string') {
    primaryColor = primaryColorOrOptions;
  }

  // 1. Generate high-fidelity A4 print HTML structure
  const html = generateResumeHtml(
    resumeData,
    templateName,
    primaryColor,
    fontFamily,
    true // isPrint = true for strict PDF/A4 print styling
  );

  try {
    // Web fallback
    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
      return null;
    }

    // 2. Convert HTML → true A4 PDF file using A4_OPTIONS
    const { uri } = await Print.printToFileAsync({
      html,
      ...A4_OPTIONS,
    });

    // 3. Move to cache with clean name
    const rawName =
      fileName ||
      resumeData?.name ||
      resumeData?.personalInfo?.name ||
      'Resume';
    const cleanBase = String(rawName).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeName = cleanBase.toLowerCase().endsWith('.pdf')
      ? cleanBase
      : `${cleanBase.startsWith('Resume') ? cleanBase : `Resume_${cleanBase}`}.pdf`;

    const targetUri = `${FileSystem.cacheDirectory}${safeName}`;

    let finalUri = uri;
    try {
      await FileSystem.deleteAsync(targetUri, { idempotent: true });
      await FileSystem.moveAsync({ from: uri, to: targetUri });
      finalUri = targetUri;
    } catch (fsErr) {
      console.warn('Could not move PDF to target name, using original uri:', fsErr);
      finalUri = uri;
    }

    // 4. Open native share/save sheet
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(finalUri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: title,
      });
    } else {
      Alert.alert('PDF Saved', `Resume saved: ${safeName}`);
    }

    return finalUri;
  } catch (error: any) {
    console.error('Error exporting PDF:', error);
    Alert.alert('Export Error', error?.message || 'Failed to generate PDF resume.');
    return null;
  }
};

/**
 * Direct Print / Preview dialog for true A4 PDF:
 * Opens the native OS Print Spooler / AirPrint dialog directly.
 */
export const directPreviewPdf = async (
  resumeData: any,
  templateName: string = 'Modern',
  primaryColor: string = '#1e293b',
  fontFamily: string = 'Inter'
): Promise<void> => {
  try {
    const html = generateResumeHtml(
      resumeData,
      templateName,
      primaryColor,
      fontFamily,
      true
    );

    await Print.printAsync({
      html,
      ...A4_OPTIONS,
    });
  } catch (error: any) {
    console.error('Direct PDF Preview error:', error);
    Alert.alert('Preview Failed', error?.message || 'Unable to preview resume.');
  }
};

/**
 * 1-Click WhatsApp Share for Resume PDF
 */
export const shareResumeToWhatsApp = async (pdfUri: string, candidateName?: string): Promise<void> => {
  try {
    if (!pdfUri) {
      Alert.alert('No Resume Found', 'Please build or upload a resume PDF first.');
      return;
    }
    const isAvail = await Sharing.isAvailableAsync();
    if (isAvail) {
      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: `Share ${candidateName ? `${candidateName}'s ` : ''}Resume via WhatsApp`,
      });
    } else {
      Alert.alert('Sharing Unavailable', 'Native sharing is not supported on this device.');
    }
  } catch (err: any) {
    console.warn('WhatsApp share fallback:', err);
    Alert.alert('Share Error', err?.message || 'Could not open share dialog.');
  }
};

/**
 * 1-Click Email Share for Resume PDF
 */
export const shareResumeViaEmail = async (pdfUri: string, candidateName?: string): Promise<void> => {
  try {
    if (!pdfUri) {
      Alert.alert('No Resume Found', 'Please build or upload a resume PDF first.');
      return;
    }
    const isAvail = await Sharing.isAvailableAsync();
    if (isAvail) {
      await Sharing.shareAsync(pdfUri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: `Email ${candidateName ? `${candidateName}'s ` : ''}Resume`,
      });
    } else {
      Alert.alert('Sharing Unavailable', 'Native sharing is not supported on this device.');
    }
  } catch (err: any) {
    console.warn('Email share fallback:', err);
    Alert.alert('Share Error', err?.message || 'Could not open email dialog.');
  }
};
