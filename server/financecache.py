
from flask import Flask, request, redirect, url_for, abort, jsonify
import rethinkdb as r
import dbconfig as db
import yahoofin as yf
import json
from app import app

conn = db.init()

@app.route("/get_stock/<stockName>/<infoType>", methods = ["GET"])
def getStock(stockName, infoType):
    stock = yf.StockInfo(stockName)
    data = getattr(stock, infoType)()
    return json.dumps({infoType: data})


