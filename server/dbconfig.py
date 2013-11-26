
import rethinkdb as r

HOST = "localhost"
PORT = 28015
DB = "finance"

CACHE_TABLE = "cache"
USER_TABLE = "users"
HISTORICAL_TABLE = "history"

CACHE_PRIMARY_KEY = "index"
HISTORICAL_PRIMARY_KEY = CACHE_PRIMARY_KEY
USER_PRIMARY_KEY = "username"

USER_SECONDARY_KEY = "token"

# Shouldn't really be here but this is where my global vars live
# Shows the database update interval in seconds
UPDATE_INTERVAL = 1 * 60

HISTORICAL_INTERVAL = 60 * 60 * 24

AUTH_COOKIE = "stock_auth_token"

STOCKS_FOLLOWING_KEY = "stocks_following"
HISTORY_LIST = "history_list"
IN_LONDON = ".L"

UPDATING_REALTIME = False
UPDATING_HISTORICAL = False

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
        HISTORICAL_TABLE,
        primary_key = HISTORICAL_PRIMARY_KEY
    ).run(conn)

    r.db(DB).table_create(
        USER_TABLE,
        primary_key = USER_PRIMARY_KEY
    ).run(conn)

    r.db(DB).table(USER_TABLE).index_create(
        USER_SECONDARY_KEY
    ).run(conn)

def getStockNames(source = "static/data/key.csv"):
    return dict(
        (
            line.split(",")[1].strip().upper(),
            line.split(",")[0].strip()
        ) for line in open(source)
    )

# because python is stupid
CONN = init()
STOCK_MAP = getStockNames()

""" Test Functions """

def test_init():
    print init()

if __name__ == "__main__":
    test_initDB()

