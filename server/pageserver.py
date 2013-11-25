
from flask import request, redirect, url_for, abort, jsonify, render_template

from app import app

STATIC_DIR = "static/"

@app.route("/<filename>", methods = ["GET"])
def serveHtmlPage(filename):
    render_template(filename)

@app.route("/<filetype>/<filename>", methods = ["GET"])
def serveScript(filetype, filename):
    with open(STATIC_DIR + filetype + "/" + filename) as f:
        return f.read()
