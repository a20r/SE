
from flask import Flask
import threading

app = Flask(__name__)
app.config.from_object(__name__)

import dbconfig as db
from manageusers import *
from financecache import *
from pageserver import *
from followstock import *
from recommendation import *

#updateAllRealtime()
#updateAllHistorical()

def run(host, port):
	"""
    Runs the server
    
    """
    app.run(
        host = host,
        port = int(port),
        debug = True
    )

