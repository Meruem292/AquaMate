
"use client";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  type AuthError
} from "firebase/auth";
import { app } from "./config";
import type { LoginValues, SignupValues } from "../validation/auth";

const auth = getAuth(app);

export async function signUpWithEmail(values: SignupValues) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      values.email,
      values.password
    );
    await updateProfile(userCredential.user, {
      displayName: values.fullName,
    });
    return { user: userCredential.user, error: null };
  } catch (e) {
    const error = e as AuthError;
    return { user: null, error };
  }
}

export async function signInWithEmail(values: LoginValues) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      values.email,
      values.password
    );
    return { user: userCredential.user, error: null };
  } catch (e) {
    const error = e as AuthError;
    return { user: null, error };
  }
}

export { auth, sendPasswordResetEmail };
