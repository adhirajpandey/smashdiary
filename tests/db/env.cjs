// Matches docker-compose.yml. Overrides any DATABASE_URL in the shell so these tests never touch production.
process.env.DATABASE_URL = "postgres://postgres:postgres@127.0.0.1:5433/smashdiary";
process.env.LOG_LEVEL = "warn";
