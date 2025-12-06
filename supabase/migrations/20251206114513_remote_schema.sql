
  create table "public"."blocked_customers" (
    "id" uuid not null default gen_random_uuid(),
    "customer_id" uuid not null,
    "blocked_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "blocked_by" text,
    "reason" text,
    "notes" text,
    "is_active" boolean default true,
    "unblocked_at" timestamp with time zone,
    "unblocked_by" text
      );


alter table "public"."blocked_customers" enable row level security;

CREATE UNIQUE INDEX blocked_customers_pkey ON public.blocked_customers USING btree (id);

alter table "public"."blocked_customers" add constraint "blocked_customers_pkey" PRIMARY KEY using index "blocked_customers_pkey";

alter table "public"."blocked_customers" add constraint "blocked_customers_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."blocked_customers" validate constraint "blocked_customers_customer_id_fkey";

grant delete on table "public"."blocked_customers" to "anon";

grant insert on table "public"."blocked_customers" to "anon";

grant references on table "public"."blocked_customers" to "anon";

grant select on table "public"."blocked_customers" to "anon";

grant trigger on table "public"."blocked_customers" to "anon";

grant truncate on table "public"."blocked_customers" to "anon";

grant update on table "public"."blocked_customers" to "anon";

grant delete on table "public"."blocked_customers" to "authenticated";

grant insert on table "public"."blocked_customers" to "authenticated";

grant references on table "public"."blocked_customers" to "authenticated";

grant select on table "public"."blocked_customers" to "authenticated";

grant trigger on table "public"."blocked_customers" to "authenticated";

grant truncate on table "public"."blocked_customers" to "authenticated";

grant update on table "public"."blocked_customers" to "authenticated";

grant delete on table "public"."blocked_customers" to "service_role";

grant insert on table "public"."blocked_customers" to "service_role";

grant references on table "public"."blocked_customers" to "service_role";

grant select on table "public"."blocked_customers" to "service_role";

grant trigger on table "public"."blocked_customers" to "service_role";

grant truncate on table "public"."blocked_customers" to "service_role";

grant update on table "public"."blocked_customers" to "service_role";


  create policy "Allow insert access"
  on "public"."blocked_customers"
  as permissive
  for insert
  to public
with check (true);



  create policy "Allow read access"
  on "public"."blocked_customers"
  as permissive
  for select
  to public
using (true);



  create policy "Allow update access"
  on "public"."blocked_customers"
  as permissive
  for update
  to public
using (true);



