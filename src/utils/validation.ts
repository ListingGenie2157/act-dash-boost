const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const isValidEmail = (email: string): boolean => {
  if (!email) {
    return false;
  }

  const normalized = normalizeEmail(email);
  return emailPattern.test(normalized);
};
