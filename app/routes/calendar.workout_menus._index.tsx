import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  createBrowserClient,
  createServerClient,
  parse,
  serialize,
} from "@supabase/ssr";
import { Radio } from "@mantine/core";
import { useEffect, useState } from "react";
import WorkoutRecordForm from "~/components/workoutRecordForm";
import type { Database } from "~/types/supabase";
import type { WorkoutRecords } from "~/types/workoutRecord";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  if (!date) {
    return redirect("/calendar");
  }
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  };
  const cookies = parse(request.headers.get("Cookie") ?? "");
  const headers = new Headers();
  const supabase = createServerClient<Database>(
    env.SUPABASE_URL!,
    env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key) {
          return cookies[key];
        },
        set(key, value, options) {
          headers.append("Set-Cookie", serialize(key, value, options));
        },
        remove(key, options) {
          headers.append("Set-Cookie", serialize(key, "", options));
        },
      },
    }
  );
  const workoutMenus = await supabase.from("workout_menus").select("*");
  return { date, env, workoutMenus };
};

const WorkoutMenus = () => {
  const { date, env, workoutMenus } = useLoaderData<typeof loader>();
  const supabase = createBrowserClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY
  );
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWorkMenuId, setSelectedWorkMenuId] = useState<number | null>(
    null
  );
  const [workoutRecords, setWorkoutRecords] = useState<WorkoutRecords>({});

  useEffect(() => {
    if (!selectedWorkMenuId) return;
    const fetchWorkoutRecords = async (workoutMenuId: number) => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("workout_menus_exercises")
          .select("exercises (id, name)")
          .eq("workout_menus_id", workoutMenuId);
        if (error) throw error;
        const { data: workoutRecords, error: workoutError } = await supabase
          .from("workout_records")
          .select(
            `
              id,
              date,
              sets,
              reps,
              weight,
              exercises (id, name),
              workout_menus_id
            `
          )
          .eq("workout_menus_id", workoutMenuId)
          .eq("date", date)
          .order("exercises_id", { ascending: true });
        if (workoutError) throw workoutError;
        const result: WorkoutRecords = {};
        data.forEach((exercise) => {
          if (exercise.exercises) {
            result[exercise.exercises.name] = {
              id: exercise.exercises.id,
              records: [],
            };
          }
        });
        workoutRecords.forEach((record) => {
          if (record.exercises) {
            const exerciseName = record.exercises.name;
            if (!result[exerciseName]) {
              result[exerciseName] = {
                id: record.exercises.id,
                records: [],
              };
            }
            result[exerciseName].records.push({
              id: record.id,
              sets: record.sets,
              reps: record.reps,
              weight: record.weight,
            });
          }
        });
        setWorkoutRecords(result);
      } catch (err) {
        console.error("Error fetching workout records:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkoutRecords(selectedWorkMenuId);
  }, [supabase, date, selectedWorkMenuId]);

  return (
    <div>
      <h1>Workout Menus</h1>
      {workoutMenus.data &&
        workoutMenus.data.map((workoutMenu) => (
          <Radio
            key={workoutMenu.id}
            label={workoutMenu.name}
            checked={selectedWorkMenuId === workoutMenu.id}
            onChange={async () => setSelectedWorkMenuId(workoutMenu.id)}
          />
        ))}
      {selectedWorkMenuId && !isLoading && (
        <WorkoutRecordForm
          date={date}
          selectedWorkMenuId={selectedWorkMenuId}
          workoutRecords={workoutRecords}
          setWorkoutRecords={setWorkoutRecords}
        />
      )}
    </div>
  );
};

export default WorkoutMenus;
