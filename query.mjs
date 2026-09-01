
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCZT9mI0PG1nYOijVszamr2ouJCWwBuwkE',
  authDomain: 'gestor-eosa.firebaseapp.com',
  projectId: 'gestor-eosa'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const snap = await getDocs(collection(db, 'officeResources'));
  const desks = snap.docs.map(d => ({id: d.id, ...d.data()}));
  
  const entradaDesks = desks.filter(d => d.label && d.label.includes('Entrada'));
  console.log('Mesa Entrada actuales:', entradaDesks);
  
  process.exit(0);
}
run();

