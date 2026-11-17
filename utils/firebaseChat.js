// Chat directly on Cloud Firestore (messages are not saved in our MySQL)
// Same documents as the mobile app, so a chat continues on both.
//
// .env: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID
// (Firebase console -> Project settings -> Your apps -> Web app config)
//
// chats/chat_{propertyId}_{userId}_{agent/seller/adminId}
//   users ["32", "2"], user {id, name, role}, other_user {id, name, role}, property {id, title},
//   last_message, last_message_sender_id, last_message_at
//   (ids are strings; propertyId 0 = chat without a property)
//   hidden_{uid}, cleared_at_{uid}: set by Laravel when {uid} deletes the chat on the website
// chats/{chatId}/messages/{id} -> sender_id, message, isSeen, created_at
//
// A new chat document is written together with its first message, like the app does.
// Laravel (POST /api/chat/conversations) decides who can chat and gives its fields.
import { getChatFirebaseToken } from "./chatApi";

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

export const MESSAGES_PAGE_SIZE = 30;

// Firestore allows max 500 writes in one batch
const BATCH_LIMIT = 500;

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

const toNumberId = (value) => (value === null || value === undefined || value === "" ? null : Number(value));

// Firestore has users.role (super_admin ...), the chat screen shows admin / broker / seller / customer
const toChatUser = (person) =>
  person
    ? {
        id: toNumberId(person.id),
        name: person.name,
        role: ["super_admin", "staff"].includes(person.role) ? "admin" : person.role,
      }
    : null;

// chats/{id} -> conversation (same shape as /api/chat/conversations)
const toConversation = (snapshot, uid, myId) => {
  const data = snapshot.data({ serverTimestamps: "estimate" });

  // user / other_user are fixed in the document, so either one can be me
  const other = String(data.user?.id) === String(myId) ? data.other_user : data.user;

  // I deleted this chat: anything up to cleared_at is gone for me
  const clearedAt = data[`cleared_at_${uid}`] || null;
  const lastMessageAt = toIso(data.last_message_at);
  const hasNewMessage = !clearedAt || (lastMessageAt && Date.parse(lastMessageAt) > Date.parse(clearedAt));

  return {
    id: snapshot.id,
    other_user: toChatUser(other),
    property: data.property && String(data.property.id) !== "0" ? data.property : null,
    last_message: hasNewMessage ? data.last_message || null : null,
    last_sender_id: hasNewMessage ? toNumberId(data.last_message_sender_id) : null,
    last_message_at: hasNewMessage ? lastMessageAt : null,
    cleared_at: clearedAt,
    hidden: Boolean(data[`hidden_${uid}`]) && !hasNewMessage,
  };
};

const toMessage = (snapshot, myId) => {
  const data = snapshot.data({ serverTimestamps: "estimate" });

  return {
    id: snapshot.id,
    sender_id: toNumberId(data.sender_id),
    is_mine: String(data.sender_id) === String(myId),
    message: data.message,
    created_at: toIso(data.created_at),
  };
};

/**
 * My chats live, newest first -> callback(conversations)
 * Unread counts come from each chat's messages with isSeen = false (the document has no counter).
 */
export const subscribeChats = ({ db, uid, myId, fs }, callback, onError) => {
  const me = String(myId);
  const unseenByChat = new Map(); // chat id -> { stop, messages: [{ sender_id, created_at }] }
  let chats = [];

  const emit = () => {
    const list = chats
      .filter((chat) => !chat.hidden)
      .map((chat) => {
        const unseen = (unseenByChat.get(chat.id)?.messages || []).filter(
          (message) => !chat.cleared_at || Date.parse(message.created_at) > Date.parse(chat.cleared_at)
        );

        return {
          ...chat,
          unread: unseen.filter((message) => message.sender_id !== me).length,
          // my last N messages the other person hasn't opened yet (read ticks)
          other_unread: unseen.filter((message) => message.sender_id === me).length,
        };
      });

    list.sort((a, b) => String(b.last_message_at || "").localeCompare(String(a.last_message_at || "")));

    callback(list);
  };

  const watchUnseen = (chatId) => {
    const entry = { messages: [], stop: () => {} };

    unseenByChat.set(chatId, entry);

    entry.stop = fs.onSnapshot(
      fs.query(fs.collection(db, "chats", chatId, "messages"), fs.where("isSeen", "==", false)),
      (snapshot) => {
        entry.messages = snapshot.docs.map((item) => {
          const data = item.data({ serverTimestamps: "estimate" });

          return { sender_id: String(data.sender_id), created_at: toIso(data.created_at) };
        });
        emit();
      },
      (error) => console.error("Chat unread count failed:", error)
    );
  };

  const stopChats = fs.onSnapshot(
    fs.query(fs.collection(db, "chats"), fs.where("users", "array-contains", me)),
    (snapshot) => {
      chats = snapshot.docs.map((item) => toConversation(item, uid, myId));

      const ids = new Set(chats.map((chat) => chat.id));

      ids.forEach((id) => {
        if (!unseenByChat.has(id)) watchUnseen(id);
      });

      unseenByChat.forEach((entry, id) => {
        if (!ids.has(id)) {
          entry.stop();
          unseenByChat.delete(id);
        }
      });

      emit();
    },
    onError
  );

  return () => {
    stopChats();
    unseenByChat.forEach((entry) => entry.stop());
    unseenByChat.clear();
  };
};

