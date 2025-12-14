const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const isValidEmail = (email: string): boolean => {
  if (!email) {
    return false;
  }

  return EMAIL_PATTERN.test(normalizeEmail(email));
};
