import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedUsers() {
  console.log("Seeding test users...");

  // 1. Create Admin User
  const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
    email: 'admin@digitalheroes.test',
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      full_name: 'System Admin'
    }
  });

  if (adminError) {
    console.error("Error creating admin user:", adminError.message);
  } else if (adminData.user) {
    console.log("Admin user created:", adminData.user.id);
    
    // Update role in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', adminData.user.id);
      
    if (profileError) {
      console.error("Error setting admin role:", profileError.message);
    } else {
      console.log("Admin role set successfully.");
    }
  }

  // 2. Create Standard Test User
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: 'user@digitalheroes.test',
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      full_name: 'Test Subscriber'
    }
  });

  if (userError) {
    console.error("Error creating test user:", userError.message);
  } else if (userData.user) {
    console.log("Standard test user created:", userData.user.id);
  }

  console.log("Done seeding users.");
}

seedUsers();
