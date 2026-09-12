// ======================================================
// AR CONTENTPILOT
// FIRESTORE DATA LAYER
// ======================================================
//
// File:
// src/lib/firestore.js
//
// Purpose:
// Centralized Firestore functions for the whole application.
//
// Modules:
// - Users
// - Brand Brain
// - Content
// - Calendar
// - Autopilot
// - Threads
// - Analytics
// - Trends
// - Settings
//
// Firebase Storage is NOT used here.
// ======================================================

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase";


// ======================================================
// COLLECTION NAMES
// ======================================================

export const COLLECTIONS = {
  users: "users",
  brandProfiles: "brandProfiles",
  content: "content",
  calendar: "calendar",
  autopilot: "autopilot",
  threads: "threads",
  analytics: "analytics",
  settings: "settings",
  trends: "trends",
};


// ======================================================
// INTERNAL HELPERS
// ======================================================

function getCollection(collectionName) {
  return collection(db, collectionName);
}


function getDocument(collectionName, documentId) {
  return doc(
    db,
    collectionName,
    documentId
  );
}


// ======================================================
// GENERIC COLLECTION
// ======================================================

export async function getCollectionData(
  collectionName
) {
  try {
    const snapshot = await getDocs(
      getCollection(collectionName)
    );

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));
  } catch (error) {
    console.error(
      `Firestore getCollectionData error (${collectionName}):`,
      error
    );

    throw error;
  }
}


// ======================================================
// GENERIC DOCUMENT
// ======================================================

export async function getDocumentData(
  collectionName,
  documentId
) {
  try {
    const snapshot = await getDoc(
      getDocument(
        collectionName,
        documentId
      )
    );

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    };
  } catch (error) {
    console.error(
      `Firestore getDocumentData error (${collectionName}/${documentId}):`,
      error
    );

    throw error;
  }
}


// ======================================================
// ADD DOCUMENT
// ======================================================

export async function addDocument(
  collectionName,
  data
) {
  try {
    const docRef = await addDoc(
      getCollection(collectionName),
      {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    return {
      id: docRef.id,
      ...data,
    };
  } catch (error) {
    console.error(
      `Firestore addDocument error (${collectionName}):`,
      error
    );

    throw error;
  }
}


// ======================================================
// SET DOCUMENT
// ======================================================
//
// Creates or updates a document.
//
// merge: true means existing fields are preserved.
// ======================================================

export async function setDocument(
  collectionName,
  documentId,
  data
) {
  try {
    await setDoc(
      getDocument(
        collectionName,
        documentId
      ),
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    return {
      id: documentId,
      ...data,
    };
  } catch (error) {
    console.error(
      `Firestore setDocument error (${collectionName}/${documentId}):`,
      error
    );

    throw error;
  }
}


// ======================================================
// UPDATE DOCUMENT
// ======================================================

export async function updateDocument(
  collectionName,
  documentId,
  data
) {
  try {
    await updateDoc(
      getDocument(
        collectionName,
        documentId
      ),
      {
        ...data,
        updatedAt: serverTimestamp(),
      }
    );

    return true;
  } catch (error) {
    console.error(
      `Firestore updateDocument error (${collectionName}/${documentId}):`,
      error
    );

    throw error;
  }
}


// ======================================================
// DELETE DOCUMENT
// ======================================================

export async function deleteDocument(
  collectionName,
  documentId
) {
  try {
    await deleteDoc(
      getDocument(
        collectionName,
        documentId
      )
    );

    return true;
  } catch (error) {
    console.error(
      `Firestore deleteDocument error (${collectionName}/${documentId}):`,
      error
    );

    throw error;
  }
}


// ======================================================
// QUERY DOCUMENTS
// ======================================================

export async function queryDocuments(
  collectionName,
  field,
  operator,
  value
) {
  try {
    const collectionRef =
      getCollection(collectionName);

    const firestoreQuery = query(
      collectionRef,
      where(
        field,
        operator,
        value
      )
    );

    const snapshot =
      await getDocs(firestoreQuery);

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));
  } catch (error) {
    console.error(
      `Firestore queryDocuments error (${collectionName}):`,
      error
    );

    throw error;
  }
}


// ======================================================
// QUERY + ORDER
// ======================================================

export async function getOrderedDocuments(
  collectionName,
  orderField = "createdAt",
  direction = "desc",
  maxResults = 100
) {
  try {
    const firestoreQuery = query(
      getCollection(collectionName),
      orderBy(
        orderField,
        direction
      ),
      limit(maxResults)
    );

    const snapshot =
      await getDocs(firestoreQuery);

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));
  } catch (error) {
    console.error(
      `Firestore getOrderedDocuments error (${collectionName}):`,
      error
    );

    throw error;
  }
}


