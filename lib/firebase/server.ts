import admin from "firebase-admin";

// Ensure Firebase Admin is initialized only once
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_ADMIN_SDK
    ? JSON.parse(process.env.FIREBASE_ADMIN_SDK)
    : null;

  if (serviceAccount) {
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // Add your project ID
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // Add your storage bucket
    });
  } else {
    console.error("Firebase Admin SDK credentials are missing.");
    throw new Error(
      "Firebase Admin initialization failed: Missing credentials."
    );
  }
}

export const dbAdmin = admin.firestore();
export const authAdmin = admin.auth();
export const firebaseAdmin = admin;
