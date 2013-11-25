
import rethinkdb as r

HOST = "localhost"
PORT = 28015
DB = "finance"
CACHE_TABLE = "cache"
USER_TABLE = "users"
CACHE_PRIMARY_KEY = "index"
USER_PRIMARY_KEY = "username"
USER_SECONDARY_KEY = "token"

# Shouldn't really be here but this is where my global vars live
# Shows the database update interval in seconds
UPDATE_INTERVAL = 5 * 60

AUTH_COOKIE = "stock_auth_token"

STOCKS_FOLLOWING_KEY = "stocks_following"

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
        CACHE_TABLE,
        primary_key = CACHE_PRIMARY_KEY
    ).run(conn)
    r.db(DB).table_create(
        USER_TABLE,
        primary_key = USER_PRIMARY_KEY
    ).run(conn)
    r.db(DB).table(USER_TABLE).index_create(
        USER_SECONDARY_KEY
    ).run(conn)

# because python is stupid
CONN = init()

""" Test Functions """

def test_init():
    init()

if __name__ == "__main__":
    test_initDB()

