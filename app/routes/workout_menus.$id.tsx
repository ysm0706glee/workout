import { TextInput, Button } from "@mantine/core";
import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunction,
} from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { createServerClient, parse, serialize } from "@supabase/ssr";
import type { Database } from "~/types/supabase";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const workoutMenuId = params.id;
  if (!workoutMenuId) {
    return redirect("/workout_menus");
  }
  const cookies = parse(request.headers.get("Cookie") ?? "");
  const headers = new Headers();
  const supabase = createServerClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
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
  const { data: exercises, error } = await supabase
    .from("workout_menus_exercises")
    .select(`exercises (id, name)`)
    .eq("workout_menus_id", workoutMenuId);
  if (error) new Response("Not Found", { status: 404 });
  return { exercises };
};

export const action: ActionFunction = async ({ request, params }) => {
  const body = await request.formData();
  const exerciseName = body.get("exercise");
  if (typeof exerciseName !== "string") return;
  const workoutMenuId = Number(params.id);
  if (!workoutMenuId) return redirect("/workout_menus");
  const cookies = parse(request.headers.get("Cookie") ?? "");
  const headers = new Headers();
  const supabase = createServerClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
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
  const { data: existingExercises } = await supabase
    .from("exercises")
    .select("id")
    .eq("name", exerciseName)
    .single();
  let exerciseId: number | null = null;
  if (!existingExercises) {
    const { data: newExercise } = await supabase
      .from("exercises")
      .insert({ name: exerciseName })
      .select();
    if (!newExercise) return;
    exerciseId = newExercise[0].id;
  } else {
    exerciseId = existingExercises.id;
  }
  const { error } = await supabase
    .from("workout_menus_exercises")
    .insert({
      workout_menus_id: workoutMenuId,
      exercises_id: exerciseId,
    })
    .select();
  return null;
};

const WorkoutMenu = () => {
  const { exercises } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>WorkoutMenu</h1>
      <ul>
        {exercises &&
          exercises.map((exercise) => (
            <li key={exercise.exercises?.id}>
              <h2>{exercise.exercises?.name}</h2>
              <Button variant="filled" color="red">
                Delete
              </Button>
            </li>
          ))}
      </ul>
      <Form method="post">
        <TextInput name="exercise" label="Exercise name" />
        <button type="submit">Add exercise</button>
      </Form>
    </div>
  );
};

export default WorkoutMenu;
