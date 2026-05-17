import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const src = 'C:\\Users\\fitri angelina\\.gemini\\antigravity\\brain\\2bb66a22-1821-4e65-be98-3f8908c6d897\\media__1779000971494.jpg';
  const dest = path.join(process.cwd(), 'public', 'pattern-bg.png');
  
  try {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      
      // Salin juga sebagai jpeg cadangan jika diperlukan
      const destJpeg = path.join(process.cwd(), 'public', 'pattern-bg.png.jpeg');
      fs.copyFileSync(src, destJpeg);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Gambar pola geometris Anda berhasil disalin ke public/pattern-bg.png!' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Berkas sumber gambar tidak ditemukan.' 
      }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}
