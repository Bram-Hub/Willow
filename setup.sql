-------------------------
--  connect-pg-simple  --
-------------------------
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
	"sess" json NOT NULL,
	"expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX "IDX_session_expire" ON "session" ("expire");

--------------
--  willow  --
--------------
CREATE TABLE "users" (
    "email" TEXT PRIMARY KEY,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "rcs_id" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP WITH TIME ZONE,
    "reset_token" UUID UNIQUE,
    "reset_token_created_at" TIMESTAMP WITH TIME ZONE
);

CREATE OR REPLACE FUNCTION "on_update_reset_token"()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS
$$
    BEGIN
        NEW."reset_token_created_at" = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
$$;

DROP TRIGGER IF EXISTS "on_update_reset_token" ON "users";

CREATE TRIGGER "on_update_reset_token"
    BEFORE INSERT OR UPDATE
    ON "users"
    FOR EACH ROW
    WHEN (NEW."reset_token" IS NOT NULL)
    EXECUTE PROCEDURE "on_update_reset_token"();

CREATE TABLE "courses" (
    "name" TEXT PRIMARY KEY,
    "display_name" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "instructors" (
    "course_name" TEXT REFERENCES "courses" ("name") ON DELETE CASCADE ON UPDATE CASCADE,
    "instructor_email" TEXT /* REFERENCES "users" ("email") ON DELETE CASCADE ON UPDATE CASCADE */,
    PRIMARY KEY ("course_name", "instructor_email")
);

CREATE TABLE "students" (
    "course_name" TEXT REFERENCES "courses" ("name") ON DELETE CASCADE ON UPDATE CASCADE,
    "student_email" TEXT /* REFERENCES "users" ("email") ON DELETE CASCADE ON UPDATE CASCADE */,
    PRIMARY KEY ("course_name", "student_email")
);

CREATE TABLE "assignments" (
    "name" TEXT,
    "course_name" TEXT REFERENCES "courses" ("name") ON DELETE CASCADE ON UPDATE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP WITH TIME ZONE,
    "tree" JSONB NOT NULL,
    PRIMARY KEY ("name", "course_name")
);

CREATE TABLE "submissions" (
    "student_email" TEXT REFERENCES "users" ("email"),
    "assignment_name" TEXT,
    "course_name" TEXT,
    "submitted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tree" JSONB,
    "correct" BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY ("assignment_name", "course_name")
        REFERENCES "assignments" ("name", "course_name") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("course_name", "student_email")
        REFERENCES "students" ("course_name", "student_email") ON DELETE CASCADE ON UPDATE CASCADE
);
