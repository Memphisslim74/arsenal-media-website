Upload these files/folders to the ROOT of the GitHub repo:

- scripts/build-blog.js
- package.json
- package-lock.json
- .npmrc

Important: The Cloudflare build error means scripts/build-blog.js was not replaced last time.
After upload, open scripts/build-blog.js in GitHub and confirm the top of the file is:

const fs = require("fs");
const path = require("path");

There should be NO line that says:

const matter = require("gray-matter");
