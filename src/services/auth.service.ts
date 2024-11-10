import { BACK_URL } from "@env";
import { fbAuthFetcher } from "../adapters/auth/fbFecther.adapter";
import { getAxiosFetcher } from "../adapters/http/axios.fetcher";
import CustomError from "../models/CustomError";
import { isValidEmail } from "../utils/inputs.utils";
import { SimpleHttpResponse, SigUpResponse } from "../interfaces/http.interface";

const authFetcher = fbAuthFetcher
const httpFetcher = getAxiosFetcher(`${BACK_URL}:4041`) 

export const signIn = async (email: string, password: string) => {
  try {
    validateLoginFields(email, password)
    const userCredential = await authFetcher.signIn(email, password)

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
  if (!email || email.trim() === '') {
    throw new CustomError('El email es obligatorio.', 'email')
  } else if (!isValidEmail(email)) {
    throw new CustomError('El email no es válido.', 'email')
  }

  if (!password || password.trim() === '') {
    throw new CustomError('El password es obligatorio.', 'password');
  }
}

export const signOut = async () => {
  try {
    await authFetcher.signOut()
  } catch (error) {
    throw new Error('Unable to sign out.');
    
  }
}

export const recoverPassword = async (email: string) => {
  try {
    validateLoginFields(email, 'password')
    await authFetcher.resetPassword(email)
  } catch (error) {
    if(error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('Error inesperado. Intenta nuevamente.');
    }
  }
}

export const requestCode = async(email: string): Promise<string> => {
  try {
    validateLoginFields(email, 'password')
    const data = await httpFetcher.post<SimpleHttpResponse>('/auth/users/requestCode', {email})
    return data.message
  } catch (error) {
    if(error instanceof CustomError) {
      throw error
    } else {
      throw new CustomError((error as Error).message);
    }
  }
}

const validateSignUpFileds = (name: string, password: string, confirmPwd: string) => {
  if(name.trim() === '') {
    throw new CustomError('El nombre es obligatorio.', 'name')
  }

  if(password.trim() === '') {
    throw new CustomError('El password es obligatorio.', 'password')
  }

  const lengthPattern = /.{8,}/
  const uppercasePattern = /[A-Z]/
  const lowercasePattern = /[a-z]/
  const numberPattern = /[0-9]/

  if (!lengthPattern.test(password)) {
    throw new CustomError('El password debe tener al menos 8 caracteres.', 'password')
  }
  if (!uppercasePattern.test(password)) {
    throw new CustomError('El password debe contener al menos una letra mayúscula.', 'password')
  }
  if (!lowercasePattern.test(password)) {
    throw new CustomError('El password debe contener al menos una letra minúscula.', 'password')
  }
  if (!numberPattern.test(password)) {
    throw new CustomError('El password debe contener al menos un número.', 'password')
  }

  if(password !== confirmPwd) {
    throw new CustomError('Los passwords no son iguales.', 'password')
  }
}

export const signUp = async (code: string, name: string, password: string, confirmPwd: string): Promise<string> => {
  try {
    validateSignUpFileds(name, password, confirmPwd)
    const data = await httpFetcher.post<SigUpResponse>('/auth/users/register', {password, name}, code.trim())
    return data.email
  } catch (error) {
    if(error instanceof CustomError) {
      throw error
    } else {
      throw new CustomError((error as Error).message)
    }
  }
}