// ======================================================
// AR CONTENTPILOT
// THREADS BACKEND FUNCTIONS
// ======================================================

const {
  onCall,
  HttpsError,
} = require("firebase-functions/v2/https");

const {
  initializeApp,
} = require("firebase-admin/app");

const {
  getFirestore,
  FieldValue,
} = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();

// ======================================================
// HELPERS
// ======================================================

function requireAuth(request) {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "You must be signed in."
    );
  }

  return request.auth.uid;
}

function cleanString(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}

// ======================================================
// TEST CONNECTION
// ======================================================
//
// Fungsi ini belum publish ke Threads.
// Ia hanya memastikan:
// Firebase Authentication
// +
// Firebase Functions
// +
// Firestore
//
// semuanya boleh berkomunikasi.
//

exports.testThreadsConnection =
  onCall(
    async (request) => {
      const uid =
        requireAuth(request);

      try {
        const userRef =
          db
            .collection("users")
            .doc(uid);

        await userRef.set(
          {
            threadsConnectionStatus:
              "ready",

            threadsConnectionUpdatedAt:
              FieldValue.serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        return {
          success: true,

          status: "ready",

          message:
            "Threads backend connection is ready.",

          uid,
        };
      } catch (error) {
        console.error(
          "testThreadsConnection failed:",
          error
        );

        throw new HttpsError(
          "internal",
          "Unable to test Threads connection."
        );
      }
    }
  );

// ======================================================
// SAVE THREAD DRAFT
// ======================================================
//
// Ini digunakan sebagai backend helper.
// Ia TIDAK publish ke Threads lagi.
//

exports.saveThreadDraft =
  onCall(
    async (request) => {
      const uid =
        requireAuth(request);

      const text =
        cleanString(
          request.data?.text
        );

      if (!text) {
        throw new HttpsError(
          "invalid-argument",
          "Thread text is required."
        );
      }

      if (text.length > 500) {
        throw new HttpsError(
          "invalid-argument",
          "Thread text cannot exceed 500 characters."
        );
      }

      try {
        const threadRef =
          await db
            .collection("threads")
            .add({
              userId: uid,

              text,

              platform:
                "Threads",

              status:
                "draft",

              threadsPostId:
                null,

              // ==================================================
              // REAL METRICS
              // ==================================================

              reach: 0,

              likes: 0,

              comments: 0,

              reposts: 0,

              engagementRate: 0,

              // ==================================================
              // TIMESTAMPS
              // ==================================================

              createdAt:
                FieldValue.serverTimestamp(),

              updatedAt:
                FieldValue.serverTimestamp(),

              publishedAt:
                null,

              metricsUpdatedAt:
                null,
            });

        return {
          success: true,

          id:
            threadRef.id,
        };
      } catch (error) {
        console.error(
          "saveThreadDraft failed:",
          error
        );

        throw new HttpsError(
          "internal",
          "Unable to save Thread draft."
        );
      }
    }
  );

// ======================================================
// PLACEHOLDER: PUBLISH TO THREADS
// ======================================================
//
// Kita akan isi endpoint Threads API sebenar
// selepas OAuth / access token connection siap.
//
// Buat masa ini JANGAN anggap ini sebagai
// Threads publishing sebenar.
//

exports.publishToThreads =
  onCall(
    async (request) => {
      const uid =
        requireAuth(request);

      const threadId =
        cleanString(
          request.data?.threadId
        );

      if (!threadId) {
        throw new HttpsError(
          "invalid-argument",
          "threadId is required."
        );
      }

      const threadRef =
        db
          .collection("threads")
          .doc(threadId);

      const threadSnap =
        await threadRef.get();

      if (!threadSnap.exists) {
        throw new HttpsError(
          "not-found",
          "Thread not found."
        );
      }

      const thread =
        threadSnap.data();

      if (
        thread.userId !== uid
      ) {
        throw new HttpsError(
          "permission-denied",
          "You cannot publish another user's Thread."
        );
      }

      if (
        !thread.text ||
        !String(thread.text).trim()
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Thread text is empty."
        );
      }

      // ==================================================
      // IMPORTANT
      // ==================================================
      //
      // Belum panggil Threads API.
      //
      // Jangan tandakan published sebelum
      // Threads API benar-benar berjaya.
      //

      return {
        success: false,

        status:
          "threads_api_not_connected",

        message:
          "Threads API connection is not configured yet.",

        threadId,
      };
    }
  );

// ======================================================
// PLACEHOLDER: REFRESH THREAD METRICS
// ======================================================
//
// Nanti fungsi ini akan:
// 1. Ambil threadsPostId
// 2. Call Threads API
// 3. Ambil metrics
// 4. Kira engagementRate
// 5. Simpan ke Firestore
//

exports.refreshThreadsMetrics =
  onCall(
    async (request) => {
      const uid =
        requireAuth(request);

      const threadId =
        cleanString(
          request.data?.threadId
        );

      if (!threadId) {
        throw new HttpsError(
          "invalid-argument",
          "threadId is required."
        );
      }

      const threadRef =
        db
          .collection("threads")
          .doc(threadId);

      const threadSnap =
        await threadRef.get();

      if (!threadSnap.exists) {
        throw new HttpsError(
          "not-found",
          "Thread not found."
        );
      }

      const thread =
        threadSnap.data();

      if (
        thread.userId !== uid
      ) {
        throw new HttpsError(
          "permission-denied",
          "You cannot access another user's Thread."
        );
      }

      if (
        !thread.threadsPostId
      ) {
        throw new HttpsError(
          "failed-precondition",
          "This Thread has not been published through the Threads API yet."
        );
      }

      // ==================================================
      // THREADS API METRICS WILL GO HERE
      // ==================================================

      return {
        success: false,

        status:
          "threads_api_not_connected",

        message:
          "Threads metrics API is not configured yet.",

        threadId,
      };
    }
  );