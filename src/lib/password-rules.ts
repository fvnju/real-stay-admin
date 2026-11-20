/**
 * The password rule of the backend
 * (real-stay-backend `src/features/auth/dto/password.validator.ts`): at
 * least 8 characters, and 3 of these 4: a lowercase letter, an uppercase
 * letter, a number, a special character. Change both together.
 */
export const PASSWORD_HINT =
  "Use 8 or more characters, with upper and lower case letters and a number.";

export function passwordError(password: string): string | undefined {
  if (!password.trim()) return "Enter a password.";
  if (password.length < 8) return "Use 8 or more characters.";
  const checks = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  if (checks.filter(Boolean).length >= 3) return undefined;
  if (!checks[0]) return "Add a lowercase letter.";
  if (!checks[1]) return "Add an uppercase letter.";
  if (!checks[2]) return "Add a number.";
  return "Add a special character.";
}
