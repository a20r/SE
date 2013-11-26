
from flask import request, render_template, jsonify, make_response

import rethinkdb as r
from app import app, db
import json

@app.route("/unfollow", methods = ["POST"])
def unfollow():
    pass


