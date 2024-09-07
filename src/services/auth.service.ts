import AuthAdapter from "../adapters/auth/auth.adapter";

export const signIn = async (fetcher: AuthAdapter, email: string, password: string) => {
    const credsValidation = validateLoginFields(email, password)

    if(credsValidation.isValid) {
        try {
            const userCredential = await fetcher.signIn(email,password)

            if(!userCredential.user.emailVerified) {
                throw new Error('Verifica tu correo para poder continuar.');
            }
        } catch (error) {
            if(error instanceof Error) {
                throw new Error(error.message);
            } else {
                throw new Error('Error inesperado. Intenta nuevamente');
            }
        }
    } else {
        throw new Error(credsValidation.errors[0]);
    }
}

const validateLoginFields = (email: string, password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!email || email.trim() === '') {
    errors.push('El email es obligatorio.');
  } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    errors.push('El email no es válido.');
  }

  if (!password || password.trim() === '') {
    errors.push('El password es obligatorio.');
  } 
  return { isValid: errors.length === 0, errors };
}