// ======================================================
// BRAND BRAIN
// ======================================================

export async function getBrandProfile(
  userId = "default"
) {
  return getDocumentData(
    COLLECTIONS.brandProfiles,
    userId
  );
}


export async function saveBrandProfile(
  userId,
  data
) {
  return setDocument(
    COLLECTIONS.brandProfiles,
    userId,
    data
  );
}


// ======================================================
// CONTENT
// ======================================================

export async function getContent() {
  return getOrderedDocuments(
    COLLECTIONS.content,
    "createdAt",
    "desc",
    200
  );
}


export async function getContentByStatus(
  status
) {
  return queryDocuments(
    COLLECTIONS.content,
    "status",
    "==",
    status
  );
}


export async function createContent(
  data
) {
  return addDocument(
    COLLECTIONS.content,
    {
      ...data,
      status:
        data.status || "draft",
    }
  );
}


export async function updateContent(
  contentId,
  data
) {
  return updateDocument(
    COLLECTIONS.content,
    contentId,
    data
  );
}


export async function deleteContent(
  contentId
) {
  return deleteDocument(
    COLLECTIONS.content,
    contentId
  );
}


// ======================================================
// CALENDAR
// ======================================================

export async function getCalendarPosts() {
  return getOrderedDocuments(
    COLLECTIONS.calendar,
    "scheduledAt",
    "asc",
    200
  );
}


export async function createCalendarPost(
  data
) {
  return addDocument(
    COLLECTIONS.calendar,
    {
      ...data,
      status:
        data.status || "scheduled",
    }
  );
}


export async function updateCalendarPost(
  postId,
  data
) {
  return updateDocument(
    COLLECTIONS.calendar,
    postId,
    data
  );
}


export async function deleteCalendarPost(
  postId
) {
  return deleteDocument(
    COLLECTIONS.calendar,
    postId
  );
}


// ======================================================
// AUTOPILOT
// ======================================================

export async function getAutopilotSettings(
  userId = "default"
) {
  return getDocumentData(
    COLLECTIONS.autopilot,
    userId
  );
}


export async function saveAutopilotSettings(
  userId,
  data
) {
  return setDocument(
    COLLECTIONS.autopilot,
    userId,
    data
  );
}


export async function createAutopilotLog(
  data
) {
  return addDocument(
    COLLECTIONS.autopilot,
    {
      ...data,
      type:
        data.type || "generation",
    }
  );
}


// ======================================================
// THREADS
// ======================================================

export async function getThreads() {
  return getOrderedDocuments(
    COLLECTIONS.threads,
    "createdAt",
    "desc",
    200
  );
}


export async function createThread(
  data
) {
  return addDocument(
    COLLECTIONS.threads,
    {
      ...data,
      status:
        data.status || "draft",
    }
  );
}


export async function updateThread(
  threadId,
  data
) {
  return updateDocument(
    COLLECTIONS.threads,
    threadId,
    data
  );
}


export async function deleteThread(
  threadId
) {
  return deleteDocument(
    COLLECTIONS.threads,
    threadId
  );
}


// ======================================================
// ANALYTICS
// ======================================================

export async function getAnalytics() {
  return getOrderedDocuments(
    COLLECTIONS.analytics,
    "createdAt",
    "desc",
    200
  );
}


export async function createAnalyticsRecord(
  data
) {
  return addDocument(
    COLLECTIONS.analytics,
    data
  );
}


export async function updateAnalyticsRecord(
  analyticsId,
  data
) {
  return updateDocument(
    COLLECTIONS.analytics,
    analyticsId,
    data
  );
}


export async function deleteAnalyticsRecord(
  analyticsId
) {
  return deleteDocument(
    COLLECTIONS.analytics,
    analyticsId
  );
}


// ======================================================
// TRENDS
// ======================================================

export async function getTrends() {
  return getOrderedDocuments(
    COLLECTIONS.trends,
    "momentum",
    "desc",
    100
  );
}


export async function createTrend(
  data
) {
  return addDocument(
    COLLECTIONS.trends,
    data
  );
}


export async function updateTrend(
  trendId,
  data
) {
  return updateDocument(
    COLLECTIONS.trends,
    trendId,
    data
  );
}


export async function deleteTrend(
  trendId
) {
  return deleteDocument(
    COLLECTIONS.trends,
    trendId
  );
}


// ======================================================
// SETTINGS
// ======================================================

export async function getSettings(
  userId = "default"
) {
  return getDocumentData(
    COLLECTIONS.settings,
    userId
  );
}


