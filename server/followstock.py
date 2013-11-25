
from flask import request, render_template, jsonify, make_response

import rethinkdb as r
import dbconfig as db
from app import app

@app.route("/follow", methods = ["POST"])
def followStock():
    userDataList = r.table(db.USER_TABLE).get_all(
        request.cookies.get(db.AUTH_COOKIE),
        index = db.USER_SECONDARY_KEY
    ).run(db.CONN)

    if len(userDataList) > 0:
        stockName = request.form["stock_name"]
        userData = userDataList[0]
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


