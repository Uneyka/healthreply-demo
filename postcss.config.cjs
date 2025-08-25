Remove-Item .\postcss.config.cjs -ErrorAction SilentlyContinue
@'
export default {
  plugins: {
    "@tailwindcss/postcss": {}
  }
}
'@ | Set-Content -Encoding UTF8 .\postcss.config.mjs
