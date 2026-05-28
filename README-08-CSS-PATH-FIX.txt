CSS path fix for Arsenal Media GitHub/Cloudflare deployment.

Upload the CONTENTS of this folder to the root of the GitHub repo.
This adds stylesheet files in BOTH /assets/css/ and /css/ and updates HTML/blog output to reference both paths.
Cloudflare build command should remain: npm run build
Build output directory should remain: .
