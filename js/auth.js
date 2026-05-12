import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, GoogleAuthProvider, signInWithPopup, updateProfile,
  sendPasswordResetEmail, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc, setDoc, getDoc, updateDoc, collection, query, where, onSnapshot, increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { auth, db, googleProvider } from './config.js';
import { state } from './state.js';
import { toast, showModal, closeModal, avatarHtml, escapeHtml, $ } from './helpers.js';

// ── Ensure user doc exists ──────────────────────────────────
export async function ensureProfile(user) {
  const ref  = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const profile = {
      uid:                  user.uid,
      email:                user.email,
      displayName:          user.displayName || user.email.split('@')[0],
      photoURL:             user.photoURL || null,
      phone:                '',
      bio:                  '',
      schoolEmail:          '',
      schoolVerified:       false,
      rating:               0,
      reviewCount:          0,
      transactionsCompleted: 0,
      joinedAt:             serverTimestamp()
    };
    await setDoc(ref, profile);
    state.profile = profile;
  } else {
    state.profile = snap.data();
  }
}

// ── Auth actions ────────────────────────────────────────────
export async function signUp(email, password, name) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(cred.user, { displayName: name });
  await ensureProfile({ ...cred.user, displayName: name || cred.user.displayName });
  toast('Welcome to Xenia!', 'success');
}

export async function signIn(email, password) {
  await signInWithEmailAndPassword(auth, email, password);
  toast('Welcome back!', 'success');
}

export async function signInGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureProfile(cred.user);
  toast('Welcome!', 'success');
}

export async function doSignOut() {
  await signOut(auth);
  closeModal();
  window.navigate('#home');
  toast('Signed out');
}
window.doSignOut = doSignOut;

// ── Auth modal ───────────────────────────────────────────────
export function openAuth() {
  let mode = 'signin';

  const render = () => {
    showModal(`
      <div class="p-6">
        <div class="flex justify-between items-center mb-5">
          <h2 class="text-2xl font-bold">${mode === 'signin' ? 'Welcome back' : 'Join Xenia'}</h2>
          <button onclick="closeModal()" class="p-1.5 hover:bg-ink-100 rounded-full">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Google -->
        <button id="btnGoogle" class="w-full border-2 border-ink-200 hover:bg-ink-50 font-semibold py-3 rounded-full flex items-center justify-center gap-2 transition mb-4">
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div class="flex items-center gap-3 mb-4">
          <div class="flex-1 border-t border-ink-200"></div>
          <span class="text-xs text-ink-400">or</span>
          <div class="flex-1 border-t border-ink-200"></div>
        </div>

        <!-- Email form -->
        <form id="authForm" class="space-y-3">
          ${mode === 'signup' ? `<input name="name" placeholder="Your name" required class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none">` : ''}
          <input name="email" type="email" placeholder="Email" required autocomplete="email"
            class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none">
          <input name="password" type="password" placeholder="Password (6+ characters)" required minlength="6"
            autocomplete="${mode === 'signin' ? 'current-password' : 'new-password'}"
            class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none">
          <button type="submit" id="authSubmit"
            class="w-full bg-scarlet-500 hover:bg-scarlet-600 text-white font-bold py-3 rounded-full transition">
            ${mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        ${mode === 'signin' ? `<p class="text-center mt-3"><button id="btnForgot" class="text-sm text-ink-500 hover:text-scarlet-500">Forgot password?</button></p>` : ''}

        <p class="text-center text-sm mt-4 text-ink-600">
          ${mode === 'signin' ? "Don't have an account?" : 'Already have one?'}
          <button id="toggleAuthMode" class="text-scarlet-500 font-semibold ml-1">
            ${mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    `);

    document.getElementById('toggleAuthMode').onclick = () => { mode = mode === 'signin' ? 'signup' : 'signin'; render(); };

    document.getElementById('btnGoogle').onclick = async () => {
      try { await signInGoogle(); closeModal(); }
      catch (e) { toast(friendlyAuthError(e), 'error'); }
    };

    document.getElementById('btnForgot')?.addEventListener('click', async () => {
      const email = document.querySelector('#authForm input[name="email"]')?.value?.trim();
      if (!email) { toast('Enter your email first', 'error'); return; }
      try { await sendPasswordResetEmail(auth, email); toast('Reset email sent!', 'success'); }
      catch (e) { toast(friendlyAuthError(e), 'error'); }
    });

    document.getElementById('authForm').addEventListener('submit', async e => {
      e.preventDefault();
      const fd  = new FormData(e.target);
      const btn = document.getElementById('authSubmit');
      btn.disabled = true; btn.textContent = 'Loading…';
      try {
        if (mode === 'signin') await signIn(fd.get('email'), fd.get('password'));
        else await signUp(fd.get('email'), fd.get('password'), fd.get('name'));
        closeModal();
      } catch (err) {
        toast(friendlyAuthError(err), 'error');
        btn.disabled = false;
        btn.textContent = mode === 'signin' ? 'Sign in' : 'Create account';
      }
    });
  };

  render();
}
window.openAuth = openAuth;

function friendlyAuthError(e) {
  const map = {
    'auth/email-already-in-use': 'That email is already registered. Try signing in.',
    'auth/invalid-email':        'Invalid email address.',
    'auth/weak-password':        'Password too weak — use 6+ characters.',
    'auth/invalid-credential':   'Wrong email or password.',
    'auth/user-not-found':       'No account with that email.',
    'auth/wrong-password':       'Wrong password.',
    'auth/popup-closed-by-user': 'Google sign-in cancelled.'
  };
  return map[e.code] || e.message || 'Something went wrong.';
}

// ── Auth state observer ─────────────────────────────────────
export function initAuthObserver(onSignedIn, onSignedOut) {
  onAuthStateChanged(auth, async user => {
    if (user) {
      state.user = user;
      await ensureProfile(user);
      onSignedIn(user);
    } else {
      state.user    = null;
      state.profile = null;
      onSignedOut();
    }
  });
}

// ── Unread message badge ─────────────────────────────────────
export function watchUnread() {
  if (!state.user) return;
  const q = query(collection(db, 'conversations'), where('participants', 'array-contains', state.user.uid));
  const unsub = onSnapshot(q, snap => {
    let total = 0;
    snap.forEach(d => { total += (d.data().unread?.[state.user.uid] ?? 0); });
    const badge = document.getElementById('msgBadge');
    if (!badge) return;
    if (total > 0) { badge.textContent = total > 9 ? '9+' : total; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');
  });
  state.unsubscribes.push(unsub);
}
