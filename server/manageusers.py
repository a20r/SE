
from contextlib import closing
from flask import request, session, g, redirect, url_for
from flask import abort, render_template, flash, jsonify, make_response
import rethinkdb as r
import dbconfig as db
import uuid
from app import app

@app.route('/login', methods=["POST"])
def login():
    userData = r.table(db.USER_TABLE).get(
        request.form["username"]
    ).run(db.CONN)

    if userData == None:
        resp = make_response(
            jsonify(
                error = 1,
                message = "User does not exist",
                token = None
            )
        )

        resp.set_cookie(db.AUTH_COOKIE, "")
    else:
        if userData["password"] == request.form["password"]:
            token = str(uuid.uuid1())
            r.table(db.USER_TABLE).get(
                request.form["username"]
            ).update({"token": token}).run(db.CONN)

            # return more data later
            resp = make_response(
                jsonify(
                    error = 0,
                    message = "User logged in",
                    token = token
                )
            )

            resp.set_cookie(db.AUTH_COOKIE, token)
            return resp
        else:
            resp = make_response(
                jsonify(
                    error = 1,
                    message = "Username or password are incorrect",
                    token = None
                )
            )

            resp.set_cookie(db.AUTH_COOKIE, "")
            return resp

@app.route('/register', methods=["POST"])
def register():
    userData = r.table(db.USER_TABLE).get(
        request.form["username"]
    ).run(db.CONN)

    if userData == None:
        token = str(uuid.uuid1())
        r.table(db.USER_TABLE).insert({
            "username": request.form["username"],
            "password": request.form["password"],
            "email": request.form["email"],
            "token": token,
            "stocks_following": list()
        }).run(db.CONN)

        resp = make_response(
            jsonify(
                error = 0,
                message = "No error",
                token = token
            )
        )

        resp.set_cookie(db.AUTH_COOKIE, token)
        return resp
    else:
        resp = make_response(
            jsonify(
                error = 1,
                message = "User already exists",
                token = None
            )
        )

        resp.set_cookie(db.AUTH_COOKIE, "")
        return resp

@app.route('/logout', methods = ["POST"])
def logout():
    userData = r.table(db.USER_TABLE).get_all(
        request.cookies.get(db.AUTH_COOKIE),
        index = db.USER_SECONDARY_KEY
    ).run(db.CONN)

    if len(userData) == 0:
        return jsonify(
            error = 1,
            message = "User with associated token is not logged in",
            token = None
        )
    else:
        resp = make_response(
            jsonify(
                error = 0,
                message = "User logged off",
                token = None
            )
        )

        resp.set_cookie(db.AUTH_COOKIE, "")
        return resp

