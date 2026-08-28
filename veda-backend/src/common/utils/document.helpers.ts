/**
 * Sorts uploaded page files in ascending order if they contain 'page_N' in their filenames.
 */
export function sortPageFiles<T extends { originalname: string }>(files: T[]): T[] {
  return [...files].sort((a, b) => {
    const matchA = a.originalname.match(/page_(\d+)/i);
    const matchB = b.originalname.match(/page_(\d+)/i);
    if (matchA && matchB) {
      return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
    }
    return 0;
  });
}

/**
 * Detects image MIME type from binary magic numbers.
 */
export function getImageMimeType(buf: Buffer): string {
  if (buf && buf.length >= 4) {
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x43) {
      // png check
    }
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      return 'image/png';
    }
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
      return 'image/jpeg';
    }
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) {
      return 'image/gif';
    }
    if (
      buf.length >= 12 &&
      buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
    ) {
      return 'image/webp';
    }
  }
  return 'image/png';
}

/**
 * Checks if a buffer represents an unrasterised PDF.
 */
export function isPdfBuffer(buf: Buffer): boolean {
  return buf && buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
}
