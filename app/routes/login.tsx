import { useLoaderData, Link, useNavigate } from "@remix-run/react";
import { createBrowserClient } from "@supabase/ssr";

export const loader = () => {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  };
  return { env };
};

export const Login = () => {
  const { env } = useLoaderData<typeof loader>();
  const supabase = createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  const navigate = useNavigate();

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `http://localhost:3000/auth/callback`,
        },
      });
      if (error) throw error;
      return navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  // TODO: any
  const login = async (event: any) => {
    event.preventDefault();

    const email = event.target.email.value;
    const password = event.target.password.value;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <button onClick={loginWithGoogle}>Login with Google</button>
      <form onSubmit={login}>
        <label htmlFor="email">Email</label>
        <input type="email" name="email" id="email" />
        <label htmlFor="password">Password</label>
        <input type="password" name="password" id="password" />
        <input type="submit" value="Login" />
      </form>
      <Link to="/signup">Sign UP</Link>
    </div>
  );
};

export default Login;
