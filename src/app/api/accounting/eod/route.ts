import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { closing_date, total_in, total_out, expected_balance, actual_balance, closed_by } = body;

    if (!closing_date) {
      return NextResponse.json({ error: 'Missing closing_date' }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if already closed
    const { data: existing, error: checkError } = await supabase
      .from('daily_closures')
      .select('id')
      .eq('closing_date', closing_date)
      .single();
      
    if (checkError && checkError.code === '42P01') {
       return NextResponse.json({ error: 'Tabel daily_closures belum dibuat di database! Silakan jalankan script SQL terlebih dahulu di Supabase.' }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ error: 'Buku Harian untuk tanggal ini sudah ditutup sebelumnya.' }, { status: 400 });
    }

    // Insert new closure
    const { data, error } = await supabase
      .from('daily_closures')
      .insert({
        closing_date,
        total_in,
        total_out,
        expected_balance,
        actual_balance,
        closed_by: closed_by || null
      });

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ error: 'Tabel daily_closures belum dibuat di database! Silakan jalankan script SQL terlebih dahulu di Supabase.' }, { status: 500 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Buku harian berhasil ditutup dan transaksi dikunci.' });

  } catch (error: any) {
    console.error("EOD API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
