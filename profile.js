import {
  ref, get, update, push, set
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { updateProfile as updateAuthProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { rtdb, auth, uploadImage } from './config.js';
import { state } from './state.js';
import { escapeHtml, toast, setHtml, avatarHtml, timeAgo, listingCard, skeletonGrid } from './helpers.js';

// ── Public profile ───────────────────────────────────────────
export async function renderUserProfile(uid) {
  const app = document.getElementById('app');
  setHtml(app, `<div class="px-4 py-10 text-center"><div class="skeleton w-24 h-24 rounded-full mx-auto mb-4"></div></div>`);

  try {
    const snap = await get(ref(rtdb, `users/${uid}`));
    if (!snap.exists()) { setHtml(app, `<div class="p-10 text-center text-ink-500">User not found.</div>`); return; }
    const u    = snap.val();
    const isMe = state.user?.uid === uid;

    // Fetch their listings
    const allListSnap = await get(ref(rtdb, 'listings'));
    const listings = [];
    if (allListSnap.exists()) {
      allListSnap.forEach(child => {
        const l = child.val();
        if (l.sellerId === uid && l.status === 'active') listings.push({ id: child.key, ...l });
      });
    }
    listings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // Fetch reviews for this user
    const allReviewsSnap = await get(ref(rtdb, 'reviews'));
    const reviews = [];
    if (allReviewsSnap.exists()) {
      allReviewsSnap.forEach(child => {
        const r = child.val();
        if (r.reviewedId === uid) reviews.push({ id: child.key, ...r });
      });
    }
    reviews.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    setHtml(app, `
      <div class="max-w-3xl mx-auto px-4 py-6">
        <div class="bg-gradient-to-br from-scarlet-500 to-scarlet-700 rounded-3xl p-6 text-white mb-6">
          <div class="flex items-start gap-4">
            ${avatarHtml(u, 'xl')}
            <div class="flex-1 min-w-0">
              <h1 class="text-2xl font-bold mb-1">${escapeHtml(u.displayName ?? 'Anonymous')}</h1>
              <p class="text-scarlet-100 text-sm mb-3">${u.schoolVerified ? 'Verified · ' : ''}Member since ${timeAgo(u.joinedAt)}</p>
              <div class="flex gap-5 text-sm">
                <div><span class="font-bold text-lg">${u.rating ? u.rating.toFixed(1) : '—'}</span><span class="text-scarlet-200 text-xs ml-1">rating</span></div>
                <div><span class="font-bold text-lg">${u.transactionsCompleted ?? 0}</span><span class="text-scarlet-200 text-xs ml-1">sold</span></div>
                <div><span class="font-bold text-lg">${listings.length}</span><span class="text-scarlet-200 text-xs ml-1">active</span></div>
              </div>
            </div>
          </div>
          ${u.bio ? `<p class="mt-4 text-scarlet-50 text-sm leading-relaxed">${escapeHtml(u.bio)}</p>` : ''}
        </div>

        ${isMe
          ? `<a href="#profile" class="block text-center bg-ink-100 hover:bg-ink-200 font-semibold py-3 rounded-full mb-6 transition">Edit profile</a>`
          : `<div class="flex gap-2 mb-6">
               <button onclick="window.messageSeller(null,'${uid}')" class="flex-1 bg-scarlet-500 hover:bg-scarlet-600 text-white font-bold py-3 rounded-full transition">Message</button>
               <button onclick="window.reportUser('${uid}')" class="px-5 bg-ink-100 hover:bg-ink-200 font-medium py-3 rounded-full text-sm transition">Report</button>
             </div>`}

        <h2 class="text-xl font-bold mb-4">Active listings (${listings.length})</h2>
        ${listings.length
          ? `<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">${listings.map(listingCard).join('')}</div>`
          : `<p class="text-center py-10 text-ink-500">No active listings.</p>`}

        <h2 class="text-xl font-bold mt-8 mb-4">Reviews (${reviews.length})</h2>
        ${reviews.length
          ? `<div class="space-y-3">${reviews.map(r => `
              <div class="bg-ink-50 rounded-2xl p-4">
                <div class="flex items-center gap-3 mb-2">
                  ${avatarHtml({ photoURL: r.reviewerPhoto, displayName: r.reviewerName, uid: r.reviewerId }, 'sm')}
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-sm">${escapeHtml(r.reviewerName || 'Anonymous')}</p>
                    <p class="text-xs text-ink-400">${timeAgo(r.createdAt)}</p>
                  </div>
                  <div class="text-amber-400 text-sm">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
                </div>
                ${r.comment ? `<p class="text-sm text-ink-700">${escapeHtml(r.comment)}</p>` : ''}
              </div>
            `).join('')}</div>`
          : `<p class="text-center py-8 text-ink-500">No reviews yet.</p>`}
      </div>
    `);
  } catch (e) { console.error(e); toast('Failed to load profile', 'error'); }
}

// ── Edit profile ─────────────────────────────────────────────
export function renderEditProfile() {
  if (!state.user) { window.openAuth(); return; }
  const p = state.profile ?? {};
  const app = document.getElementById('app');

  setHtml(app, `
    <div class="max-w-xl mx-auto px-4 py-6">
      <h1 class="text-3xl font-bold mb-6">Edit profile</h1>
      <form id="profileForm" class="space-y-5">
        <div class="flex items-center gap-4">
          <div id="avatarPreview">${avatarHtml(p, 'xl')}</div>
          <label class="bg-ink-100 hover:bg-ink-200 px-4 py-2.5 rounded-full text-sm font-semibold cursor-pointer transition">
            Change photo
            <input type="file" accept="image/*" id="avatarInput" class="sr-only">
          </label>
        </div>
        <div>
          <label class="block text-sm font-bold mb-1">Display name</label>
          <input name="displayName" required value="${escapeHtml(p.displayName ?? '')}"
            class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none">
        </div>
        <div>
          <label class="block text-sm font-bold mb-1">Phone number</label>
          <p class="text-xs text-ink-400 mb-2">Shown only to people you're in conversation with.</p>
          <input name="phone" type="tel" value="${escapeHtml(p.phone ?? '')}" placeholder="+1 (555) 000-0000"
            class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none">
        </div>
        <div>
          <label class="block text-sm font-bold mb-1">Bio</label>
          <textarea name="bio" rows="3" maxlength="200" placeholder="What you do, what you sell..."
            class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none resize-none">${escapeHtml(p.bio ?? '')}</textarea>
        </div>
        <div>
          <label class="block text-sm font-bold mb-1">
            School email ${p.schoolVerified ? '<span class="text-emerald-600 text-xs font-medium">Verified</span>' : ''}
          </label>
          <input name="schoolEmail" type="email" value="${escapeHtml(p.schoolEmail ?? '')}" placeholder="you@yourschool.edu"
            class="w-full bg-ink-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-scarlet-200 focus:bg-white outline-none">
          <p class="text-xs text-ink-400 mt-1">A .edu email earns a "Verified" badge.</p>
        </div>
        <button type="submit" id="saveBtn" class="w-full bg-scarlet-500 hover:bg-scarlet-600 text-white font-bold py-3.5 rounded-full transition disabled:opacity-50">Save changes</button>
        <button type="button" onclick="window.doSignOut()" class="w-full text-scarlet-500 hover:bg-scarlet-50 font-medium py-2.5 rounded-full text-sm transition">Sign out</button>
      </form>
    </div>
  `);

  let newPhotoUrl = null;
  document.getElementById('avatarInput').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    const btn = document.getElementById('saveBtn');
    btn.disabled = true; btn.textContent = 'Uploading photo...';
    try {
      newPhotoUrl = await uploadImage(f);
      document.getElementById('avatarPreview').innerHTML = avatarHtml({ photoURL: newPhotoUrl }, 'xl');
    } catch (err) { toast(err.message, 'error'); }
    btn.disabled = false; btn.textContent = 'Save changes';
  });

  document.getElementById('profileForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('saveBtn');
    btn.disabled = true; btn.textContent = 'Saving...';
    const fd = new FormData(e.target);
    const data = {
      displayName: fd.get('displayName').trim(),
      phone:       fd.get('phone').trim(),
      bio:         fd.get('bio').trim(),
      schoolEmail: fd.get('schoolEmail').trim()
    };
    if (newPhotoUrl) data.photoURL = newPhotoUrl;
    try {
      await update(ref(rtdb, `users/${state.user.uid}`), data);
      const authUpdate = { displayName: data.displayName };
      if (newPhotoUrl) authUpdate.photoURL = newPhotoUrl;
      await updateAuthProfile(auth.currentUser, authUpdate);
      Object.assign(state.profile, data);
      window.refreshAvatar?.();
      toast('Profile saved!', 'success');
      window.navigate(`#user/${state.user.uid}`);
    } catch (err) { console.error(err); toast('Failed to save', 'error'); btn.disabled = false; btn.textContent = 'Save changes'; }
  });
}

// ── Report user ──────────────────────────────────────────────
export async function reportUser(uid) {
  if (!state.user) { window.openAuth(); return; }
  const reason = prompt('Why are you reporting this user?');
  if (!reason) return;
  const r = push(ref(rtdb, 'reports'));
  await set(r, { type: 'user', reporterId: state.user.uid, reportedId: uid, reason, createdAt: Date.now() });
  toast('Report submitted.', 'success');
}
window.reportUser = reportUser;
