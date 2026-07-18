/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'

type RouteContext = { params: Promise<{ slug?: string[] }> }
type RouteHandler = (request: Request, context: RouteContext) => Promise<Response>

/**
 * Payload upload endpoints only register GET handlers for `/media/file/:filename`.
 * CloudFront (and some clients) probe with HEAD first; without this shim those
 * requests 404 and can be cached as errors at the edge.
 */
function withHeadSupport(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    if (request.method !== 'HEAD') {
      return handler(request, context)
    }

    const getRequest = new Request(request.url, {
      headers: request.headers,
      method: 'GET',
      signal: request.signal,
    })

    const response = await handler(getRequest, context)

    return new Response(null, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    })
  }
}

const getHandler = REST_GET(config) as RouteHandler

export const GET = getHandler
export const HEAD = withHeadSupport(getHandler)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)

export const PUT = REST_PUT(config)
export const OPTIONS = REST_OPTIONS(config)
