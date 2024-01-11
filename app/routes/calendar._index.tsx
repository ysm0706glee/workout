import { useLoaderData, useNavigate } from "@remix-run/react";
import { createBrowserClient } from "@supabase/ssr";
import { DatePicker, type DateValue } from "@mantine/dates";

export const loader = () => {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  };
  return { env };
};

const Calendar = () => {
  const { env } = useLoaderData<typeof loader>();
  const supabase = createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  const navigate = useNavigate();

  // TODO: move to root.tsx
  const signOut = async () => {
    await supabase.auth.signOut();
    return navigate("/login");
  };

  return (
    <div>
      <DatePicker
        onChange={(newDate: DateValue) => {
          if (!newDate) return;
          const year = newDate.getFullYear();
          const month = (newDate.getMonth() + 1).toString().padStart(2, "0");
          const day = newDate.getDate().toString().padStart(2, "0");
          const formattedDate = `${year}-${month}-${day}`;
          navigate(`/calendar/workout_menus?date=${formattedDate}`);
        }}
      />
      <button onClick={signOut}>Sign out</button>
    </div>
  );
};

export default Calendar;
