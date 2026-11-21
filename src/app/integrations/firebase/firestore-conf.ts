import * as firebase from 'firebase-admin';

export const FIRESTORE = Symbol('FIRESTORE');

export type Firestore = firebase.firestore.Firestore;
