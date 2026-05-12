import {
  doc, getDoc, getDocs, updateDoc, addDoc,
  collection, query, where, orderBy, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { db, auth, uploadImage } from './config.js';
import { state } from './state.js';
import { escapeHtml, toast, setHtml, avatarHtml, timeAgo, listingCard, skeletonGrid } from './helpers.js';

// ── Public profile ───────────────────────────────────────────
export async function renderUserProfile(uid) {
  const app = document.getElementById('app');
  setHtml(app, `<div class="px-4 py-10 text-center"><div class="skeleton w-24 h-24 rounded-full mx-auto mb-4"></div><div class="skeleton h-6 w-40 rounded mx-auto"></div></div>`);

  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) { setHtml(app, `<div class="p-10 text-center text-ink-500">User not found.</div>`); return; }
    const u    = snap.data();
    const isMe = state.user?.uid === uid;

    const listingsQ  = query(collection(db, 'listings'), where('sellerId','==',uid), where('status','==','active'), orderBy('createdAt','desc'), limit(20));
    const listingsSnap = await getDocs(listingsQ);
    const listings   = listingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    setHtml(app, `
      <div class="max-w-3xl mx-auto px-4 py-6">

        <!-- Profile card -->
        <div class="bg-gradient-to-br from-scarlet-500 to-scarlet-700 rounded-3xl p-6 text-white mb-6">
          <div class="flex items-start gap-4">
            ${avatarHtml(u, 'xl')}
            <div class="flex-1 min-w-0">
              <h1 class="text-2xl font-bold mb-1">${escapeHtml(u.displayName ?? 'Anonymous')}</h1>
              <p class="text-scarlet-100 text-sm mb-3">
                ${u.schoolVerified ? 'Verified student · ' : ''}Member since ${timeAgo(u.joinedAt)}
              </p>
              <div class="flex gap-5 text-sm">
                <div><span class="font-bold text-lg">${u.rating ? u.rating.toFixed(1) : '—'}</span><span class="text-scarlet-200 text-xs ml-1">★ rating</span></div>
                <div><span class="font-bold text-lg">${u.transactionsCompleted ?? 0}</span><span class="text-scarlet-200 text-xs ml-1">sold</span></div>
                <div><span class="font-bold text-lg">${listings.length}</span><span class="text-scarlet-200 text-xs ml-1">active</span></div>
              </div>
            </div>
          </div>
          ${u.bio ? `<p class="mt-4 text-scarlet-50 text-sm leading-relaxed">${escapeHtml(u.bio)}</p>` : ''}
        </div>

        <!-- Actions -->
        ${isMe
          ? `<a href="#profile" class="block text-center bg-ink-100 hover:bg-ink-200 font-semibold py-3 rounded-full mb-6 transition">Edit profile</a>`
          : `<div class="flex gap-2 mb-6">
               <button onclick="window.messageSeller(null,'${uid}')" class="flex-1 bg-scarlet-500 hover:bg-scarlet-600 text-white font-bold py-3 rounded-full transition">Message</button>
               <button onclick="window.reportUser('${uid}')" class="px-5 bg-ink-100 hover:bg-ink-200 font-medium py-3 rounded-full text-sm transition">Report</button>
             </div>`}

        <!-- Listings -->
        <h2 class="text-xl font-bold mb-4">Active listings (${listings.length})</h2>
        ${listings.length
          ? `<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">${listings.map(listingCard).join('')}</div>`
          : `<p class="text-center py-10 text-ink-500">No active listings.</p>`}
      </div>
    `);
  } catch (e) {
    console.error(e);
    toast('Failed to load profile', 'error');
  }
}

// ── Edit profile ─────────────────────────────────────────────
export function renderEditProfile() {
  if (!state.user) { window.openAuth(); return; }
  const p   = state.profile ?? {};
  const app = document.getElementById('app');

  setHtml(app, `
    <div class="max-w-xl mx-auto px-4 py-6">
      <h1 class="text-3xl font-bold mb-6">Edit profile</h1>
      <form id="profileForm" class="space-y-5">

        <!-- Avatar -->
        <div class="flex items-center gap-4">
          <div id="avatarPreview">${avatarHtml(p, 'xl')}</div>
          <label class="bg-ink-100 hover:bg-ink-200 px-4 py-2.5 rounded-full text-sm font-semibold cursor-pointer transition">
            Change photo
            <input type="file" accept="image/*" id="avatarInput" class="sr-only">
          </label>
        </div>

        <!-- Name -->
        <div>
          <label class="block text-sm font-bold mb-1">Display name</label>
          <input name="displayName" required value="${escapeHtml(p.displayName ?? '')}"
            class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none">
        </div>

        <!-- Phone -->
        <div>
          <label class="block text-sm font-bold mb-1">Phone number</label>
          <p class="text-xs text-ink-400 mb-2">Shown only to people you're in conversation with.</p>
          <input name="phone" type="tel" value="${escapeHtml(p.phone ?? '')}" placeholder="+1 (555) 000-0000"
            class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none">
        </div>

        <!-- Bio -->
        <div>
          <label class="block text-sm font-bold mb-1">Bio</label>
          <textarea name="bio" rows="3" maxlength="200" placeholder="Year, major, what you sell…"
            class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none resize-none">${escapeHtml(p.bio ?? '')}</textarea>
        </div>

        <!-- School email -->
        <div>
          <label class="block text-sm font-bold mb-1">
            School email
            ${p.schoolVerified ? '<span class="text-emerald-600 text-xs font-medium">✓ Verified</span>' : ''}
          </label>
          <input name="schoolEmail" type="email" value="${escapeHtml(p.schoolEmail ?? '')}" placeholder="you@yourschool.edu"
            class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none">
          <p class="text-xs text-ink-400 mt-1">A .edu email earns you a "Verified student" badge.</p>
        </div>

        <button type="submit" id="saveBtn"
          class="w-full bg-scarlet-500 hover:bg-scarlet-600 text-white font-bold py-3.5 rounded-full transition disabled:opacity-50">
          Save changes
        </button>
        <button type="button" onclick="window.doSignOut()"
          class="w-full text-scarlet-500 hover:bg-scarlet-50 font-medium py-2.5 rounded-full text-sm transition">
          Sign out
        </button>
      </form>
    </div>
  `);

  // Avatar upload
  let newPhotoUrl = null;
  document.getElementById('avatarInput').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    const btn = document.getElementById('saveBtn');
    btn.disabled = true; btn.textContent = 'Uploading photo…';
    try {
      newPhotoUrl = await uploadImage(f);
      document.getElementById('avatarPreview').innerHTML = avatarHtml({ photoURL: newPhotoUrl }, 'xl');
    } catch (err) { toast(err.message, 'error'); }
    btn.disabled = false; btn.textContent = 'Save changes';
  });

  // Save
  document.getElementById('profileForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('saveBtn');
    btn.disabled = true; btn.textContent = 'Saving…';

    const fd   = new FormData(e.target);
    const data = {
      displayName:  fd.get('displayName').trim(),
      phone:        fd.get('phone').trim(),
      bio:          fd.get('bio').trim(),
      schoolEmail:  fd.get('schoolEmail').trim()
    };
    if (newPhotoUrl) data.photoURL = newPhotoUrl;

    try {
      await updateDoc(doc(db, 'users', state.user.uid), data);
      const authUpdate = { displayName: data.displayName };
      if (newPhotoUrl) authUpdate.photoURL = newPhotoUrl;
      await updateProfile(auth.currentUser, authUpdate);
      Object.assign(state.profile, data);
      window.refreshAvatar?.();
      toast('Profile saved!', 'success');
      window.navigate(`#user/${state.user.uid}`);
    } catch (err) {
      console.error(err);
      toast('Failed to save', 'error');
      btn.disabled = false; btn.textContent = 'Save changes';
    }
  });
}

// ── Report user ──────────────────────────────────────────────
export async function reportUser(uid) {
  if (!state.user) { window.openAuth(); return; }
  const reason = prompt('Why are you reporting this user?');
  if (!reason) return;
  try {
    await addDoc(collection(db, 'reports'), {
      type: 'user', reporterId: state.user.uid, reportedId: uid, reason,
      createdAt: serverTimestamp()
    });
    toast('Report submitted. Thank you.', 'success');
  } catch (e) { toast('Failed to submit report', 'error'); }
}
window.reportUser = reportUser;
