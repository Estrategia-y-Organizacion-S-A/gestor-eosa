import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';

const configContent = readFileSync('c:/Users/lloveira/Desktop/gestor-eosa/src/firebase/config.ts', 'utf8');
const match = configContent.match(/const firebaseConfig = ({[\s\S]*?});/);
if (match) {
  const firebaseConfig = eval('(' + match[1] + ')');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  getDocs(collection(db, 'officeResources')).then(snap => {
    snap.docs.forEach(d => console.log(d.id, d.data()));
    process.exit(0);
  });
}
