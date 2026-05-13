import { NextResponse } from 'next/server';
import { createClient as createSSRClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // 1. Authenticate caller via SSR Client
    const ssrClient = await createSSRClient();
    const { data: { user }, error: userErr } = await ssrClient.auth.getUser();
    
    if (userErr || !user) {
      return NextResponse.json({ error: 'Otorisasi ditolak. Sesi tidak valid.' }, { status: 401 });
    }

    // 2. Check if current user is super_user
    const { data: profile, error: profErr } = await ssrClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (profErr || profile?.role !== 'super_user') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Administrator Sistem (Super User) yang diizinkan menambah akun staf.' }, { status: 403 });
    }

    // 3. Parse and Validate Body
    const body = await request.json();
    const { fullName, email, password, role } = body;

    if (!fullName || !email || !password || !role) {
      return NextResponse.json({ error: 'Semua data (Nama, Email, Sandi, Peran) wajib diisi.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Kata sandi minimal harus 6 karakter.' }, { status: 400 });
    }

    // 4. Instantiate a isolated, stateless Supabase Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const standAloneClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    // 5. Perform Auth SignUp on the Server Side (Does not mutate browser cookies)
    const { data: authData, error: signUpError } = await standAloneClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (signUpError) {
      return NextResponse.json({ error: 'Supabase Auth Error: ' + signUpError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Gagal membuat kredensial autentikasi baru.' }, { status: 500 });
    }

    // 6. Record the custom User Profile inside public.users
    const { error: insertError } = await standAloneClient
      .from('users')
      .insert({
        id: authData.user.id,
        full_name: fullName,
        email: email,
        password: password, // Plaintext stored for visual Super User Audit visibility as per existing system design
        role: role
      });

    if (insertError) {
      console.error('Public profile insertion fail:', insertError);
      return NextResponse.json({ 
        success: true, 
        warning: 'Akun auth terdaftar, tetapi profil publik gagal dimasukkan: ' + insertError.message,
        user: authData.user
      });
    }

    return NextResponse.json({ success: true, user: authData.user });

  } catch (err: any) {
    console.error('Server route create-user panic:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server: ' + err.message }, { status: 500 });
  }
}
