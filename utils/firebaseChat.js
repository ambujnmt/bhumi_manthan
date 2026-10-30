// Chat directly on Cloud Firestore (messages are not saved in our MySQL)
//
// .env: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID
// (Firebase console -> Project settings -> Your apps -> Web app config)
//
// chats/{chatId}                -> members, users, property, last_message, last_message_at, unread {uid: n}
// chats/{chatId}/messages/{id}  -> sender_id, sender_uid, message, created_at
// Chat documents are created by Laravel (POST /api/chat/conversations), messages are written here.
import { getChatFirebaseToken } from "./chatApi";

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

export const MESSAGES_PAGE_SIZE = 30;

let connecting = null;

export const isFirebaseChatConfigured = () => Boolean(API_KEY && PROJECT_ID);

/**
 * Login to Firebase with token from Laravel (once per page load)
 * -> { db, uid, myId, fs }  (fs = firebase/firestore module)
 */
export const connectFirebaseChat = () => {
  if (!isFirebaseChatConfigured()) {
    return Promise.reject(new Error("Chat is not configured. Add Firebase settings in .env."));
  }

  if (!connecting) {
    connecting = (async () => {
      const [{ initializeApp, getApps }, authModule, fs, tokenRes] = await Promise.all([
        import("firebase/app"),
        import("firebase/auth"),
        import("firebase/firestore"),
        getChatFirebaseToken(),
      ]);

      const { token, uid, user_id: myId } = tokenRes.data;

      const app =
        getApps().find((item) => item.name === "chat") ||
        initializeApp(
          {
            apiKey: API_KEY,
            projectId: PROJECT_ID,
            authDomain: `${PROJECT_ID}.firebaseapp.com`,
          },
          "chat"
        );

      const auth = authModule.getAuth(app);

      if (auth.currentUser?.uid !== uid) {
        await authModule.signInWithCustomToken(auth, token);
      }

      return { db: fs.getFirestore(app), uid, myId, fs };
    })().catch((error) => {
      // allow retry on next page open
      connecting = null;
      throw error;
    });
  }

  return connecting;
};

// Logout -> next login gets a fresh Firebase user
export const resetFirebaseChat = async () => {
  if (!connecting) return;

  try {
    const [{ getApps }, { getAuth, signOut }] = await Promise.all([import("firebase/app"), import("firebase/auth")]);
    const app = getApps().find((item) => item.name === "chat");

    if (app) await signOut(getAuth(app));
  } catch {
    // ignore
  } finally {
    connecting = null;
  }
};

const toIso = (value) => (value?.toDate ? value.toDate().toISOString() : value || null);

// chats/{id} -> conversation (same shape as /api/chat/conversations)
const toConversation = (snapshot, uid) => {
  const data = snapshot.data({ serverTimestamps: "estimate" });
  const otherUid = (data.members || []).find((member) => member !== uid);

  return {
    id: snapshot.id,
    other_uid: otherUid,
    other_user: data.users?.[otherUid] || null,
    property: data.property || null,
    last_message: data.last_message || null,
    last_sender_id: data.last_sender_id ?? null,
    last_message_at: toIso(data.last_message_at),
    unread: data.unread?.[uid] || 0,
    // my last N messages the other person hasn't opened yet (read ticks)
    other_unread: data.unread?.[otherUid] || 0,
    created_at: toIso(data.created_at),
  };
};

const toMessage = (snapshot, uid) => {
  const data = snapshot.data({ serverTimestamps: "estimate" });

  return {
    id: snapshot.id,
    sender_id: data.sender_id,
    is_mine: data.sender_uid === uid,
    message: data.message,
    created_at: toIso(data.created_at),
  };
};

/**
 * My chats live, newest first -> callback(conversations)
 */
export const subscribeChats = ({ db, uid, fs }, callback, onError) =>
  fs.onSnapshot(
    fs.query(fs.collection(db, "chats"), fs.where("members", "array-contains", uid)),
    (snapshot) => {
      const list = snapshot.docs.map((item) => toConversation(item, uid));

      list.sort((a, b) =>
        String(b.last_message_at || b.created_at || "").localeCompare(String(a.last_message_at || a.created_at || ""))
      );

      callback(list);
    },
    onError
  );

/**
 * Newest messages of a chat live -> callback(messages old -> new, oldestSnapshot, hasMore)
 */
export const subscribeMessages = ({ db, uid, fs }, chatId, callback, onError) =>
  fs.onSnapshot(
    fs.query(
      fs.collection(db, "chats", chatId, "messages"),
      fs.orderBy("created_at", "desc"),
      fs.limit(MESSAGES_PAGE_SIZE)
    ),
    (snapshot) => {
      const docs = snapshot.docs;

      callback(
        docs.map((item) => toMessage(item, uid)).reverse(),
        docs[docs.length - 1] || null,
        docs.length >= MESSAGES_PAGE_SIZE
      );
    },
    onError
  );

/**
 * Older page before oldestSnapshot -> { messages (old -> new), oldest, hasMore }
 */
export const getOlderMessages = async ({ db, uid, fs }, chatId, oldestSnapshot) => {
  const snapshot = await fs.getDocs(
    fs.query(
      fs.collection(db, "chats", chatId, "messages"),
      fs.orderBy("created_at", "desc"),
      fs.startAfter(oldestSnapshot),
      fs.limit(MESSAGES_PAGE_SIZE)
    )
  );
  const docs = snapshot.docs;

  return {
    messages: docs.map((item) => toMessage(item, uid)).reverse(),
    oldest: docs[docs.length - 1] || oldestSnapshot,
    hasMore: docs.length >= MESSAGES_PAGE_SIZE,
  };
};

/**
 * Message + chat last message / receiver's unread + 1 in one write
 */
export const sendFirebaseMessage = async ({ db, uid, myId, fs }, conversation, text) => {
  const chatRef = fs.doc(db, "chats", conversation.id);
  const batch = fs.writeBatch(db);

  batch.set(fs.doc(fs.collection(chatRef, "messages")), {
    sender_id: myId,
    sender_uid: uid,
    message: text,
    created_at: fs.serverTimestamp(),
  });

  batch.update(chatRef, {
    last_message: text,
    last_sender_id: myId,
    last_message_at: fs.serverTimestamp(),
    [`unread.${conversation.other_uid}`]: fs.increment(1),
  });

  await batch.commit();
};

export const markFirebaseChatRead = ({ db, uid, fs }, chatId) =>
  fs.updateDoc(fs.doc(db, "chats", chatId), { [`unread.${uid}`]: 0 });

/**
 * Total unread (menu / tab badge) live -> returns unsubscribe
 */
export const subscribeChatUnread = (callback) => {
  let stopped = false;
  let unsubscribe = () => {};

  connectFirebaseChat()
    .then((connection) => {
      if (stopped) return;

      unsubscribe = subscribeChats(connection, (list) =>
        callback(list.reduce((sum, item) => sum + (item.unread || 0), 0))
      );
    })
    .catch(() => {});

  return () => {
    stopped = true;
    unsubscribe();
  };
};
