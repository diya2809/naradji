/**
 * Upsert Cloudflare R2 media env vars on the naradji Vercel project
 * for production + preview + development (same as Asmi).
 *
 * Usage:
 *   VERCEL_TOKEN=xxx node scripts/upsert-vercel-s3-env.mjs
 *
 * Token: https://vercel.com/account/tokens
 */
import 'dotenv/config'

const PROJECT_ID = 'prj_4778EkrjL0ZuDT9aro4NnbMQAIvD'
const TEAM_ID = 'team_L9Kwq7fJb9wwWxgGFiD77LEE'
const TARGETS = ['production', 'preview', 'development']

const token = process.env.VERCEL_TOKEN
if (!token) {
  console.error('Missing VERCEL_TOKEN. Create one at https://vercel.com/account/tokens')
  process.exit(1)
}

const endpoint =
  process.env.S3_ENDPOINT?.replace(/\/challengerate-prod\/?$/, '') ||
  'https://e1ce239ff634e2cf0202563891ede4df.r2.cloudflarestorage.com'

const vars = [
  { key: 'USE_S3_MEDIA', value: 'true', type: 'plain' },
  { key: 'S3_BUCKET', value: process.env.S3_BUCKET || 'challengerate-prod', type: 'plain' },
  { key: 'S3_ENDPOINT', value: endpoint, type: 'plain' },
  {
    key: 'S3_ACCESS_KEY_ID',
    value: process.env.S3_ACCESS_KEY_ID,
    type: 'encrypted',
  },
  {
    key: 'S3_SECRET_ACCESS_KEY',
    value: process.env.S3_SECRET_ACCESS_KEY,
    type: 'sensitive',
  },
]

for (const v of vars) {
  if (!v.value) {
    console.error(`Missing value for ${v.key} (load from .env)`)
    process.exit(1)
  }
}

const url = `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?upsert=true&teamId=${TEAM_ID}`

const body = vars.map((v) => ({
  key: v.key,
  value: v.value,
  type: v.type,
  target: TARGETS,
}))

const res = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
})

const text = await res.text()
if (!res.ok) {
  console.error('UPSERT_FAILED', res.status, text.slice(0, 500))
  process.exit(1)
}

console.log('UPSERT_OK', vars.map((v) => v.key).join(', '))
console.log('Redeploy production for env to take effect:')
console.log('  npx vercel --prod --yes')
console.log('  or push an empty commit / Redeploy in the Vercel dashboard')
