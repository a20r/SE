
from flask import Flask

app = Flask(__name__)
app.config.from_object(__name__)

from server.manageusers import *
from server.financecache import *

if __name__ == '__main__':
    if len(sys.argv) == 1:
        app.run(host='localhost', port=8080)
    elif len(sys.argv) == 3:
        app.run(host=sys.argv[1], port=int(sys.argv[2]))

