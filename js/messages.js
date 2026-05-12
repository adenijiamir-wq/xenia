import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from './config.js';
import { state } from './state.js';
import { escapeHtml, toast, setHtml, avatarHtml, timeAgo } from './helpers.js';

// ── Inbox ────────────────────────────────────────────────────
export function renderMessages() {
  const app = document.getElementById('app');
  setHtml(app, `
    <div class="max-w-3xl mx-auto px-4 py-6">
      <h1 class="text-3xl font-bold mb-5">Messages</h1>
      <div id="convList"></div>
    </div>
  `);

  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', state.user.uid),
    orderBy('lastMessageAt', 'desc')
  );

  const unsub = onSnapshot(q, snap => {
    const list = document.getElementById('convList');
    if (!list) return;
    const convs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (!convs.length) {
      list.innerHTML = `<div class="text-center py-16 text-ink-500">
        <p class="mb-2">No conversations yet.</p>
        <p class="text-sm">Browse listings and message a seller to get started.</p>
      </div>`;
      return;
    }

    list.innerHTML = convs.map(c => {
      const otherId = c.participants.find(p => p !== state.user.uid);
      const other   = c.participantInfo?.[otherId] ?? {};
      const unread  = c.unread?.[state.user.uid] ?? 0;

      return `
        <a href="#messages/${c.id}" class="flex items-center gap-3 p-3 hover:bg-ink-50 rounded-2xl transition border-b border-ink-100 last:border-0">
          ${avatarHtml(other, 'md')}
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-baseline gap-2">
              <p class="font-semibold truncate">${escapeHtml(other.displayName ?? 'Unknown')}</p>
              <span class="text-xs text-ink-400 shrink-0">${timeAgo(c.lastMessageAt)}</span>
            </div>
            ${c.listingTitle ? `<p class="text-xs text-ink-400 truncate">${escapeHtml(c.listingTitle)}</p>` : ''}
            <p class="text-sm truncate ${unread > 0 ? 'font-semibold text-ink-900' : 'text-ink-500'}">
              ${escapeHtml(c.lastMessage || 'Start the conversation')}
            </p>
          </div>
          ${unread > 0 ? `<span class="bg-scarlet-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shrink-0">${unread}</span>` : ''}
        </a>`;
    }).join('');
  });

  state.unsubscribes.push(unsub);
}

