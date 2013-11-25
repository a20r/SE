
import rethinkdb as r

HOST = "localhost"
PORT = 28015
DB = "finance"
TABLE = "cache"
PRIMARY_KEY = "index"

# Shouldn't really be here but this is where my global vars live
# Shows the database update interval in seconds
UPDATE_INTERVAL = 5 * 60

def init():
    conn = r.connect()
    if not DB in r.db_list().run(conn):
        create(conn)

    return r.connect(
        host = HOST,
        port = PORT,
        db = DB
    )

def create(conn):
    r.db_create(DB).run(conn)
    r.db(DB).table_create(
        TABLE,
        primary_key = PRIMARY_KEY
    ).run(conn)


""" Test Functions """

def test_init():
    init()

if __name__ == "__main__":
    test_initDB()

