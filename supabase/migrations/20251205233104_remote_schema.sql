
  create table "public"."debts" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "customer_id" uuid,
    "filling_id" uuid,
    "amount" numeric not null default 0,
    "remaining_amount" numeric not null default 0,
    "is_paid" boolean default false,
    "notes" text
      );


alter table "public"."debts" enable row level security;


  create table "public"."deleted_fillings" (
    "id" uuid not null default gen_random_uuid(),
    "original_id" uuid,
    "customer_id" uuid,
    "tank_no" text,
    "customer_name" text,
    "request_type" text,
    "status_at_deletion" text,
    "deleted_by" text,
    "deleted_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "original_created_at" timestamp with time zone,
    "notes" text
      );


alter table "public"."deleted_fillings" enable row level security;

alter table "public"."fillings" add column "amount" numeric default 0;

alter table "public"."fillings" add column "customer_name" text;

alter table "public"."fillings" add column "filling_type" text;

alter table "public"."fillings" add column "finished_at" timestamp with time zone default timezone('utc'::text, now());

alter table "public"."fillings" add column "is_debt" boolean default false;

alter table "public"."fillings" add column "tank_no" text;

alter table "public"."requests" add column "is_debt" boolean default false;

CREATE UNIQUE INDEX debts_pkey ON public.debts USING btree (id);

CREATE UNIQUE INDEX deleted_fillings_pkey ON public.deleted_fillings USING btree (id);

alter table "public"."debts" add constraint "debts_pkey" PRIMARY KEY using index "debts_pkey";

alter table "public"."deleted_fillings" add constraint "deleted_fillings_pkey" PRIMARY KEY using index "deleted_fillings_pkey";

alter table "public"."debts" add constraint "debts_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."debts" validate constraint "debts_customer_id_fkey";

alter table "public"."debts" add constraint "debts_filling_id_fkey" FOREIGN KEY (filling_id) REFERENCES public.fillings(id) ON DELETE CASCADE not valid;

alter table "public"."debts" validate constraint "debts_filling_id_fkey";

grant delete on table "public"."debts" to "anon";

grant insert on table "public"."debts" to "anon";

grant references on table "public"."debts" to "anon";

grant select on table "public"."debts" to "anon";

grant trigger on table "public"."debts" to "anon";

grant truncate on table "public"."debts" to "anon";

grant update on table "public"."debts" to "anon";

grant delete on table "public"."debts" to "authenticated";

grant insert on table "public"."debts" to "authenticated";

grant references on table "public"."debts" to "authenticated";

grant select on table "public"."debts" to "authenticated";

grant trigger on table "public"."debts" to "authenticated";

grant truncate on table "public"."debts" to "authenticated";

grant update on table "public"."debts" to "authenticated";

grant delete on table "public"."debts" to "service_role";

grant insert on table "public"."debts" to "service_role";

grant references on table "public"."debts" to "service_role";

grant select on table "public"."debts" to "service_role";

grant trigger on table "public"."debts" to "service_role";

grant truncate on table "public"."debts" to "service_role";

grant update on table "public"."debts" to "service_role";

grant delete on table "public"."deleted_fillings" to "anon";

grant insert on table "public"."deleted_fillings" to "anon";

grant references on table "public"."deleted_fillings" to "anon";

grant select on table "public"."deleted_fillings" to "anon";

grant trigger on table "public"."deleted_fillings" to "anon";

grant truncate on table "public"."deleted_fillings" to "anon";

grant update on table "public"."deleted_fillings" to "anon";

grant delete on table "public"."deleted_fillings" to "authenticated";

grant insert on table "public"."deleted_fillings" to "authenticated";

grant references on table "public"."deleted_fillings" to "authenticated";

grant select on table "public"."deleted_fillings" to "authenticated";

grant trigger on table "public"."deleted_fillings" to "authenticated";

grant truncate on table "public"."deleted_fillings" to "authenticated";

grant update on table "public"."deleted_fillings" to "authenticated";

grant delete on table "public"."deleted_fillings" to "service_role";

grant insert on table "public"."deleted_fillings" to "service_role";

grant references on table "public"."deleted_fillings" to "service_role";

grant select on table "public"."deleted_fillings" to "service_role";

grant trigger on table "public"."deleted_fillings" to "service_role";

grant truncate on table "public"."deleted_fillings" to "service_role";

grant update on table "public"."deleted_fillings" to "service_role";


  create policy "Allow delete access"
  on "public"."debts"
  as permissive
  for delete
  to public
using (true);



  create policy "Allow insert access"
  on "public"."debts"
  as permissive
  for insert
  to public
with check (true);



  create policy "Allow read access"
  on "public"."debts"
  as permissive
  for select
  to public
using (true);



  create policy "Allow update access"
  on "public"."debts"
  as permissive
  for update
  to public
using (true);



  create policy "Enable access for authenticated users"
  on "public"."deleted_fillings"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Allow insert access"
  on "public"."fillings"
  as permissive
  for insert
  to public
with check (true);



  create policy "Allow read access"
  on "public"."fillings"
  as permissive
  for select
  to public
using (true);



  create policy "Allow update access"
  on "public"."fillings"
  as permissive
  for update
  to public
using (true);



