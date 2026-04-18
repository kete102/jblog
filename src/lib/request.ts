/** Extract the originating client IP from common proxy headers. */
export function getClientIp(c: {
  req: { header: (key: string) => string | undefined }
}): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    '0.0.0.0'
  )
}
