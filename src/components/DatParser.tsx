// datParser.ts
export type LineDataInfo = {
  nLineLen: number; // int32
  nBits: number;    // int32
  eType: number;    // int32
};

export type LineDataHead = {
  nTime: number;          // int32
  fLo: number;            // float64
  fLa: number;            // float64
  fHeading: number;       // float64
  fScale: number;         // float64
  fAlt: number;           // float64
  fSpeed: number;         // float64
  nState: bigint;         // int64 (qint64)
  fSquintAngle: number;   // float64
};

export type LineData = {
  head: LineDataHead;
  data: Uint8Array;       // length = imgWidth
};

export type ParsedDat = {
  info: LineDataInfo;
  imgWidth: number;
  eLineType: number;
  lineLength: number;     // nLineDataLen
  lineCount: number;
  lines: LineData[];      // reversed order (push_front equivalent)
};

/**
 * Build an ImageData from the parsed DAT lines.
 * Each line.data is imgWidth bytes (0..255) = grayscale.
 *
 * @param parsed   result from readDatData/parseDatBuffer
 * @param flipY    if true, draws in the original file order (top = first line read).
 *                 If your parser used push_front (like the C++), leaving flipY=false
 *                 will display "last line at top" (same memory order as your array).
 */
export function linesToGrayscaleImageData(parsed: ParsedDat, flipY = false): ImageData {
  const width = parsed.imgWidth;
  const height = parsed.lineCount;
  if (!width || !height) throw new Error("No lines to render.");

  const img = new ImageData(width, height);
  const dst = img.data; // Uint8ClampedArray (RGBA)

  for (let y = 0; y < height; y++) {
    // Pick which source line to use for this output row
    const srcIdx = flipY ? (height - 1 - y) : y;
    const line = parsed.lines[srcIdx];
    if (!line) continue;

    const src = line.data; // Uint8Array of length = width
    let di = (y * width) << 2; // y*width*4

    // Fast loop: write RGBA from grayscale
    for (let x = 0; x < width; x++) {
      const v = src[x] ?? 0;
      dst[di++] = v; // R
      dst[di++] = v; // G
      dst[di++] = v; // B
      dst[di++] = 255; // A
    }
  }
  return img;
}
const INFO_SIZE = 12; // 3 * 4
const HEAD_SIZE = 72; // see note above
const LE = true;      // little-endian

class Cursor {
   public buf: ArrayBuffer;
  public off: number;
  private dv: DataView;

  constructor(buf: ArrayBuffer, off = 0) {
    this.buf = buf;
    this.off = off;
    this.dv = new DataView(buf);
  }
  //private dv = new DataView(this.buf);

  i32() { const v = this.dv.getInt32(this.off, LE); this.off += 4; return v; }
  f64() { const v = this.dv.getFloat64(this.off, LE); this.off += 8; return v; }
  i64() { const v = this.dv.getBigInt64(this.off, LE); this.off += 8; return v; }
  skip(n: number) { this.off += n; }
  bytes(n: number) {
    const out = new Uint8Array(this.buf, this.off, n);
    this.off += n;
    // Return a copy to detach from the original buffer slice if desired:
    return new Uint8Array(out); // copy; remove 'new Uint8Array' wrapper if view is fine
  }
}

/** Read the DAT from a URL (e.g., "../assets/SLAR_10420003.dat") and parse it. */
export async function readDatData(url: string): Promise<ParsedDat> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const buf = await res.arrayBuffer();
  return parseDatBuffer(buf);
}

/** Parse from an ArrayBuffer using the same layout as the C++ code. */
export function parseDatBuffer(buf: ArrayBuffer): ParsedDat {
  const cur = new Cursor(buf, 0);

  // --- LineDataInfo ---
  if (buf.byteLength < INFO_SIZE) {
    throw new Error("Buffer too small for LineDataInfo");
  }
  const info: LineDataInfo = {
    nLineLen: cur.i32(),
    nBits:    cur.i32(),
    eType:    cur.i32(),
  };

  const imgWidth = info.nLineLen;
  const eLineType = info.eType;

  // --- counts/lengths (same math as C++) ---
  const nFileSize = BigInt(buf.byteLength);
  const nLineDataLen = imgWidth + HEAD_SIZE;
  const remainder = Number(nFileSize) - INFO_SIZE;
  const nLineCount = Math.floor(remainder / nLineDataLen);

  // --- iterate lines ---
  const lines: LineData[] = [];
  lines.length = 0; // clear (mirrors lineData.clear())
  // (reserve-like behavior not needed, but we can prealloc an array and fill)
  // We'll read forward and unshift (push_front). For very large files, you may push and reverse at the end.

  for (let i = 1; i <= nLineCount; i++) {
    // --- read LineDataHead (72 bytes expected) ---
    const lineHeadStart = cur.off;
    const head = readHead(cur);

    // Safety: ensure we moved exactly HEAD_SIZE bytes (helps catch packing mismatches)
    const headBytesRead = cur.off - lineHeadStart;
    if (headBytesRead !== HEAD_SIZE) {
      // If you hit this, adjust HEAD_SIZE or the readHead() sequence/padding.
      throw new Error(`Head size mismatch: read ${headBytesRead}, expected ${HEAD_SIZE}`);
    }

    // --- read scanline pixel bytes ---
    const data = cur.bytes(imgWidth);
    if (data.length !== imgWidth) {
      // partial/truncated file
      break;
    }

    // push_front behavior
    lines.unshift({ head, data });
  }

  return {
    info,
    imgWidth,
    eLineType,
    lineLength: nLineDataLen,
    lineCount: lines.length,
    lines,
  };
}

// Read one LineDataHead in the same field order + padding as your C++
function readHead(cur: Cursor): LineDataHead {
  const nTime = cur.i32();

  // padding to align next double at 8-byte boundary (as in typical C++ layout)
  // If your producer uses #pragma pack(1) (no padding), remove this:
  cur.skip(4);

  const fLo         = cur.f64();
  const fLa         = cur.f64();
  const fHeading    = cur.f64();
  const fScale      = cur.f64();
  const fAlt        = cur.f64();
  const fSpeed      = cur.f64();
  const nState      = cur.i64(); // qint64
  const fSquintAngle= cur.f64();

  return { nTime, fLo, fLa, fHeading, fScale, fAlt, fSpeed, nState, fSquintAngle };
}
