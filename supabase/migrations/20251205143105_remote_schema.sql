
  create table "public"."fillings" (
    "id" uuid not null default gen_random_uuid(),
    "customer_id" uuid,
    "driver_id" uuid,
    "price" numeric(10,2) default 0,
    "paid_amount" numeric(10,2) default 0,
    "payment_status" text default 'unpaid'::text,
    "is_free" boolean default false,
    "notes" text,
    "created_by" text,
    "filling_date" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."fillings" enable row level security;


  create table "public"."requests" (
    "id" uuid not null default gen_random_uuid(),
    "customer_id" uuid,
    "request_type" text not null,
    "status" text default 'pending'::text,
    "created_by" text,
    "notes" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "driver_id" uuid
      );


alter table "public"."requests" enable row level security;

alter table "public"."customers" add column "created_by" text;

CREATE UNIQUE INDEX fillings_pkey ON public.fillings USING btree (id);

CREATE INDEX idx_fillings_customer_date ON public.fillings USING btree (customer_id, filling_date DESC);

CREATE INDEX idx_fillings_payment_status ON public.fillings USING btree (payment_status);

CREATE INDEX idx_requests_customer_id ON public.requests USING btree (customer_id);

CREATE INDEX idx_requests_customer_status ON public.requests USING btree (customer_id, status);

CREATE INDEX idx_requests_status ON public.requests USING btree (status);

CREATE UNIQUE INDEX requests_pkey ON public.requests USING btree (id);

alter table "public"."fillings" add constraint "fillings_pkey" PRIMARY KEY using index "fillings_pkey";

alter table "public"."requests" add constraint "requests_pkey" PRIMARY KEY using index "requests_pkey";

alter table "public"."fillings" add constraint "fillings_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE not valid;

alter table "public"."fillings" validate constraint "fillings_customer_id_fkey";

alter table "public"."fillings" add constraint "fillings_driver_id_fkey" FOREIGN KEY (driver_id) REFERENCES public.drivers(id) not valid;

alter table "public"."fillings" validate constraint "fillings_driver_id_fkey";

alter table "public"."requests" add constraint "requests_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE not valid;

alter table "public"."requests" validate constraint "requests_customer_id_fkey";

alter table "public"."requests" add constraint "requests_driver_id_fkey" FOREIGN KEY (driver_id) REFERENCES public.drivers(id) not valid;

alter table "public"."requests" validate constraint "requests_driver_id_fkey";

grant delete on table "public"."fillings" to "anon";

grant insert on table "public"."fillings" to "anon";

grant references on table "public"."fillings" to "anon";

grant select on table "public"."fillings" to "anon";

grant trigger on table "public"."fillings" to "anon";

grant truncate on table "public"."fillings" to "anon";

grant update on table "public"."fillings" to "anon";

grant delete on table "public"."fillings" to "authenticated";

grant insert on table "public"."fillings" to "authenticated";

grant references on table "public"."fillings" to "authenticated";

grant select on table "public"."fillings" to "authenticated";

grant trigger on table "public"."fillings" to "authenticated";

grant truncate on table "public"."fillings" to "authenticated";

grant update on table "public"."fillings" to "authenticated";

grant delete on table "public"."fillings" to "service_role";

grant insert on table "public"."fillings" to "service_role";

grant references on table "public"."fillings" to "service_role";

grant select on table "public"."fillings" to "service_role";

grant trigger on table "public"."fillings" to "service_role";

grant truncate on table "public"."fillings" to "service_role";

grant update on table "public"."fillings" to "service_role";

grant delete on table "public"."requests" to "anon";

grant insert on table "public"."requests" to "anon";

grant references on table "public"."requests" to "anon";

grant select on table "public"."requests" to "anon";

grant trigger on table "public"."requests" to "anon";

grant truncate on table "public"."requests" to "anon";

grant update on table "public"."requests" to "anon";

grant delete on table "public"."requests" to "authenticated";

grant insert on table "public"."requests" to "authenticated";

grant references on table "public"."requests" to "authenticated";

grant select on table "public"."requests" to "authenticated";

grant trigger on table "public"."requests" to "authenticated";

grant truncate on table "public"."requests" to "authenticated";

grant update on table "public"."requests" to "authenticated";

grant delete on table "public"."requests" to "service_role";

grant insert on table "public"."requests" to "service_role";

grant references on table "public"."requests" to "service_role";

grant select on table "public"."requests" to "service_role";

grant trigger on table "public"."requests" to "service_role";

grant truncate on table "public"."requests" to "service_role";

grant update on table "public"."requests" to "service_role";


  create policy "Enable access for authenticated users"
  on "public"."fillings"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Enable access for authenticated users"
  on "public"."requests"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



