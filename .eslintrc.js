//НАЛАШТУВАННЯ КОДУ

module.exports = {
  root: true, // Вказує ESLint, що це головна конфігурація (не шукати вище)
  env: {
    node: true, // Дозволяє глобальні змінні Node.js (require, process тощо)
    es2021: true, // Використовує сучасні можливості ECMAScript
  },
  parser: "@typescript-eslint/parser", // Парсер для TypeScript
  parserOptions: {
    ecmaVersion: "latest", // Дозволяє сучасний синтаксис JS
    sourceType: "module", // Використання import/export
    project: ["./tsconfig.json"], // Підключення до TypeScript-конфігурації
  },
  extends: [
    "eslint:recommended", // Базові правила ESLint
    "plugin:@typescript-eslint/recommended", // Рекомендовані правила TypeScript
    "plugin:prettier/recommended", // Узгодження з Prettier
  ],
  plugins: ["@typescript-eslint"], // Підключення TS-плагіна
  rules: {
    // === Основні правила ===
    "no-console": "off", // Дозволяє використовувати console.log (можеш поставити "warn")
    "no-unused-vars": "off", // Вимикаємо базове правило ESLint
    "@typescript-eslint/no-unused-vars": ["warn"], // Використовуємо TS-версію
    "@typescript-eslint/no-explicit-any": "off", // Дозволяє any (або "warn" для більш строгих)
    "@typescript-eslint/explicit-function-return-type": "off", // Не вимагає явного типу повернення
    "@typescript-eslint/no-var-requires": "off", // Дозволяє require() у Node.js
    "prefer-const": "warn", // Попереджає, якщо можна замінити let на const
    eqeqeq: ["error", "always"], // Вимагає використовувати === замість ==
    curly: "error", // Вимагає фігурні дужки в умовах
    "no-multiple-empty-lines": ["warn", { max: 1 }], // Забороняє кілька порожніх рядків

    // === Преттір (Prettier) узгодження ===
    "prettier/prettier": [
      "warn",
      {
        endOfLine: "auto",
        semi: true,
        singleQuote: false,
        printWidth: 100,
        tabWidth: 2,
        trailingComma: "all",
      },
    ],
  },
  ignorePatterns: ["dist/", "node_modules/", "build/", "*.config.js"],
};
