import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin if credentials are provided
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Replace literal '\n' characters with actual newlines if present
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.warn('⚠️ Firebase Admin initialization failed with provided cert:', error);
    }
  } else {
    // Fallback initialize for local development/testing if no service account key is configured
    try {
      admin.initializeApp();
      console.log('ℹ️ Firebase Admin SDK initialized with default application credentials');
    } catch (error) {
      console.warn('⚠️ Firebase Admin SDK running in unconfigured mode (set up .env credentials)');
    }
  }
}

export default admin;
