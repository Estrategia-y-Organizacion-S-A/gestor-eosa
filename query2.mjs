
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCZT9mI0PG1nYOijVszamr2ouJCWwBuwkE',
  authDomain: 'gestor-eosa.firebaseapp.com',
  projectId: 'gestor-eosa'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Use REST API to query directly without auth? 
// No, Firestore REST API also needs auth if rules require it.

