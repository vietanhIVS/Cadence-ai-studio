import { db, handleFirestoreError, OperationType } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { State, initialState, withPresets } from './cadence';

export async function readUserState(userId: string): Promise<{ revision: number; state: State }> {
  const path = `users/${userId}/training/state`;
  try {
    const docRef = doc(db, 'users', userId, 'training', 'state');
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      const state = initialState();
      const initialPayload = {
        userId,
        revision: 0,
        stateJson: JSON.stringify(state),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(docRef, initialPayload);
      return { revision: 0, state: withPresets(state) };
    }
    const data = snap.data();
    const previous = JSON.parse(data.stateJson) as State;
    const state = withPresets(previous);
    return { revision: Number(data.revision) || 0, state };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    throw error;
  }
}

export async function writeUserState(userId: string, revision: number, state: State): Promise<boolean> {
  const path = `users/${userId}/training/state`;
  try {
    const docRef = doc(db, 'users', userId, 'training', 'state');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const current = snap.data();
      if (Number(current.revision) !== revision) {
        return false;
      }
    }
    const nextRevision = revision + 1;
    await setDoc(docRef, {
      userId,
      revision: nextRevision,
      stateJson: JSON.stringify(state),
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function saveUserProfile(user: { uid: string; email: string | null; displayName: string | null }) {
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
