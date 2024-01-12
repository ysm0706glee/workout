import { NumberInput, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useLoaderData } from "@remix-run/react";
import { createBrowserClient } from "@supabase/ssr";
import type { LoaderFunctionArgs } from "@remix-run/node";
import type { Database } from "~/types/supabase";
import type { WorkoutRecords } from "~/types/workoutRecord";

type WorkoutRecordFormProps = {
  date: string;
  selectedWorkMenuId: number;
  workoutRecords: WorkoutRecords;
  setWorkoutRecords: React.Dispatch<React.SetStateAction<WorkoutRecords>>;
};

export const loader = ({ request }: LoaderFunctionArgs) => {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  };
  return { env };
};

const WorkoutRecordForm = (props: WorkoutRecordFormProps) => {
  const { env } = useLoaderData<typeof loader>();

  const supabase = createBrowserClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY
  );

  const form = useForm({
    initialValues: props.workoutRecords,
    validateInputOnChange: true,
  });

  const addRecord = (exercise: string) => {
    const currentRecords = form.values[exercise];
    const nextSetNumber = currentRecords.records.length + 1;
    const newRecord = {
      sets: nextSetNumber,
      reps: 0,
      weight: 0,
    };
    form.setFieldValue(exercise, {
      ...currentRecords,
      records: [...currentRecords.records, newRecord],
    });
  };

  const onSubmit = async (values: WorkoutRecords) => {
    if (Object.keys(form.errors).length) {
      console.log("errors");
    }
    for (const exercise in values) {
      for (const record of values[exercise].records) {
        const { error } = await supabase.from("workout_records").upsert({
          id: record.id,
          workout_menus_id: props.selectedWorkMenuId,
          date: props.date,
          exercises_id: values[exercise].id,
          sets: record.sets,
          reps: record.reps,
          weight: record.weight,
        });
        if (error) {
          console.log("error: ", error);
        }
      }
    }
  };

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      {Object.keys(form.values).map((exercise) => (
        <div key={exercise}>
          <h1>{exercise}</h1>
          {form.values[exercise].records.map((record, index) => (
            <div key={record.id}>
              <NumberInput
                {...form.getInputProps(`${exercise}.records.${index}.sets`)}
                label="Sets"
                min={0}
              />
              <NumberInput
                {...form.getInputProps(`${exercise}.records.${index}.reps`)}
                label="Reps"
                min={0}
              />
              <NumberInput
                {...form.getInputProps(`${exercise}.records.${index}.weight`)}
                label="Weight(kg)"
                min={0}
              />
            </div>
          ))}
          <Button onClick={() => addRecord(exercise)}>Add Record</Button>
        </div>
      ))}
      <Button type="submit">Save</Button>
    </form>
  );
};

export default WorkoutRecordForm;
