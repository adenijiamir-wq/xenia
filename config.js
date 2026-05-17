import { initializeApp }               from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase }                 from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey:            "AIzaSyBUeG9xUQInB6kCQyVh4u7ZYZpQ2fIPoq0",
  authDomain:        "xenia-d9346.firebaseapp.com",
  databaseURL:       "https://xenia-d9346-default-rtdb.firebaseio.com",
  projectId:         "xenia-d9346",
  storageBucket:     "xenia-d9346.firebasestorage.app",
  messagingSenderId: "582964075898",
  appId:             "1:582964075898:web:9564bd38b0bb5453dc4ac3"
};

const firebaseApp = initializeApp(firebaseConfig);
export const auth           = getAuth(firebaseApp);
export const rtdb           = getDatabase(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

export const CLOUD = { name: "dvm9w1a5a", preset: "Xenia upload" };

export async function uploadImage(file) {
  if (!file) return null;
  if (file.size > 10 * 1024 * 1024) throw new Error("Image too large (max 10 MB)");
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUD.preset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD.name}/image/upload`, { method: "POST", body: fd });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.secure_url;
}
