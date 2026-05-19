import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase keys not configured in server env.' }, { status: 500 });
  }

  // Initialize stateless client
  const devClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  const targetEmail = 'admin@gmail.com';
  const targetPass = 'admin1@123';
  const fullName = 'Administrator IT (Super Admin)';

  try {
    // 1. Attempt to sign up in Auth
    const { data: authData, error: authErr } = await devClient.auth.signUp({
      email: targetEmail,
      password: targetPass,
      options: {
        data: { full_name: fullName }
      }
    });

    if (authErr) {
      if (authErr.message.includes('already registered')) {
        // Upsert DB profile in case auth already exists
        // Find existing user if possible
        const { data: existingUser } = await devClient
          .from('users')
          .select('id')
          .eq('email', targetEmail)
          .single();

        if (existingUser) {
          await devClient
            .from('users')
            .upsert({
              id: existingUser.id,
              full_name: fullName,
              email: targetEmail,
              role: 'super_admin'
            }, { onConflict: 'id' });
        }

        return NextResponse.json({ 
          success: true,
          message: 'Akun auth.users admin@gmail.com sudah terdaftar di Supabase dan dikonfigurasi sebagai super_admin.',
        });
      }
      throw authErr;
    }

    if (!authData?.user) {
      throw new Error('Auth creation failed to return user payload.');
    }

    // 2. Commit to public.users
    const { error: dbErr } = await devClient
      .from('users')
      .upsert({
        id: authData.user.id,
        full_name: fullName,
        email: targetEmail,
        role: 'super_admin'
      }, { onConflict: 'id' });

    if (dbErr) {
      return NextResponse.json({ 
        success: false, 
        error: `Database Error: ${dbErr.message}`
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: '🎉 AKUN DUMMY ADMIN BERHASIL DIBUAT!',
      account: {
        email: targetEmail,
        password: targetPass,
        role: 'super_admin',
        instructions: 'Gunakan email ini untuk login ke halaman Dashboard Admin.'
      }
    });

  } catch (err: any) {
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 400 });
  }
}
