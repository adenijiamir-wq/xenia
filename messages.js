import {
  ref, get, set, push, update, onValue
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

import { rtdb, sendNotificationEmail } from './config.js';
import { state } from './state.js';
import { escapeHtml, toast, setHtml, avatarHtml, timeAgo } from './helpers.js';

// ── Inbox ────────────────────────────────────────────────────
export async function renderMessages() {
  const app = document.getElementById('app');
  setHtml(app, `
    <div class="max-w-3xl mx-auto px-4 py-6">
      <h1 class="text-3xl font-bold mb-5">Messages</h1>
      <div id="convList"><div class="text-center py-10 text-ink-400">Loading...</div></div>
    </div>
  `);

  const userConvsRef = ref(rtdb, `userConversations/${state.user.uid}`);
  const unsub = onValue(userConvsRef, async snap => {
    const list = document.getElementById('convList');
    if (!list) return;

    if (!snap.exists()) {
      list.innerHTML = `<div class="text-center py-16 text-ink-500"><p class="mb-2">No conversations yet.</p><p class="text-sm">Browse listings and message a seller to get started.</p></div>`;
      return;
    }

    const convIds = Object.keys(snap.val());
    const convs = [];
    for (const cid of convIds) {
      const cs = await get(ref(rtdb, `conversations/${cid}`));
      if (cs.exists()) convs.push({ id: cid, ...cs.val() });
    }
    convs.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));

    if (!convs.length) {
      list.innerHTML = `<div class="text-center py-16 text-ink-500"><p>No conversations yet.</p></div>`;
      return;
    }

    list.innerHTML = convs.map(c => {
      const otherId = Object.keys(c.participants || {}).find(p => p !== state.user.uid);
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

  const convSnap = await get(ref(rtdb, `conversations/${convId}`));
  if (!convSnap.exists()) {
    setHtml(app, `<div class="p-10 text-center text-ink-500">Conversation not found.</div>`);
    return;
  }
  const conv = convSnap.val();
  const participants = conv.participants || {};
  if (!participants[state.user.uid]) {
    setHtml(app, `<div class="p-10 text-center text-ink-500">Access denied.</div>`);
    return;
  }

  const otherId = Object.keys(participants).find(p => p !== state.user.uid);
  const other   = conv.participantInfo?.[otherId] ?? {};

  // Fetch other user's phone for contact info
  const otherFullSnap = await get(ref(rtdb, `users/${otherId}`));
  if (otherFullSnap.exists()) other.phone = otherFullSnap.val().phone || '';

  setHtml(app, `
    <div class="max-w-2xl mx-auto flex flex-col" style="height:calc(100vh - 120px)">
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
        <div class="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
          <strong>Safe meetup tip:</strong> Meet in public spots. Inspect the item before paying.
          ${other.phone ? `<span class="ml-2">· <a href="tel:${escapeHtml(other.phone)}" class="font-semibold underline">${escapeHtml(other.phone)}</a></span>` : ''}
        </div>
      </div>

      <div id="msgThread" class="flex-1 overflow-y-auto px-4 py-3 space-y-2"></div>

      <div class="px-4 py-3 border-t border-ink-200 shrink-0">
        <form id="msgForm" class="flex gap-2 items-center">
          <input id="msgInput" type="text" placeholder="Type a message..." autocomplete="off"
            class="flex-1 bg-ink-100 rounded-full px-4 py-2.5 placeholder-ink-400 border-0 outline-none focus:ring-2 focus:ring-scarlet-200 focus:bg-white">
          <button type="submit" class="bg-scarlet-500 hover:bg-scarlet-600 text-white rounded-full w-10 h-10 flex items-center justify-center shrink-0 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-4-4l4 4-4 4"/></svg>
          </button>
        </form>
      </div>
    </div>
  `);

  // Clear unread for the current user
  try { await update(ref(rtdb, `conversations/${convId}/unread`), { [state.user.uid]: 0 }); } catch(e) {}

  // Shared render function
  const drawMessages = (msgs) => {
    const thread = document.getElementById('msgThread');
    if (!thread) return;
    msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
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
  };

  // Real-time listener
  const msgsRef = ref(rtdb, `messages/${convId}`);
  const unsubMsg = onValue(msgsRef, snap => {
    const msgs = [];
    if (snap.exists()) {
      snap.forEach(child => msgs.push({ id: child.key, ...child.val() }));
    }
    drawMessages(msgs);
  });
  state.unsubscribes.push(unsubMsg);

  // Send message handler (with manual refresh fallback)
  document.getElementById('msgForm').addEventListener('submit', async e => {
    e.preventDefault();
    const input = document.getElementById('msgInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    try {
      // Save the message
      const msgRef = push(ref(rtdb, `messages/${convId}`));
      await set(msgRef, { senderId: state.user.uid, text, timestamp: Date.now() });

      // Update conversation metadata
      const currentUnread = (await get(ref(rtdb, `conversations/${convId}/unread/${otherId}`))).val() || 0;
      await update(ref(rtdb, `conversations/${convId}`), {
        lastMessage: text,
        lastMessageAt: Date.now(),
        [`unread/${otherId}`]: currentUnread + 1
      });

      // MANUAL REFRESH — guarantees UI updates even if listener has issues
      const allMsgsSnap = await get(msgsRef);
      const allMsgs = [];
      if (allMsgsSnap.exists()) {
        allMsgsSnap.forEach(child => allMsgs.push({ id: child.key, ...child.val() }));
      }
      drawMessages(allMsgs);

      // NOTE: No email sent here — emails only fire ONCE per conversation
      // (when conversation is first created in messageSeller)
    } catch (err) {
      console.error('[Xenia] Failed to send message:', err);
      toast('Failed to send', 'error');
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
      const ls = await get(ref(rtdb, `listings/${listingId}`));
      if (ls.exists()) listingTitle = ls.val().title;
    } catch(e) {}
  }

  // Look for existing conversation between same two users about same listing
  const myConvsSnap = await get(ref(rtdb, `userConversations/${state.user.uid}`));
  if (myConvsSnap.exists()) {
    const convIds = Object.keys(myConvsSnap.val());
    for (const cid of convIds) {
      const cs = await get(ref(rtdb, `conversations/${cid}`));
      if (cs.exists()) {
        const data = cs.val();
        if (data.participants?.[sellerId] && data.listingId === (listingId ?? null)) {
          // Existing conversation — just open it, NO email
          window.navigate(`#messages/${cid}`);
          return;
        }
      }
    }
  }

  // Create NEW conversation
  const sellerSnap = await get(ref(rtdb, `users/${sellerId}`));
  const seller = sellerSnap.exists() ? sellerSnap.val() : {};

  const convRef = push(ref(rtdb, 'conversations'));
  const convId = convRef.key;
  const conv = {
    participants: { [state.user.uid]: true, [sellerId]: true },
    participantInfo: {
      [state.user.uid]: { uid: state.user.uid, displayName: state.profile.displayName, photoURL: state.profile.photoURL ?? null },
      [sellerId]: { uid: sellerId, displayName: seller.displayName ?? 'User', photoURL: seller.photoURL ?? null }
    },
    listingId: listingId ?? null,
    listingTitle,
    lastMessage: '',
    lastMessageAt: Date.now(),
    unread: { [state.user.uid]: 0, [sellerId]: 0 }
  };

  await set(convRef, conv);
  await set(ref(rtdb, `userConversations/${state.user.uid}/${convId}`), true);
  await set(ref(rtdb, `userConversations/${sellerId}/${convId}`), true);

  // ONE-TIME email to seller — only when conversation is first created
  if (seller.email) {
    sendNotificationEmail(
      seller.email,
      seller.displayName,
      state.profile.displayName,
      `Someone is interested in your listing "${listingTitle}". Open Xenia to chat with them and close the deal.`,
      listingTitle
    );
  }

  toast('Conversation started!', 'success');
  window.navigate(`#messages/${convId}`);
}
window.messageSeller = messageSeller;
