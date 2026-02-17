CREATE TYPE user_role AS ENUM ('student', 'staff', 'admin');
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,

    username VARCHAR(15) UNIQUE NOT NULL,

    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL
        CHECK (email LIKE '%@charlotte.edu'),

    password TEXT NOT NULL,  -- hashed password (never store plain text)

    role user_role NOT NULL DEFAULT 'student',

    profile_image_url TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    graduation_year int(4) NOT NULL
); 