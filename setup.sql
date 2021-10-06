CREATE TABLE "users" (
    "email" TEXT PRIMARY KEY,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student',
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP WITH TIME ZONE
);

CREATE TABLE "courses" (
    "name" TEXT PRIMARY KEY,
    "display_name" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "instructors" (
    "course_name" TEXT REFERENCES "courses" ("name") ON DELETE CASCADE ON UPDATE CASCADE,
    "instructor_name" TEXT REFERENCES "users" ("name") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "students" (
    "course_name" TEXT REFERENCES "courses" ("name") ON DELETE CASCADE ON UPDATE CASCADE,
    "student_name" TEXT REFERENCES "users" ("name") ON DELETE CASCADE ON UPDATE CASCADE
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
    "student_name" TEXT REFERENCES "users" ("name"),
    "assignment_name" TEXT,
    "course_name" TEXT,
    "submitted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tree" JSONB,
    "correct" BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY ("assignment_name", "course_name")
        REFERENCES "assignments" ("name", "course_name") ON DELETE CASCADE ON UPDATE CASCADE
);
