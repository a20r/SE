
from flask import Flask

app = Flask(__name__)
app.config.from_object(__name__)

#from manageusers import *
from financecache import *
from pageserver import *

def run(host, port):
    app.run(
        host = host,
        port = int(port),
        debug = True
    )

