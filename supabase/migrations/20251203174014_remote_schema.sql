


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_my_role"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_role text;
BEGIN
  -- Check employees table (Manager/Owner/Accountant)
  SELECT role INTO user_role FROM public.employees WHERE auth_id = auth.uid();
  IF user_role IS NOT NULL THEN RETURN user_role; END IF;

  -- Check drivers table
  SELECT 'driver' INTO user_role FROM public.drivers WHERE auth_id = auth.uid();
  IF user_role IS NOT NULL THEN RETURN user_role; END IF;

  RETURN 'anon';
END;
$$;


ALTER FUNCTION "public"."get_my_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (new.id, new.email, 'accountant', new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Checks if the user is Owner or Manager
  RETURN EXISTS (
    SELECT 1 FROM public.employees 
    WHERE auth_id = auth.uid() 
    AND role IN ('owner', 'manager')
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_safe"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.employees 
    WHERE auth_id = auth.uid() 
    AND role IN ('owner', 'manager')
  );
END;
$$;


ALTER FUNCTION "public"."is_admin_safe"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_driver"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.drivers 
    WHERE auth_id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."is_driver"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_customer_last_order"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE customers
    SET last_order_date = NEW.created_at
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_customer_last_order"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."areas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "name" "text" NOT NULL,
    "driver_id" "uuid",
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."areas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cars" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "name" "text" NOT NULL,
    "tank_capacity" numeric,
    "color" "text",
    "plate_number" "text",
    "car_number" "text",
    "note" "text",
    "photo_url" "text",
    "id_photo_url" "text",
    "driver_id" "uuid"
);


ALTER TABLE "public"."cars" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drivers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "name" "text" NOT NULL,
    "phone" "text",
    "commission_rate" numeric DEFAULT 0,
    "role" "text" DEFAULT 'driver'::"text",
    "is_active" boolean DEFAULT true,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "salary" numeric DEFAULT 0,
    "job_title" "text",
    "job_description" "text",
    "car_name" "text",
    "commission_rules" "jsonb",
    "linked_driver_id" "uuid",
    "phone2" "text",
    "phone3" "text",
    "username" "text",
    "car_id" "uuid",
    "photo_url" "text"
);


ALTER TABLE "public"."drivers" OWNER TO "postgres";


COMMENT ON COLUMN "public"."drivers"."salary" IS 'Fixed salary for employees (role: employee)';



COMMENT ON COLUMN "public"."drivers"."job_title" IS 'Job title like Accountant, Worker, etc.';



COMMENT ON COLUMN "public"."drivers"."car_name" IS 'Name/Type of the car (for drivers)';



COMMENT ON COLUMN "public"."drivers"."commission_rules" IS 'JSON object storing commission rules per tank type';



COMMENT ON COLUMN "public"."drivers"."phone2" IS 'Secondary phone number';



COMMENT ON COLUMN "public"."drivers"."phone3" IS 'Tertiary phone number';



COMMENT ON COLUMN "public"."drivers"."username" IS 'Username for login/system identification';



COMMENT ON COLUMN "public"."drivers"."car_id" IS 'Link to the cars table';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "role" "text" DEFAULT 'accountant'::"text",
    "full_name" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tank_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "filling_days" integer NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."tank_types" OWNER TO "postgres";


ALTER TABLE ONLY "public"."areas"
    ADD CONSTRAINT "areas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cars"
    ADD CONSTRAINT "cars_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drivers"
    ADD CONSTRAINT "drivers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tank_types"
    ADD CONSTRAINT "tank_types_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_tank_types_is_active" ON "public"."tank_types" USING "btree" ("is_active");



ALTER TABLE ONLY "public"."areas"
    ADD CONSTRAINT "areas_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id");



ALTER TABLE ONLY "public"."cars"
    ADD CONSTRAINT "cars_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id");



ALTER TABLE ONLY "public"."drivers"
    ADD CONSTRAINT "drivers_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id");



ALTER TABLE ONLY "public"."drivers"
    ADD CONSTRAINT "drivers_linked_driver_id_fkey" FOREIGN KEY ("linked_driver_id") REFERENCES "public"."drivers"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow insert for authenticated users" ON "public"."tank_types" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Allow read access for authenticated users" ON "public"."tank_types" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow update for authenticated users" ON "public"."tank_types" FOR UPDATE TO "authenticated", "anon" USING (true);



CREATE POLICY "Delete Tank Type" ON "public"."tank_types" FOR DELETE TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable all access" ON "public"."areas" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all access for all users" ON "public"."drivers" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all access for authenticated users" ON "public"."cars" USING (true) WITH CHECK (true);



CREATE POLICY "Public profiles" ON "public"."profiles" FOR SELECT USING (true);



ALTER TABLE "public"."areas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cars" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drivers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tank_types" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."get_my_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_safe"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_safe"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_safe"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_driver"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_driver"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_driver"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_customer_last_order"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_customer_last_order"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_customer_last_order"() TO "service_role";


















GRANT ALL ON TABLE "public"."areas" TO "anon";
GRANT ALL ON TABLE "public"."areas" TO "authenticated";
GRANT ALL ON TABLE "public"."areas" TO "service_role";



GRANT ALL ON TABLE "public"."cars" TO "anon";
GRANT ALL ON TABLE "public"."cars" TO "authenticated";
GRANT ALL ON TABLE "public"."cars" TO "service_role";



GRANT ALL ON TABLE "public"."drivers" TO "anon";
GRANT ALL ON TABLE "public"."drivers" TO "authenticated";
GRANT ALL ON TABLE "public"."drivers" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."tank_types" TO "anon";
GRANT ALL ON TABLE "public"."tank_types" TO "authenticated";
GRANT ALL ON TABLE "public"."tank_types" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

drop policy "Delete Tank Type" on "public"."tank_types";


  create policy "Delete Tank Type"
  on "public"."tank_types"
  as permissive
  for delete
  to anon, authenticated
using (true);


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Allow authenticated staff update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'customer-docs'::text));



  create policy "Allow authenticated staff upload"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'customer-docs'::text));



  create policy "Allow authenticated staff view"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'customer-docs'::text));



  create policy "Allow authenticated users to update customer docs"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'customer-docs'::text));



  create policy "Allow authenticated users to update files"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'customer-docs'::text));



  create policy "Allow authenticated users to upload customer docs"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'customer-docs'::text));



  create policy "Allow authenticated users to upload files"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'customer-docs'::text));



  create policy "Allow authenticated users to view customer docs"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'customer-docs'::text));



  create policy "Allow authenticated users to view files"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'customer-docs'::text));



  create policy "Public Access 1xef2je_0"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'car-photos'::text));



  create policy "Public Access 1xef2je_1"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'car-photos'::text));



  create policy "Public Access 1xef2je_2"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'car-photos'::text));



  create policy "Public Access 1xef2je_3"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'car-photos'::text));



  create policy "User Profiles Pictures 1m8pi24_0"
  on "storage"."objects"
  as permissive
  for select
  to anon, authenticated
using ((bucket_id = 'user-profiles'::text));



  create policy "User Profiles Pictures 1m8pi24_1"
  on "storage"."objects"
  as permissive
  for insert
  to anon, authenticated
with check ((bucket_id = 'user-profiles'::text));



  create policy "User Profiles Pictures 1m8pi24_2"
  on "storage"."objects"
  as permissive
  for update
  to anon, authenticated
using ((bucket_id = 'user-profiles'::text));



  create policy "User Profiles Pictures 1m8pi24_3"
  on "storage"."objects"
  as permissive
  for delete
  to anon, authenticated
using ((bucket_id = 'user-profiles'::text));



