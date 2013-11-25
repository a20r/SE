
from flask import Flask
import sys

app = Flask(__name__)
app.config.from_object(__name__)

#from manageusers import *
from financecache import *

def run():
    if len(sys.argv) == 1:
        app.run(host='localhost', port=8000, debug = True)
    elif len(sys.argv) == 3:
        app.run(host=sys.argv[1], port=int(sys.argv[2]), debug = True)

