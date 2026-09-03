import os
import sqlite3

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.db.session import Base
import app.models


# ---------------------------------------------------------
# 1. PostgreSQL connection
# ---------------------------------------------------------

POSTGRES_URL = os.environ.get("POSTGRES_URL")

if not POSTGRES_URL:
    raise RuntimeError(
        "POSTGRES_URL environment variable is not set."
    )


# ---------------------------------------------------------
# 2. Database engines
# ---------------------------------------------------------

sqlite_path = "ticket_booking.db"

sqlite_conn = sqlite3.connect(sqlite_path)
sqlite_conn.row_factory = sqlite3.Row

postgres_engine = create_engine(POSTGRES_URL)


# ---------------------------------------------------------
# 3. Create PostgreSQL tables
# ---------------------------------------------------------

print("Creating PostgreSQL tables...")

Base.metadata.create_all(bind=postgres_engine)

print("PostgreSQL tables created.")


# ---------------------------------------------------------
# 4. Get table order based on foreign keys
# ---------------------------------------------------------

tables = list(Base.metadata.sorted_tables)

print("\nTables will be migrated in this order:")

for table in tables:
    print(f"  - {table.name}")


# ---------------------------------------------------------
# 5. Copy data
# ---------------------------------------------------------

with postgres_engine.begin() as pg_conn:
    print("\nClearing existing PostgreSQL data...")

    # Delete existing rows so the migration can safely restart.
    # CASCADE handles dependent tables.
    pg_conn.execute(
        text("TRUNCATE TABLE " + ", ".join(
            f'"{table.name}"' for table in reversed(tables)
        ) + " RESTART IDENTITY CASCADE")
    )

    print("Existing PostgreSQL data cleared.")
    for table in tables:

        table_name = table.name

        print(f"\nMigrating: {table_name}")

        rows = sqlite_conn.execute(
            f'SELECT * FROM "{table_name}"'
        ).fetchall()

        if not rows:
            print("  No rows.")
            continue

        columns = [column.name for column in table.columns]

        column_names = ", ".join(
            f'"{column}"' for column in columns
        )

        parameter_names = ", ".join(
            f":{column}" for column in columns
        )

        insert_query = text(
            f"""
            INSERT INTO "{table_name}"
            ({column_names})
            VALUES
            ({parameter_names})
            """
        )

        for row in rows:

            data = {} 

            for column in columns:

                value = row[column]

                # SQLite stores BOOLEAN values as 0/1.
                # PostgreSQL expects True/False.
                try:
                    column_type = table.columns[column].type

                    if column_type.python_type is bool:
                        value = bool(value)

                except (NotImplementedError, AttributeError):
                    pass

                data[column] = value

            pg_conn.execute(insert_query, data)

        print(f"  Migrated {len(rows)} rows.")


# ---------------------------------------------------------
# 6. Fix PostgreSQL sequences
# ---------------------------------------------------------

print("\nFixing PostgreSQL ID sequences...")

with postgres_engine.begin() as pg_conn:

    for table in tables:

        # Look for an integer primary-key column
        primary_keys = list(table.primary_key.columns)

        if len(primary_keys) != 1:
            continue

        pk = primary_keys[0]

        if not hasattr(pk.type, "python_type"):
            continue

        try:
            if pk.type.python_type is not int:
                continue
        except Exception:
            continue

        table_name = table.name
        column_name = pk.name

        sequence_name = f"{table_name}_{column_name}_seq"

        try:
            pg_conn.execute(
                text(
                    f"""
                    SELECT setval(
                        pg_get_serial_sequence(
                            :table_name,
                            :column_name
                        ),
                        COALESCE(
                            (SELECT MAX("{column_name}")
                             FROM "{table_name}"),
                            1
                        )
                    )
                    """
                ),
                {
                    "table_name": table_name,
                    "column_name": column_name,
                },
            )

            print(f"  Fixed sequence for {table_name}.{column_name}")

        except Exception:
            # Some tables may not use PostgreSQL sequences.
            pass


# ---------------------------------------------------------
# 7. Verify row counts
# ---------------------------------------------------------

print("\nVerifying row counts...")

with postgres_engine.connect() as pg_conn:

    for table in tables:

        table_name = table.name

        sqlite_count = sqlite_conn.execute(
            f'SELECT COUNT(*) FROM "{table_name}"'
        ).fetchone()[0]

        postgres_count = pg_conn.execute(
            text(
                f'SELECT COUNT(*) FROM "{table_name}"'
            )
        ).scalar()

        status = "OK" if sqlite_count == postgres_count else "MISMATCH"

        print(
            f"  {table_name}: "
            f"SQLite={sqlite_count}, "
            f"PostgreSQL={postgres_count} "
            f"[{status}]"
        )


sqlite_conn.close()
postgres_engine.dispose()

print("\nMigration complete.")