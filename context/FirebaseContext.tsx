import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, 
  getDocs, query, limit, startAfter, where, orderBy 
} from 'firebase/firestore';

const FirebaseContext = createContext<any>(null);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // FUNCIÓN QUE CAUSABA EL ERROR (Asegúrate de que se llame exactamente así)
  const fetchProductsPaginatedAndFiltered = async (options: any) => {
    try {
      const { searchTerm = '', limit: pageSize = 20 } = options;
      let q = query(collection(db, 'products'), orderBy('name'), limit(pageSize));

      if (searchTerm) {
        q = query(
          collection(db, 'products'), 
          where('name', '>=', searchTerm), 
          where('name', '<=', searchTerm + '\uf8ff'),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      return {
        products,
        lastVisible: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error("Error en fetchProducts:", error);
      return { products: [], lastVisible: null, hasMore: false };
    }
  };

  const addProduct = (data: any) => addDoc(collection(db, 'products'), data);
  const updateProduct = (id: string, data: any) => updateDoc(doc(db, 'products', id), data);
  const deleteProduct = (id: string) => deleteDoc(doc(db, 'products', id));

  return (
    <FirebaseContext.Provider value={{ 
      user, loading, fetchProductsPaginatedAndFiltered, 
      addProduct, updateProduct, deleteProduct, suppliers: [] 
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);