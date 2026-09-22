import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';

const app = initializeApp({
  apiKey: "AIzaSyCZT9mI0PG1nYOijVszamr2ouJCWwBuwkE",
  authDomain: "gestor-eosa.firebaseapp.com",
  projectId: "gestor-eosa",
  storageBucket: "gestor-eosa.firebasestorage.app",
  messagingSenderId: "159111500808",
  appId: "1:159111500808:web:85f4f1c93a12340182edbd"
});

const db = getFirestore(app);
getDocs(collection(db, 'officeResources')).then(snap => {
  const desks = [];
  snap.docs.forEach(d => {
    if(d.data().type !== 'meeting_room') desks.push({id: d.id, ...d.data()});
  });
  console.log(JSON.stringify(desks, null, 2));
  process.exit(0);
});