/**
 * Newest messages of a chat live -> callback(messages old -> new, oldestSnapshot, hasMore)
 * clearedAt: messages up to this time are not read (I deleted the chat then)
 */
const afterCleared = (fs, clearedAt) =>
  clearedAt ? [fs.where("created_at", ">=", new Date(Date.parse(clearedAt) + 1))] : [];

export const subscribeMessages = ({ db, myId, fs }, chatId, callback, onError, clearedAt = null) =>
  fs.onSnapshot(
    fs.query(
      fs.collection(db, "chats", chatId, "messages"),
      ...afterCleared(fs, clearedAt),
      fs.orderBy("created_at", "desc"),
      fs.limit(MESSAGES_PAGE_SIZE)
    ),
    (snapshot) => {
      const docs = snapshot.docs;

      callback(
        docs.map((item) => toMessage(item, myId)).reverse(),
        docs[docs.length - 1] || null,
        docs.length >= MESSAGES_PAGE_SIZE
      );
    },
    onError
  );

/**
 * Older page before oldestSnapshot -> { messages (old -> new), oldest, hasMore }
 */
export const getOlderMessages = async ({ db, myId, fs }, chatId, oldestSnapshot, clearedAt = null) => {
  const snapshot = await fs.getDocs(
    fs.query(
      fs.collection(db, "chats", chatId, "messages"),
      ...afterCleared(fs, clearedAt),
      fs.orderBy("created_at", "desc"),
      fs.startAfter(oldestSnapshot),
      fs.limit(MESSAGES_PAGE_SIZE)
    )
  );
  const docs = snapshot.docs;

  return {
    messages: docs.map((item) => toMessage(item, myId)).reverse(),
    oldest: docs[docs.length - 1] || oldestSnapshot,
    hasMore: docs.length >= MESSAGES_PAGE_SIZE,
  };
};

/**
 * Message + chat last message in one write.
 * First message of a new chat also creates the chat document (conversation.chat_fields).
 */
export const sendFirebaseMessage = async ({ db, myId, fs }, conversation, text) => {
  const chatRef = fs.doc(db, "chats", conversation.id);
  const batch = fs.writeBatch(db);
  const me = String(myId);
  const sentAt = fs.serverTimestamp();

  batch.set(fs.doc(fs.collection(chatRef, "messages")), {
    sender_id: me,
    message: text,
    isSeen: false,
    created_at: sentAt,
  });

  batch.set(
    chatRef,
    {
      ...(conversation.chat_fields || {}),
      last_message: text,
      last_message_sender_id: me,
      last_message_at: sentAt,
    },
    { merge: true }
  );

  await batch.commit();
};

/**
 * Messages sent to me -> isSeen = true
 */
export const markFirebaseChatRead = async ({ db, myId, fs }, chatId) => {
  const snapshot = await fs.getDocs(
    fs.query(fs.collection(db, "chats", chatId, "messages"), fs.where("isSeen", "==", false))
  );

  const toMark = snapshot.docs.filter((item) => String(item.data().sender_id) !== String(myId));

  for (let start = 0; start < toMark.length; start += BATCH_LIMIT) {
    const batch = fs.writeBatch(db);

    toMark.slice(start, start + BATCH_LIMIT).forEach((item) => batch.update(item.ref, { isSeen: true }));

    await batch.commit();
  }
};

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
