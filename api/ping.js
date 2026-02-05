// Pure JavaScript debug endpoint - using ESM syntax for Vercel + "type": "module"
export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
      // Check crucial backend keys
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      jwtSecretSet: !!process.env.JWT_SECRET
    }
  });
}
