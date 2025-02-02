"use client";

import { userSchema } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/clientApp";
import { createSession } from "@/lib/session";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const form = useForm<z.output<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        form.getValues().email,
        form.getValues().password
      );
      const Idtoken = await userCredential.user.getIdToken();
      const res = await createSession(Idtoken);
      router.push("/admin/events");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formRef = useRef<HTMLFormElement>(null);

  const isValid = form.formState.isValid;
  return (
    <div className="max-w-4xl mx-auto">
      <div className="font-chakra mx-8 border-white border-[1px] rounded-lg p-10 font-primary">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <Form {...form}>
            <form
              className=""
              ref={formRef}
              onSubmit={form.handleSubmit((data) => {
                form.trigger();
                if (!isValid) return;
                handleLogin();
                router.refresh();
              })}
              //   action={(data) => {
              //     form.trigger();
              //     if (!isValid) return;
              //     submitLogin(data);

              //     router.refresh();
              //   }}
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="hackathon2025"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="hackathon2025"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* {state.message && <FormMessage>{state.message}</FormMessage>} */}
              <Button type="submit">Login</Button>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}
