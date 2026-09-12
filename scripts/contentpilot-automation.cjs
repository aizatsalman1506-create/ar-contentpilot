// ======================================================
// AR CONTENTPILOT
// GITHUB ACTIONS AUTOMATION
// FIREBASE + FIRESTORE
// ======================================================

const {
  initializeApp,
  cert,
  getApps,
} = require("firebase-admin/app");

const {
  getFirestore,
  FieldValue,
} = require("firebase-admin/firestore");

// ======================================================
// HEADER
// ======================================================

console.log("==============================================");
console.log("AR CONTENTPILOT AUTOMATION");
console.log("==============================================");

console.log("");

console.log("Automation started.");
console.log(
  "Time:",
  new Date().toISOString()
);

console.log("");

// ======================================================
// FIREBASE ADMIN CONNECTION
// ======================================================

function getFirebaseCredentials() {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT secret is missing."
    );
  }

  let credentials;

  try {
    credentials = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is not valid JSON."
    );
  }

  return credentials;
}

// ======================================================
// INITIALIZE FIREBASE
// ======================================================

if (!getApps().length) {
  const credentials =
    getFirebaseCredentials();

  initializeApp({
    credential: cert(credentials),
  });
}

const db = getFirestore();

// ======================================================
// FIRESTORE AUTOMATION TEST
// ======================================================

async function runAutomation() {
  console.log("System:");
  console.log("- GitHub Actions: ACTIVE");
  console.log("- Firebase project: ar-contentpilot");
  console.log("- Firestore: CONNECTING...");
  console.log("- Threads backend: READY");

  console.log("");

  // ----------------------------------------------------
  // AUTOMATION STATUS DOCUMENT
  // ----------------------------------------------------

  const automationRef =
    db
      .collection("system")
      .doc("automation");

  await automationRef.set(
    {
      status: "active",

      lastRunAt:
        FieldValue.serverTimestamp(),

      platform:
        "GitHub Actions",

      frequency:
        "Every 4 hours",

      firebaseProject:
        "ar-contentpilot",

      firestore:
        "ready",

      threadsBackend:
        "ready",

      updatedAt:
        FieldValue.serverTimestamp(),
    },
    {
      merge: true,
    }
  );

  console.log(
    "Firestore: CONNECTED"
  );

  console.log(
    "Automation status: SAVED"
  );

  console.log("");

  console.log(
    "Automation test completed successfully."
  );

  console.log("");

  console.log("==============================================");
}

// ======================================================
// START
// ======================================================

runAutomation()
  .catch((error) => {
    console.error("");

    console.error(
      "=============================================="
    );

    console.error(
      "AUTOMATION FAILED"
    );

    console.error(
      "=============================================="
    );

    console.error(
      error.message
    );

    console.error("");

    process.exit(1);
  });