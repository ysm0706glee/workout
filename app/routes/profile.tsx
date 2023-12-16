import { useLoaderData } from "@remix-run/react";
import { createBrowserClient } from "@supabase/ssr";

export const loader = () => {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  };
  return { env };
};

export default function Profile() {
  const { env } = useLoaderData<typeof loader>();
  const supabase = createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  const signOut = async () => {
    await supabase.auth.signOut();
  };
  return (
    <div>
      <h1>Profile</h1>
      <button onClick={signOut}>Sign out</button>
    </div>
  );
}
