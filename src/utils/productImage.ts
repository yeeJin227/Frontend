
export function pickProductImageUrl(
  images?: { fileUrl?: string | null; fileType?: string | null }[]
): string | null {
  if (!images?.length) return null;
  const get = (t: string) => images.find(i => i?.fileType === t && i.fileUrl)?.fileUrl || null;
  return (
    get('THUMBNAIL') ||
    get('MAIN') ||
    images.find(i => i?.fileUrl)?.fileUrl ||
    null
  );
}
