export type PasswordStrength = { bars: number; label: string };

/** A lightweight, honest strength heuristic — not a security control, just UI feedback. */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return { bars: 0, label: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const bars = Math.min(4, Math.max(1, score));
  const label =
    bars <= 1 ? "Weak password" : bars === 2 ? "Fair password" : bars === 3 ? "Good password" : "Strong password";
  return { bars, label };
}
