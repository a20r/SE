
from contextlib import closing
from flask import Flask, request, session, g, redirect, url_for
from flask import abort, render_template, flash, jsonify, make_response
import rethinkdb as r
import dbconfig as db
import uuid
from app import app

COOKIE_NAME = "stock_auth_token"

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

        resp.set_cookie(COOKIE_NAME, "")
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

            resp.set_cookie(COOKIE_NAME, token)
            return resp
        else:
            resp = make_response(
                jsonify(
                    error = 1,
                    message = "Username or password are incorrect",
                    token = None
                )
            )

            resp.set_cookie(COOKIE_NAME, "")
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
            "token": token
        }).run(db.CONN)

        resp = make_response(
            jsonify(
                error = 0,
                message = "No error",
                token = token
            )
        )

        resp.set_cookie(COOKIE_NAME, token)
        return resp
    else:
        resp = make_response(
            jsonify(
                error = 1,
                message = "User already exists",
                token = None
            )
        )

        resp.set_cookie(COOKIE_NAME, "")
        return resp

@app.route('/logout')
def logout():
    pass


