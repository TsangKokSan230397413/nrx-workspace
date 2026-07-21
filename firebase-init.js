// 請把下面這個物件，換成你在 Firebase 主控台
// 「專案設定 → 一般 → 你的應用程式」裡複製到的 firebaseConfig。
// 這組金鑰放在前端程式碼裡是安全的，真正的保護是靠 Firestore 的安全規則。
const firebaseConfig = {
  apiKey: "請貼上你的 apiKey",
  authDomain: "請貼上你的 authDomain",
  projectId: "請貼上你的 projectId",
  storageBucket: "請貼上你的 storageBucket",
  messagingSenderId: "請貼上你的 messagingSenderId",
  appId: "請貼上你的 appId"
};

firebase.initializeApp(firebaseConfig);

// 之後 app.js 會直接用這兩個全域變數存取登入功能與資料庫
window.auth = firebase.auth();
window.db = firebase.firestore();