// ── Conversation ─────────────────────────────────────────────
export async function renderConversation(convId) {
  const app = document.getElementById('app');

  const convSnap = await getDoc(doc(db, 'conversations', convId));
  if (!convSnap.exists() || !convSnap.data().participants.includes(state.user.uid)) {
    setHtml(app, `<div class="p-10 text-center text-ink-500">Conversation not found.</div>`);
    return;
  }

  const conv    = convSnap.data();
  const otherId = conv.participants.find(p => p !== state.user.uid);
  const other   = conv.participantInfo?.[otherId] ?? {};

  setHtml(app, `
    <div class="max-w-2xl mx-auto flex flex-col" style="height:calc(100vh - 120px)">

      <!-- Header -->
      <div class="px-4 py-3 border-b border-ink-200 shrink-0">
        <div class="flex items-center gap-3">
          <a href="#messages" class="p-1.5 hover:bg-ink-100 rounded-full transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </a>
          <a href="#user/${otherId}" class="flex items-center gap-2 flex-1 min-w-0 hover:bg-ink-50 rounded-xl p-1 -m-1 transition">
            ${avatarHtml(other, 'sm')}
            <div class="min-w-0">
              <p class="font-semibold text-sm truncate">${escapeHtml(other.displayName ?? 'Unknown')}</p>
              ${conv.listingTitle ? `<p class="text-xs text-ink-500 truncate">About: ${escapeHtml(conv.listingTitle)}</p>` : ''}
            </div>
          </a>
        </div>

        <!-- Safety banner -->
        <div class="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
          <strong>Safe meetup tip:</strong> Meet in public campus spots — library, dining hall, student center. Inspect the item before paying.
        </div>
      </div>

      <!-- Messages -->
      <div id="msgThread" class="flex-1 overflow-y-auto px-4 py-3 space-y-2"></div>

      <!-- Input -->
      <div class="px-4 py-3 border-t border-ink-200 shrink-0">
        <form id="msgForm" class="flex gap-2 items-center">
          <input id="msgInput" type="text" placeholder="Type a message…" autocomplete="off"
            class="flex-1 bg-ink-100 rounded-full px-4 py-2.5 placeholder-ink-400 border-0 outline-none focus:ring-2 focus:ring-scarlet-200 focus:bg-white">
          <button type="submit"
            class="bg-scarlet-500 hover:bg-scarlet-600 text-white rounded-full w-10 h-10 flex items-center justify-center shrink-0 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-4-4l4 4-4 4"/></svg>
          </button>
        </form>
      </div>
    </div>
  `);

  // Clear unread
  try {
    const upd = {};
    upd[`unread.${state.user.uid}`] = 0;
    await updateDoc(doc(db, 'conversations', convId), upd);
  } catch(e) {}

  // Real-time messages
  const msgQ  = query(collection(db, 'conversations', convId, 'messages'), orderBy('timestamp', 'asc'));
  const unsub = onSnapshot(msgQ, snap => {
    const thread = document.getElementById('msgThread');
    if (!thread) return;
    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    thread.innerHTML = msgs.map(m => {
      const mine = m.senderId === state.user.uid;
      return `
        <div class="flex ${mine ? 'justify-end' : 'justify-start'}">
          <div class="${mine ? 'bubble-out' : 'bubble-in'} px-3.5 py-2 max-w-[75%]">
            <p class="whitespace-pre-wrap break-words text-sm leading-relaxed">${escapeHtml(m.text)}</p>
            <p class="text-[10px] mt-0.5 text-right ${mine ? 'text-scarlet-200' : 'text-ink-400'}">${timeAgo(m.timestamp)}</p>
          </div>
        </div>`;
    }).join('');
    thread.scrollTop = thread.scrollHeight;
  });
  state.unsubscribes.push(unsub);

  // Send
  document.getElementById('msgForm').addEventListener('submit', async e => {
    e.preventDefault();
    const input = document.getElementById('msgInput');
    const text  = input.value.trim();
    if (!text) return;
    input.value = '';
    try {
      await addDoc(collection(db, 'conversations', convId, 'messages'), {
        senderId: state.user.uid,
        text,
        timestamp: serverTimestamp()
      });
      const upd = { lastMessage: text, lastMessageAt: serverTimestamp() };
      upd[`unread.${otherId}`] = increment(1);
      await updateDoc(doc(db, 'conversations', convId), upd);
    } catch (err) {
      console.error(err);
      toast('Failed to send message', 'error');
    }
  });
}

// ── Start / find conversation ────────────────────────────────
export async function messageSeller(listingId, sellerId) {
  if (!state.user) { window.openAuth(); return; }
  if (state.user.uid === sellerId) { toast("You can't message yourself"); return; }

  let listingTitle = '';
  if (listingId) {
    try {
      const ls = await getDoc(doc(db, 'listings', listingId));
      if (ls.exists()) listingTitle = ls.data().title;
    } catch(e) {}
  }

  // Look for existing conversation for this pair + listing
  const q    = query(collection(db, 'conversations'), where('participants','array-contains', state.user.uid));
  const snap = await getDocs(q);
  let existing = null;
  snap.forEach(d => {
    const data = d.data();
    if (data.participants.includes(sellerId) && data.listingId === (listingId ?? null)) {
      existing = { id: d.id, ...data };
    }
  });

  if (existing) { window.navigate(`#messages/${existing.id}`); return; }

  // Create new conversation
  const sellerSnap = await getDoc(doc(db, 'users', sellerId));
  const seller     = sellerSnap.exists() ? sellerSnap.data() : {};

  const conv = {
    participants: [state.user.uid, sellerId],
    participantInfo: {
      [state.user.uid]: { uid: state.user.uid, displayName: state.profile.displayName, photoURL: state.profile.photoURL ?? null },
      [sellerId]:       { uid: sellerId,        displayName: seller.displayName ?? 'User', photoURL: seller.photoURL ?? null }
    },
    listingId:     listingId ?? null,
    listingTitle,
    lastMessage:   '',
    lastMessageAt: serverTimestamp(),
    unread: { [state.user.uid]: 0, [sellerId]: 0 }
  };

  const ref = await addDoc(collection(db, 'conversations'), conv);
  window.navigate(`#messages/${ref.id}`);
}
window.messageSeller = messageSeller;
