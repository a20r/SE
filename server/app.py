
from flask import Flask

app = Flask(__name__)
app.config.from_object(__name__)

import dbconfig as db
from manageusers import *
from financecache import *
from pageserver import *
from followstock import *

def run(host, port):
    app.run(
        host = host,
        port = int(port),
        debug = True
    )

