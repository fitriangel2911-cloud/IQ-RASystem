import { NextResponse } from 'next/server';
import { createClient as createSSRClient } from '@/lib/supabase/server';

/**
 * System Parameters API Endpoint
 * GET: Fetches all system parameters (authorized for all operational staff)
 * POST: Updates or inserts system parameters (strictly restricted to Super Admin)
 */

export async function GET(request: Request) {
  try {
    const ssrClient = await createSSRClient();
    const { data: { user }, error: userErr } = await ssrClient.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: 'Otorisasi ditolak. Sesi tidak valid.' }, { status: 401 });
    }

    // Authenticate caller role: must be staff (super_admin, customer_service, teller, accounting, manager, ao, dps)
    const { data: profile, error: profErr } = await ssrClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profErr || !profile) {
      return NextResponse.json({ error: 'Profil tidak ditemukan.' }, { status: 404 });
    }

    const allowedRoles = ['super_admin', 'customer_service', 'teller', 'accounting', 'manager', 'account_officer', 'ao', 'dps'];
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Akses ditolak. Peran Anda tidak memiliki izin untuk membaca parameter sistem.' }, { status: 403 });
    }

    // Fetch system parameters
    const { data: parameters, error: paramErr } = await ssrClient
      .from('system_parameters')
      .select('*')
      .order('key', { ascending: true });

    if (paramErr) {
      return NextResponse.json({ error: 'Gagal mengambil parameter: ' + paramErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, parameters });

  } catch (err: any) {
    console.error('API GET System Parameters Crash:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan internal: ' + err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ssrClient = await createSSRClient();
    const { data: { user }, error: userErr } = await ssrClient.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: 'Otorisasi ditolak. Sesi tidak valid.' }, { status: 401 });
    }

    // Strictly enforce SUPER_ADMIN role for updates
    const { data: profile, error: profErr } = await ssrClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profErr || profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Super Admin (IT Administrator) yang diizinkan memperbarui konfigurasi sistem.' }, { status: 403 });
    }

    // Parse payload: expect an array of { key: string, value: string, description?: string }
    const body = await request.json();
    const { parameters } = body;

    if (!parameters || !Array.isArray(parameters)) {
      return NextResponse.json({ error: 'Format data tidak valid. Mengharapkan array parameter.' }, { status: 400 });
    }

    // Perform bulk updates / inserts (upserts)
    const upsertRows = parameters.map(p => ({
      key: p.key,
      value: String(p.value).trim(),
      description: p.description || null,
      updated_at: new Date().toISOString()
    }));

    const { error: upsertErr } = await ssrClient
      .from('system_parameters')
      .upsert(upsertRows);

    if (upsertErr) {
      return NextResponse.json({ error: 'Gagal menyimpan parameter: ' + upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Seluruh konfigurasi sistem berhasil diperbarui secara real-time.' });

  } catch (err: any) {
    console.error('API POST System Parameters Crash:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan internal: ' + err.message }, { status: 500 });
  }
}
