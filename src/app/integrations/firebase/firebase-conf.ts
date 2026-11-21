import * as firebase from 'firebase-admin';

export const FIREBASE_APP = Symbol('FIREBASE_APP');

export function createFirebaseApp(serviceAccountPathOrObject: string | firebase.ServiceAccount): firebase.app.App {
    return firebase.initializeApp({
        credential: firebase.credential.cert(serviceAccountPathOrObject),
    });
}
