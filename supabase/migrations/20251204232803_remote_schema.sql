drop policy "Enable all access" on "public"."areas";

drop policy "Enable all access for authenticated users" on "public"."cars";

drop policy "Enable all access for all users" on "public"."drivers";

drop policy "Public profiles" on "public"."profiles";

drop policy "Allow insert for authenticated users" on "public"."tank_types";

drop policy "Allow read access for authenticated users" on "public"."tank_types";

drop policy "Allow update for authenticated users" on "public"."tank_types";

drop policy "Delete Tank Type" on "public"."tank_types";


  create table "public"."customers" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "name" text not null,
    "tank_no" text not null,
    "phone" text not null,
    "phone2" text,
    "phone3" text,
    "address" text,
    "latitude" numeric,
    "longitude" numeric,
    "tank_type_id" uuid,
    "area_id" uuid,
    "driver_id" uuid,
    "doc1_url" text,
    "doc2_url" text,
    "last_filling" date
      );


CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);

CREATE UNIQUE INDEX customers_tank_no_key ON public.customers USING btree (tank_no);

alter table "public"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "public"."customers" add constraint "customers_area_id_fkey" FOREIGN KEY (area_id) REFERENCES public.areas(id) ON DELETE SET NULL not valid;

alter table "public"."customers" validate constraint "customers_area_id_fkey";

alter table "public"."customers" add constraint "customers_driver_id_fkey" FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL not valid;

alter table "public"."customers" validate constraint "customers_driver_id_fkey";

alter table "public"."customers" add constraint "customers_tank_no_key" UNIQUE using index "customers_tank_no_key";

alter table "public"."customers" add constraint "customers_tank_type_id_fkey" FOREIGN KEY (tank_type_id) REFERENCES public.tank_types(id) ON DELETE SET NULL not valid;

alter table "public"."customers" validate constraint "customers_tank_type_id_fkey";

grant delete on table "public"."customers" to "anon";

grant insert on table "public"."customers" to "anon";

grant references on table "public"."customers" to "anon";

grant select on table "public"."customers" to "anon";

grant trigger on table "public"."customers" to "anon";

grant truncate on table "public"."customers" to "anon";

grant update on table "public"."customers" to "anon";

grant delete on table "public"."customers" to "authenticated";

grant insert on table "public"."customers" to "authenticated";

grant references on table "public"."customers" to "authenticated";

grant select on table "public"."customers" to "authenticated";

grant trigger on table "public"."customers" to "authenticated";

grant truncate on table "public"."customers" to "authenticated";

grant update on table "public"."customers" to "authenticated";

grant delete on table "public"."customers" to "service_role";

grant insert on table "public"."customers" to "service_role";

grant references on table "public"."customers" to "service_role";

grant select on table "public"."customers" to "service_role";

grant trigger on table "public"."customers" to "service_role";

grant truncate on table "public"."customers" to "service_role";

grant update on table "public"."customers" to "service_role";


  create policy "Read Areas"
  on "public"."areas"
  as permissive
  for select
  to public
using (true);



  create policy "Staff Full Access"
  on "public"."areas"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Staff Full Access"
  on "public"."cars"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Read Drivers"
  on "public"."drivers"
  as permissive
  for select
  to public
using (true);



  create policy "Staff Full Access"
  on "public"."drivers"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Staff Full Access"
  on "public"."profiles"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Read Tank Types"
  on "public"."tank_types"
  as permissive
  for select
  to public
using (true);



  create policy "Staff Full Access"
  on "public"."tank_types"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Allow Public Read"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'customer_docs'::text));



  create policy "Allow Uploads"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'customer_docs'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Auth Delete Docs"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'customer-docs'::text));



  create policy "Auth Upload Docs"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'customer-docs'::text));



  create policy "Public Access Docs"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'customer-docs'::text));



