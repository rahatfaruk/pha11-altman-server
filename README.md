# AltProduct
Alternative Product Information System website. Server deployed on vercel. Others info in frontend url.

## Links:
  - my frontend repo: [pha11-altman-client](https://github.com/rahatfaruk/pha11-altman-client) , [phero-private-repo](https://github.com/Porgramming-Hero-web-course/b9a11-client-side-rahatfaruk) 

## How can you run backend locally:
  - clone this repo
  - create `.env` file in root folder. redefine these keys with your own values: mongodb username and passwors (`PasswordMDB, UserMDB`), private-key for jwt (`AuthPrivateKey`)
  - uncomment `await client.connect()` line inside 'index.js'.
  - run project: `npm run dev`