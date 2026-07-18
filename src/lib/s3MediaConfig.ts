type S3MediaEnv = {
  bucket?: string
  accessKeyId?: string
  secretAccessKey?: string
  endpoint?: string
}

/**
 * R2/S3 endpoints must be the account base URL only, e.g.
 * https://<account>.r2.cloudflarestorage.com
 *
 * A common misconfiguration appends the bucket name to the path
 * (…/challengerate-prod). That breaks the AWS SDK and stores objects
 * under an accidental `bucket/filename` key prefix.
 */
export function normalizeS3Endpoint(endpoint: string | undefined, bucket?: string): string | undefined {
  if (!endpoint) return undefined

  try {
    const url = new URL(endpoint)
    const pathSegment = url.pathname.replace(/^\/+|\/+$/g, '')

    if (bucket && pathSegment === bucket) {
      url.pathname = '/'
    }

    return url.toString().replace(/\/$/, '')
  } catch {
    return endpoint
  }
}

export function resolveS3MediaConfig(env: NodeJS.ProcessEnv = process.env): {
  bucket?: string
  accessKeyId?: string
  secretAccessKey?: string
  endpoint?: string
  missing: string[]
  endpointWasNormalized: boolean
} {
  const bucket = env.S3_BUCKET
  const rawEndpoint = env.S3_ENDPOINT
  const endpoint = normalizeS3Endpoint(rawEndpoint, bucket)

  const config: S3MediaEnv = {
    bucket,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    endpoint,
  }

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  return {
    ...config,
    missing,
    endpointWasNormalized: Boolean(rawEndpoint && endpoint && rawEndpoint !== endpoint),
  }
}

/** R2/S3 media is opt-in so local dev can serve bundled files from public/media. */
export function shouldUseS3Media(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.USE_S3_MEDIA !== 'true') return false
  return resolveS3MediaConfig(env).missing.length === 0
}
