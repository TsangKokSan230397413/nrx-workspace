// 這是 nrx-workspace 這個 Firebase 專案、reablement-web 這個網頁應用程式的設定值。
const firebaseConfig = {
  apiKey: "AIzaSyDsmWbOtl8vtUIfpdsWjIS1dNCUojv_k7I",
  authDomain: "nrx-workspace.firebaseapp.com",
  projectId: "nrx-workspace",
  storageBucket: "nrx-workspace.firebasestorage.app",
  messagingSenderId: "482859983784",
  appId: "1:482859983784:web:34945b7992cc21501d339d",
  measurementId: "G-G6JBFNQEJB"
};

firebase.initializeApp(firebaseConfig);

// 之後 app.js 會直接用這兩個全域變數存取登入功能與資料庫
window.auth = firebase.auth();
window.db = firebase.firestore();
