// TypeScript 7 (tsrs) checks side-effect imports such as `import "./globals.css"`.
// Next.js bundles the CSS; this tells the checker that the import exists.
declare module "*.css";