export async function saveSettings(
  userId,
  data
) {
  return setDocument(
    COLLECTIONS.settings,
    userId,
    data
  );
}


// ======================================================
// USER PROFILE
// ======================================================

export async function getUserProfile(
  userId
) {
  if (!userId) {
    return null;
  }

  return getDocumentData(
    COLLECTIONS.users,
    userId
  );
}


export async function saveUserProfile(
  userId,
  data
) {
  if (!userId) {
    throw new Error(
      "userId is required to save user profile."
    );
  }

  return setDocument(
    COLLECTIONS.users,
    userId,
    data
  );
}


// ======================================================
// DASHBOARD SUMMARY
// ======================================================

export async function getDashboardSummary() {
  try {
    const [
      content,
      calendar,
      threads,
      analytics,
    ] = await Promise.all([
      getContent(),
      getCalendarPosts(),
      getThreads(),
      getAnalytics(),
    ]);

    const publishedContent =
      content.filter(
        (item) =>
          item.status === "published"
      );

    const scheduledContent =
      content.filter(
        (item) =>
          item.status === "scheduled"
      );

    const draftContent =
      content.filter(
        (item) =>
          item.status === "draft"
      );

    return {
      totalContent:
        content.length,

      publishedContent:
        publishedContent.length,

      scheduledContent:
        scheduledContent.length,

      draftContent:
        draftContent.length,

      calendarPosts:
        calendar.length,

      threads:
        threads.length,

      analytics:
        analytics.length,
    };
  } catch (error) {
    console.error(
      "Firestore dashboard summary error:",
      error
    );

    throw error;
  }
}


// ======================================================
// APPLICATION DATA
// ======================================================
//
// Loads the main application data in parallel.
// ======================================================

export async function loadApplicationData() {
  try {
    const [
      brandProfile,
      content,
      calendar,
      threads,
      analytics,
      trends,
    ] = await Promise.all([
      getBrandProfile(),
      getContent(),
      getCalendarPosts(),
      getThreads(),
      getAnalytics(),
      getTrends(),
    ]);

    return {
      brandProfile,
      content,
      calendar,
      threads,
      analytics,
      trends,
    };
  } catch (error) {
    console.error(
      "Firestore application data error:",
      error
    );

    throw error;
  }
}


// ======================================================
// FIRESTORE ERROR HELPER
// ======================================================

export function getFirestoreErrorMessage(
  error
) {
  if (!error) {
    return "Unknown Firestore error.";
  }

  switch (error.code) {
    case "permission-denied":
      return (
        "Firestore permission denied. " +
        "Please check your Firestore Security Rules."
      );

    case "unauthenticated":
      return (
        "User is not authenticated. " +
        "Please login again."
      );

    case "not-found":
      return (
        "The requested Firestore document was not found."
      );

    case "failed-precondition":
      return (
        "Firestore requires an index or configuration change."
      );

    case "unavailable":
      return (
        "Firestore is temporarily unavailable. " +
        "Please check your internet connection."
      );

    case "invalid-argument":
      return (
        "Invalid Firestore data or argument."
      );

    case "already-exists":
      return (
        "The Firestore document already exists."
      );

    case "deadline-exceeded":
      return (
        "Firestore request timed out. " +
        "Please try again."
      );

    default:
      return (
        error.message ||
        "An unexpected Firestore error occurred."
      );
  }
}


// ======================================================
// DEFAULT EXPORT
// ======================================================

const firestore = {
  COLLECTIONS,

  // Generic
  getCollectionData,
  getDocumentData,
  addDocument,
  setDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  getOrderedDocuments,

  // Brand Brain
  getBrandProfile,
  saveBrandProfile,

  // Content
  getContent,
  getContentByStatus,
  createContent,
  updateContent,
  deleteContent,

  // Calendar
  getCalendarPosts,
  createCalendarPost,
  updateCalendarPost,
  deleteCalendarPost,

  // Autopilot
  getAutopilotSettings,
  saveAutopilotSettings,
  createAutopilotLog,

  // Threads
  getThreads,
  createThread,
  updateThread,
  deleteThread,

  // Analytics
  getAnalytics,
  createAnalyticsRecord,
  updateAnalyticsRecord,
  deleteAnalyticsRecord,

  // Trends
  getTrends,
  createTrend,
  updateTrend,
  deleteTrend,

  // Settings
  getSettings,
  saveSettings,

  // Users
  getUserProfile,
  saveUserProfile,

  // Dashboard
  getDashboardSummary,
  loadApplicationData,

  // Error
  getFirestoreErrorMessage,
};

export default firestore;