import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';

export const saveResumeToFirestore = async (resumeData: any, resumeId?: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const resumeCollection = collection(db, 'resumes');
  
  const data = {
    ...resumeData,
    userId: user.uid,
    updatedAt: serverTimestamp(),
  };

  if (resumeId) {
    const resumeDoc = doc(db, 'resumes', resumeId);
    await updateDoc(resumeDoc, data);
    return resumeId;
  } else {
    const docRef = await addDoc(resumeCollection, {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }
};

export const getUserResumesFromFirestore = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const q = query(collection(db, 'resumes'), where('userId', '==', user.uid));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const deleteResumeFromFirestore = async (resumeId: string) => {
  await deleteDoc(doc(db, 'resumes', resumeId));
};
