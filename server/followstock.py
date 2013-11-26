
from flask import request, render_template, jsonify, make_response

import rethinkdb as r
import dbconfig as db
from app import app
import json

@app.route("/follow", methods = ["POST"])
def followStock():
    userData = r.table(db.USER_TABLE).get_all(
        request.cookies.get(db.AUTH_COOKIE),
        index = db.USER_SECONDARY_KEY
    )[0].run(db.CONN)

    if userData:
        stockName = request.form["stock_name"]
        if not stockName in db.STOCK_MAP.keys():
            return jsonify(
                error = 1,
                message = "Cannot follow an imaginary stock"
            )

        if not stockName in userData[db.STOCKS_FOLLOWING_KEY]:
            userData[db.STOCKS_FOLLOWING_KEY].append(stockName)
            r.table(db.USER_TABLE).get(userData["username"]).update(
                userData
            ).run(db.CONN)
            return jsonify(
                error = 0,
                message = "No error"
            )
        else:
            return jsonify(
                error = 1,
                message = "User is already following that stock"
            )
    else:
        resp = make_response(
            jsonify(
                error = 1,
                message = "User with associated token does not exist"
            )
        )

        resp.set_cookie(db.AUTH_COOKIE, "")
        return resp

@app.route("/get_following", methods = ["GET"])
def getFollowing():
    userData = r.table(db.USER_TABLE).get_all(
        request.cookies.get(db.AUTH_COOKIE),
        index = db.USER_SECONDARY_KEY
    )[0].run(db.CONN)
    print userData
    if userData:
        return json.dumps(userData[db.STOCKS_FOLLOWING_KEY])
    else:
        return json.dumps(list())

@app.route("/unfollow", methods = ["POST"])
def unfollow():
    pass


