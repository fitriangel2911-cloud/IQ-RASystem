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

    // 2. Check if current user is super_admin
    const { data: profile, error: profErr } = await ssrClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (profErr || !['super_admin', 'customer_service'].includes(profile?.role)) {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Administrator Sistem (Super Admin) atau Customer Service yang diizinkan menambah akun.' }, { status: 403 });
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

    // 4.5. Pre-check: Check if email already exists in public.users to return clean error immediately
    const { data: existingUser, error: checkError } = await standAloneClient
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ error: 'Email ini sudah terdaftar di sistem. Silakan gunakan alamat email lain.' }, { status: 400 });
    }

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

    // Deteksi duplikasi email melalui security obfuscation Supabase Auth (identities kosong)
    if (authData.user.identities && authData.user.identities.length === 0) {
      return NextResponse.json({ error: 'Email ini sudah terdaftar di sistem. Silakan gunakan alamat email lain.' }, { status: 400 });
    }

    // 6. Record the custom User Profile inside public.users (Menggunakan UPSERT agar kompatibel dengan auto-trigger Supabase)
    const { error: insertError } = await standAloneClient
      .from('users')
      .upsert({
        id: authData.user.id,
        full_name: fullName,
        email: email,
        password: password, // Plaintext stored for visual Super Admin Audit visibility as per existing system design
        role: role
      });

    if (insertError) {
      console.error('Public profile insertion fail:', insertError);
      
      // Deteksi duplikasi email selain primary key (Error Code 23505 = Unique Violation)
      if (insertError.code === '23505' && insertError.message?.toLowerCase().includes('email')) {
        return NextResponse.json({ 
          error: 'Email ini sudah terdaftar di sistem. Silakan gunakan alamat email lain.' 
        }, { status: 400 });
      }

      return NextResponse.json({ 
        error: 'Gagal membuat profil publik pengguna: ' + insertError.message 
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: authData.user });

  } catch (err: any) {
    console.error('Server route create-user panic:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server: ' + err.message }, { status: 500 });
  }
}
