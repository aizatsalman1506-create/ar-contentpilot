// ======================================================
// AR CONTENTPILOT
// FIRESTORE SERVICE COMPATIBILITY LAYER
// ======================================================
//
// File:
// src/services/firestoreService.js
//
// Purpose:
// Backward-compatible wrapper.
//
// MAIN Firestore data layer:
// src/lib/firestore.js
//
// Do NOT put new Firestore logic in this file.
// ======================================================

import firestore, {
  COLLECTIONS,
  getCollectionData,
  getDocumentData,
  addDocument,
  setDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  getOrderedDocuments,

  getBrandProfile,
  saveBrandProfile,

  getContent,
  getContentByStatus,
  createContent,
  updateContent,
  deleteContent,

  getCalendarPosts,
  createCalendarPost,
  updateCalendarPost,
  deleteCalendarPost,

  getAutopilotSettings,
  saveAutopilotSettings,
  createAutopilotLog,

  getThreads,
  createThread,
  updateThread,
  deleteThread,

  getAnalytics,
  createAnalyticsRecord,
  updateAnalyticsRecord,

  getTrends,
  createTrend,
  updateTrend,
  deleteTrend,

  getSettings,
  saveSettings,

  getUserProfile,
  saveUserProfile,

  getDashboardSummary,
  loadApplicationData,

  getFirestoreErrorMessage,
} from "../lib/firestore";


// ======================================================
// COLLECTIONS
// ======================================================

export { COLLECTIONS };


// ======================================================
// GENERIC FUNCTIONS
// ======================================================

export {
  getCollectionData,
  getDocumentData,
  addDocument,
  setDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  getOrderedDocuments,
};


// ======================================================
// BRAND PROFILE
// ======================================================

export {
  getBrandProfile,
  saveBrandProfile,
};


// ======================================================
// CONTENT
// ======================================================

export {
  getContent,
  getContentByStatus,
  createContent,
  updateContent,
  deleteContent,
};


// ======================================================
// CALENDAR
// ======================================================

export {
  getCalendarPosts,
  createCalendarPost,
  updateCalendarPost,
  deleteCalendarPost,
};


// ======================================================
// AUTOPILOT
// ======================================================

export {
  getAutopilotSettings,
  saveAutopilotSettings,
  createAutopilotLog,
};


// ======================================================
// THREADS
// ======================================================

export {
  getThreads,
  createThread,
  updateThread,
  deleteThread,
};


// ======================================================
// ANALYTICS
// ======================================================

export {
  getAnalytics,
  createAnalyticsRecord,
  updateAnalyticsRecord,
};


// ======================================================
// TRENDS
// ======================================================

export {
  getTrends,
  createTrend,
  updateTrend,
  deleteTrend,
};


// ======================================================
// SETTINGS
// ======================================================

export {
  getSettings,
  saveSettings,
};


// ======================================================
// USER PROFILE
// ======================================================

export {
  getUserProfile,
  saveUserProfile,
};


// ======================================================
// DASHBOARD
// ======================================================

export {
  getDashboardSummary,
  loadApplicationData,
};


// ======================================================
// ERROR HELPER
// ======================================================

export {
  getFirestoreErrorMessage,
};


// ======================================================
// DEFAULT EXPORT
// ======================================================

export default firestore;