import AuthAdapter from "../adapters/auth/auth.adapter";
import CustomError from "../models/CustomError";
import { isValidEmail } from "../utils/inputs.ustils";

export const signIn = async (fetcher: AuthAdapter, email: string, password: string) => {
  try {
    validateLoginFields(email, password)
    const userCredential = await fetcher.signIn(email, password)

    if (!userCredential.user.emailVerified) {
      throw new CustomError('El correo no ha sido verificado.');
    }
  } catch (error) {
    if (error instanceof CustomError) {
      throw error
    } else {
      throw new CustomError('Error inesperado. Intenta nuevamente.');
    }
  }
}

const validateLoginFields = (email: string, password: string) => {
  const errors: string[] = [];

  if (!email || email.trim() === '') {
    throw new CustomError('El email es obligatorio.', 'email')
  } else if (!isValidEmail(email)) {
    throw new CustomError('El email no es válido.', 'email')
  }

  if (!password || password.trim() === '') {
    throw new CustomError('El password es obligatorio.', 'password');
  }
}

export const signOut = async (fetcher: AuthAdapter) => {
  try {
    await fetcher.signOut()
  } catch (error) {
    throw new Error('Unable to sign out.');
    
  }
}

export const recoverPassword = async (fetcher: AuthAdapter, email: string) => {
  try {
    validateLoginFields(email, 'password')
    await fetcher.resetPassword(email)
  } catch (error) {
    if(error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('Error inesperado. Intenta nuevamente.');
    }
  }
}