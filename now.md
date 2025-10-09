 
[Region: asia-southeast1]
 
╭────────────────╮
│ Railpack 0.9.0 │
╰────────────────╯
 
↳ Detected Node
↳ Using npm package manager
↳ Found workspace with 2 packages
 
Packages
──────────
node  │  22.20.0  │  railpack default (22)
 
Steps
──────────
▸ install
$ npm ci
 
▸ build
$ npm run build
 
Deploy
──────────
$ npm run start
 
 
Successfully prepared Railpack plan for build
 
 
context: 443m-Cl8x

load build definition from railpack-plan.json
0ms

install mise packages: node
2s
mise node@22.20.0 ✓ installed

mkdir -p /app/node_modules/.cache
140ms

copy package.json, client/package.json, server/package.json, package-lock.json, server/prisma
142ms

npm ci
9s
found 0 vulnerabilities

copy / /app
127ms

npm run build
5s
npm warn config production Use `--omit=dev` instead.
> tanka-chaya@1.0.0 build
> cd client && npm run build && cd ../server && npm run build
npm warn config production Use `--omit=dev` instead.
> tanka-chaya-client@1.0.0 build
> tsc && vite build
vite v6.3.6 building for production...
transforming...
✓ 84 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.48 kB │ gzip:  0.33 kB
dist/assets/index-jyUEqIcY.css   14.21 kB │ gzip:  3.50 kB
dist/assets/index-COiWUYkT.js   255.97 kB │ gzip: 79.51 kB
✓ built in 1.64s
npm warn config production Use `--omit=dev` instead.
> tanka-chaya-server@1.0.0 build
> tsc
src/routes/events.ts(143,33): error TS7006: Parameter 'r' implicitly has an 'any' type.

src/routes/submissions.ts(86,50): error TS7006: Parameter 's' implicitly has an 'any' type.

src/routes/submissions.ts(94,34): error TS7006: Parameter 'sum' implicitly has an 'any' type.

src/routes/submissions.ts(94,39): error TS7006: Parameter 'v' implicitly has an 'any' type.

src/routes/votes.ts(75,53): error TS7006: Parameter 'sum' implicitly has an 'any' type.

src/routes/votes.ts(75,58): error TS7006: Parameter 'v' implicitly has an 'any' type.

src/services/eventManager.ts(1,24): error TS2305: Module '"@prisma/client"' has no exported member 'Event'.

src/services/eventManager.ts(1,45): error TS2305: Module '"@prisma/client"' has no exported member 'Room'.

src/services/eventManager.ts(154,20): error TS7006: Parameter 'room' implicitly has an 'any' type.

npm error Lifecycle script `build` failed with error:

npm error code 2
npm error path /app/server
npm error workspace tanka-chaya-server@1.0.0
npm error location /app/server
npm error command failed
npm error command sh -c tsc
ERROR: failed to build: failed to solve: process "npm run build" did not complete successfully: exit code: 2