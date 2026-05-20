import "server-only";

import { createSupabaseServerClient } from "@/server/supabase/server";
import type { Json } from "@/types/supabase";

export type ContactMessageInput = {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
};

export type NewsletterSubscribeInput = {
  email: string;
  source?: string | null;
  metadata?: Record<string, unknown>;
};

export async function submitContactMessage(
  input: ContactMessageInput,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  // No .select() — anon role has insert-only access. Returning the row would
  // require SELECT permission, which only support+admin have.
  const result = await supabase.from("contact_messages").insert({
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    subject: input.subject ?? null,
    message: input.message,
    user_id: input.userId ?? null,
    metadata: toJsonObject(input.metadata),
  });

  if (result.error) {
    throw result.error;
  }
}

export async function subscribeNewsletter(
  input: NewsletterSubscribeInput,
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  // Plain insert (anon role has insert-only access). On unique violation we
  // silently succeed so the public API never reveals whether an email is
  // already subscribed. Upsert is avoided because it triggers a SELECT-side
  // check that anon does not have permission for.
  const result = await supabase.from("newsletter_subscribers").insert({
    email: input.email,
    source: input.source ?? null,
    metadata: toJsonObject(input.metadata),
    status: "pending",
  });

  if (result.error && result.error.code !== "23505") {
    throw result.error;
  }
}

function toJsonObject(value: Record<string, unknown> | undefined): Json {
  if (!value) {
    return {} as Json;
  }
  return JSON.parse(JSON.stringify(value)) as Json;
}
