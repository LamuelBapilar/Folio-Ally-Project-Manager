// the same rules the server checks
export const PASSWORD_RULES = [
    { label: "At least 8 characters", test: (p) => p.length >= 8 },
    { label: "An uppercase letter", test: (p) => /\p{Lu}/u.test(p) },
    { label: "A lowercase letter", test: (p) => /\p{Ll}/u.test(p) },
    { label: "A number", test: (p) => /\p{N}/u.test(p) },
  ];
  
  export const passwordIsValid = (password) => PASSWORD_RULES.every((rule) => rule.test(password));