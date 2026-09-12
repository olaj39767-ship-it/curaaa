import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, db, googleProvider } from './firebase';
import { Medicine, Order, QuoteRequest, User } from '../types';
import { MEDICINES } from '../data/mockData';

// Collection references
const MEDICATIONS_COLLECTION = 'medications';
const ORDERS_REQUESTS_COLLECTION = 'orders_and_requests';
const USERS_COLLECTION = 'users';

// Admin email for primary privilege assignment
export const SUPER_ADMIN_EMAIL = 'olaj39767@gmail.com';

// -------------------------------------------------------------
// USER & AUTHENTICATION SERVICES
// -------------------------------------------------------------

export const registerWithEmail = async (
  email: string, 
  pass: string, 
  name: string, 
  phone: string, 
  role: 'patient' | 'pharmacist' | 'admin' = 'patient'
): Promise<User> => {
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  const fbUser = credential.user;

  await updateProfile(fbUser, { displayName: name });

  // Determine role: if it's the administrator's email, automatically grant admin
  const assignedRole: 'patient' | 'pharmacist' | 'admin' = 
    email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ? 'admin' : role;

  const newUser: User = {
    id: fbUser.uid,
    name: name || 'User',
    email: fbUser.email || email,
    phone: phone || '+234 800 000 0000',
    role: assignedRole,
    createdAt: new Date().toISOString(),
    city: 'Lagos',
    state: 'Lagos State'
  };

  await setDoc(doc(db, USERS_COLLECTION, fbUser.uid), newUser);
  return newUser;
};

export const loginWithEmail = async (email: string, pass: string): Promise<User> => {
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  const fbUser = credential.user;
  
  // Retrieve or create profile
  const userDoc = await getDoc(doc(db, USERS_COLLECTION, fbUser.uid));
  if (userDoc.exists()) {
    return userDoc.data() as User;
  }

  // Fallback if record was missing
  const assignedRole: 'patient' | 'pharmacist' | 'admin' = 
    (fbUser.email || '').toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'patient';

  const userRecord: User = {
    id: fbUser.uid,
    name: fbUser.displayName || 'User',
    email: fbUser.email || email,
    phone: fbUser.phoneNumber || '+234 800 000 0000',
    role: assignedRole,
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, USERS_COLLECTION, fbUser.uid), userRecord);
  return userRecord;
};

export const loginWithGoogle = async (): Promise<User> => {
  const credential = await signInWithPopup(auth, googleProvider);
  const fbUser = credential.user;

  const userDoc = await getDoc(doc(db, USERS_COLLECTION, fbUser.uid));
  if (userDoc.exists()) {
    const data = userDoc.data() as User;
    // Upgrade to admin if super admin email matches
    if ((fbUser.email || '').toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && data.role !== 'admin') {
      await updateDoc(doc(db, USERS_COLLECTION, fbUser.uid), { role: 'admin' });
      return { ...data, role: 'admin' };
    }
    return data;
  }

  const assignedRole: 'patient' | 'pharmacist' | 'admin' = 
    (fbUser.email || '').toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'patient';

  const userRecord: User = {
    id: fbUser.uid,
    name: fbUser.displayName || 'Google User',
    email: fbUser.email || '',
    phone: fbUser.phoneNumber || '+234 800 000 0000',
    role: assignedRole,
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, USERS_COLLECTION, fbUser.uid), userRecord);
  return userRecord;
};

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const fetchAllUsers = async (): Promise<User[]> => {
  try {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const updateUserRole = async (userId: string, newRole: 'patient' | 'pharmacist' | 'admin'): Promise<void> => {
  await updateDoc(doc(db, USERS_COLLECTION, userId), { 
    role: newRole,
    updatedAt: new Date().toISOString()
  });
};

// -------------------------------------------------------------
// MEDICATION INVENTORY SERVICES (FIRESTORE)
// -------------------------------------------------------------

export const fetchLiveMedications = async (): Promise<Medicine[]> => {
  try {
    const snapshot = await getDocs(collection(db, MEDICATIONS_COLLECTION));
    
    // If database is brand new and empty, seed the initial authentic inventory
    if (snapshot.empty) {
      console.log('Seeding initial authentic medications into Firestore...');
      const seedPromises = MEDICINES.map(async (med) => {
        const medRef = doc(db, MEDICATIONS_COLLECTION, med.id);
        await setDoc(medRef, {
          ...med,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        return med;
      });
      await Promise.all(seedPromises);
      return MEDICINES;
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Medicine));
  } catch (error) {
    console.warn('Firestore fetch failed, returning fallback catalog:', error);
    return MEDICINES;
  }
};

export const addLiveMedication = async (medData: Omit<Medicine, 'id'>): Promise<Medicine> => {
  const newDocRef = await addDoc(collection(db, MEDICATIONS_COLLECTION), {
    ...medData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const createdMedicine: Medicine = {
    id: newDocRef.id,
    ...medData
  };

  // Sync id field in doc
  await updateDoc(newDocRef, { id: newDocRef.id });
  return createdMedicine;
};

export const updateLiveMedication = async (id: string, updates: Partial<Medicine>): Promise<void> => {
  const medRef = doc(db, MEDICATIONS_COLLECTION, id);
  await setDoc(medRef, {
    ...updates,
    id,
    updatedAt: new Date().toISOString()
  }, { merge: true });
};

export const deleteLiveMedication = async (id: string): Promise<void> => {
  const medRef = doc(db, MEDICATIONS_COLLECTION, id);
  await deleteDoc(medRef);
};

// -------------------------------------------------------------
// ORDERS & PRESCRIPTION REQUESTS SERVICES (FIRESTORE)
// -------------------------------------------------------------

export interface LiveRequestItem {
  id: string;
  referenceNo: string;
  type: 'drug_order' | 'prescription_quote' | 'teleconsultation' | 'care_nurse';
  status: 'pending' | 'reviewing' | 'approved' | 'dispatched' | 'completed' | 'cancelled';
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  total: number;
  itemsSummary: string;
  prescriptionFileUrl?: string;
  rawText?: string;
  notes?: string;
  pharmacistNote?: string;
  paymentMethod?: string;
  paymentReference?: string;
  createdAt: string;
  updatedAt?: string;
}

export const fetchLiveOrdersAndRequests = async (): Promise<LiveRequestItem[]> => {
  try {
    const q = query(collection(db, ORDERS_REQUESTS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LiveRequestItem));
  } catch (error) {
    // If index or order error, try without orderBy
    try {
      const snapshot = await getDocs(collection(db, ORDERS_REQUESTS_COLLECTION));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LiveRequestItem)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (innerErr) {
      console.error('Error fetching live requests:', innerErr);
      return [];
    }
  }
};

export const createLiveOrderOrRequest = async (item: Omit<LiveRequestItem, 'id'>): Promise<LiveRequestItem> => {
  const docRef = await addDoc(collection(db, ORDERS_REQUESTS_COLLECTION), {
    ...item,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  await updateDoc(docRef, { id: docRef.id });

  return {
    id: docRef.id,
    ...item
  };
};

export const updateLiveRequestStatus = async (
  requestId: string, 
  newStatus: LiveRequestItem['status'],
  pharmacistNote?: string
): Promise<void> => {
  const docRef = doc(db, ORDERS_REQUESTS_COLLECTION, requestId);
  const updates: Record<string, any> = {
    status: newStatus,
    updatedAt: new Date().toISOString()
  };
  if (pharmacistNote !== undefined) {
    updates.pharmacistNote = pharmacistNote;
  }
  await updateDoc(docRef, updates);
};
