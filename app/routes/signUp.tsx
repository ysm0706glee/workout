import { useLoaderData } from "@remix-run/react";
import { createBrowserClient } from "@supabase/ssr";
import { useState } from "react";

export const loader = () => {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  };
  return { env };
};

const SignUp = () => {
  const { env } = useLoaderData<typeof loader>();
  const supabase = createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  const [isSingedUp, setIsSignedUp] = useState(false);

  // TODO: any
  const signUp = async (event: any) => {
    event.preventDefault();

    const email = event.target.email.value;
    const password = event.target.password.value;

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "http://localhost:3000/signin",
        },
      });
      if (error) throw error;
      setIsSignedUp(true);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <form onSubmit={signUp}>
        <label htmlFor="email">Email</label>
        <input type="email" name="email" id="email" />
        <label htmlFor="password">Password</label>
        <input type="password" name="password" id="password" />
        <input type="submit" value="Sign Un" />
      </form>
      {isSingedUp && <p>Check your email for a verification link</p>}
    </div>
  );
};

export default SignUp;
