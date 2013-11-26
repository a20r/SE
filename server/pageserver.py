
from flask import request, redirect, url_for, abort, jsonify, render_template
from flask import make_response, Response
from app import app

STATIC_DIR = "static/"

MIME_DICT = {
    "js": "text/javascript",
    "css": "text/css",
    "img": "image/png",
    "libraries": "text/javascript",
    "data": "text/csv"
}

@app.route("/<filename>", methods = ["GET"])
def serveHtmlPage(filename):
    if filename == "favicon.ico":
        with open(STATIC_DIR + "img/favicon.ico") as f:
            return Response(f.read(), mimetype = "image/x-icon")

    return render_template(filename)

@app.route("/<filetype>/<filename>", methods = ["GET"])
def serveScript(filetype, filename):
    with open(STATIC_DIR + filetype + "/" + filename) as f:
        return Response(f.read(), mimetype = MIME_DICT[filetype])
