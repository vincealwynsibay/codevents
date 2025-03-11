"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { saveProfile } from "@/lib/actions/registrations";
import { Button } from "@/components/ui/button";
import { Field, NativeSelect, TextInput } from "@/components/form/fields";

export default function ProfileForm({
  initial,
  courses,
  yearLevels,
  next,
  email,
}: {
  initial: { name: string; course: string; yearLevel: string };
  courses: string[];
  yearLevels: string[];
  next: string;
  email: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await saveProfile(values);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.error);
        return;
      }
      router.replace(next);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="panel mt-8 space-y-5 p-6">
      <Field label="School email">
        <TextInput value={email} disabled />
      </Field>
      <Field label="Full name" error={errors.name} hint="As it should appear on certificates.">
        <TextInput
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          autoComplete="name"
          required
        />
      </Field>
      <Field label="Course" error={errors.course}>
        <NativeSelect
          value={values.course}
          onChange={(e) => setValues({ ...values, course: e.target.value })}
          required
        >
          <option value="" disabled>
            Select your course
          </option>
          {courses.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Year level" error={errors.yearLevel}>
        <NativeSelect
          value={values.yearLevel}
          onChange={(e) => setValues({ ...values, yearLevel: e.target.value })}
          required
        >
          <option value="" disabled>
            Select your year level
          </option>
          {yearLevels.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </NativeSelect>
      </Field>
      {formError && <p className="text-sm text-red-400">{formError}</p>}
      <Button type="submit" disabled={pending} className="w-full font-chakra tracking-wide">
        {pending && <Loader2 className="animate-spin" />} Save and continue
      </Button>
    </form>
  );
}
