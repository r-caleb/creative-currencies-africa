const passwordRules = [
  {
    label: "Au moins 8 caractères",
    isValid: (password: string) => password.length >= 8,
  },
  {
    label: "Une majuscule et une minuscule",
    isValid: (password: string) => /[A-Z]/.test(password) && /[a-z]/.test(password),
  },
  {
    label: "Un chiffre",
    isValid: (password: string) => /\d/.test(password),
  },
  {
    label: "Un caractère spécial",
    isValid: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
];

export function getPasswordValidationMessage(password: string, label = "Le mot de passe") {
  const missingRules = passwordRules.filter((rule) => !rule.isValid(password)).map((rule) => `- ${rule.label}`);

  if (missingRules.length === 0) {
    return "";
  }

  return `${label} doit contenir :\n${missingRules.join("\n")}`;
}
