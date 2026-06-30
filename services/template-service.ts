import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { DEFAULT_TEMPLATE_SERIES, DEFAULT_ALL_TEMPLATES, DEFAULT_RESUME_DATA } from '../constants/defaultTemplates';
import { ResumeData } from '../components/resume-templates';

export interface TemplatesConfig {
  templateSeries: typeof DEFAULT_TEMPLATE_SERIES;
  allTemplates: typeof DEFAULT_ALL_TEMPLATES;
  defaultData: ResumeData;
}

const TEMPLATES_DOC_ID = 'main_config';
const TEMPLATES_COLLECTION = 'appConfig';

/**
 * Fetches the templates configuration from Firestore.
 * Returns null if the document does not exist.
 */
export const fetchTemplatesFromFirebase = async (): Promise<TemplatesConfig | null> => {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, TEMPLATES_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as TemplatesConfig;
    } else {
      console.log("No such document in Firebase!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching templates from Firebase:", error);
    return null;
  }
};

/**
 * Seeds the default templates to Firebase.
 * This can be used in DEV mode or a hidden admin button.
 */
export const seedTemplatesToFirebase = async (): Promise<boolean> => {
  try {
    const docRef = doc(db, TEMPLATES_COLLECTION, TEMPLATES_DOC_ID);
    await setDoc(docRef, {
      templateSeries: DEFAULT_TEMPLATE_SERIES,
      allTemplates: DEFAULT_ALL_TEMPLATES,
      defaultData: DEFAULT_RESUME_DATA,
    });
    console.log("Successfully seeded templates to Firebase!");
    return true;
  } catch (error) {
    console.error("Error seeding templates to Firebase:", error);
    return false;
  }
};
