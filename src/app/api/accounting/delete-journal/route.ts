import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Akses tidak sah.' }, { status: 401 });
    }

    // Verify role
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile || !['accounting', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Akses ditolak. Hanya peran Accounting atau Super Admin yang dapat menghapus jurnal.' }, { status: 403 });
    }

    const { referenceNo } = await request.json();

    if (!referenceNo) {
      return NextResponse.json({ error: 'Nomor referensi jurnal harus disertakan.' }, { status: 400 });
    }

    // Execute deletion of all journal lines with this reference_no
    const { error: deleteErr } = await supabaseAdmin
      .from('journal_entries')
      .delete()
      .eq('reference_no', referenceNo);

    if (deleteErr) {
      console.error('Failed to delete journal entries:', deleteErr);
      return NextResponse.json({ error: 'Gagal menghapus jurnal di database: ' + deleteErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Seluruh entri jurnal dengan referensi ${referenceNo} berhasil dihapus.` });
  } catch (error: any) {
    console.error('Error deleting journal:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server: ' + error.message }, { status: 500 });
  }
}
