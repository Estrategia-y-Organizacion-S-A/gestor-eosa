
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

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
  
  // Añadir la nueva mesa si no existe
  if (entradaDesks.length < 3) {
     const newLabel = 'Entrada 3';
     const exists = desks.find(d => d.label === newLabel);
     if (!exists) {
        // La mesa de la entrada en UI está en x=420, y=60, width=120, height=40.
        // Entrada 1 podría estar en x=420, y=55? 
        // Primero vemos dondé están las actuales para posicionar la tercera al lado.
     }
  }
  process.exit(0);
}
run();

