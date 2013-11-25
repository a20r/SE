
from flask import request, redirect, url_for, abort, jsonify
import rethinkdb as r
import dbconfig as db
import yahoofin as yf
import json
from app import app
import datetime, time

conn = db.init()

def getTime(toConvert = None):
    if toConvert == None:
        return time.mktime(
            datetime.datetime.now().timetuple()
        )
    else:
        return time.mktime(
            toConvert.timetuple()
        )

@app.route("/get_stock/<stockName>/<infoType>", methods = ["GET"])
def getRealtimeStock(stockName, infoType):
    stock = yf.StockInfo(stockName)
    cachedData = r.table(db.TABLE).get(stockName).run(conn)
    infoDict = dict()
    if cachedData == None:
        print "\n-- DB == Inserting New Information ==\n"
        infoDict = stock.all()
        infoDict["index"] = stockName
        infoDict["timestamp"] = getTime()
        r.table(db.TABLE).insert(infoDict).run(conn)
    else:
        elapsedTime = (
            getTime() -
            cachedData["timestamp"]
        )
        if elapsedTime > db.UPDATE_INTERVAL:
            print "\n-- DB == Updating Database ==\n"
            infoDict = stock.all()
            infoDict["index"] = stockName
            infoDict["timestamp"] = getTime()
            r.table(db.TABLE).get(stockName).update(infoDict).run(conn)
        else:
            print "\n-- DB == Using Cached Data ==\n"
            infoDict = cachedData

    del infoDict["timestamp"]
    if infoType == "all":
        return json.dumps({infoType: infoDict})
    else:
        return json.dumps({infoType: infoDict[infoType]})

@app.route("/get_stock_direct/<stockName>/<infoType>", methods = ["GET"])
def getStockDirect(stockName, infoType):
    stock = yf.StockInfo(stockName)
    data = getattr(stock, infoType, None)()
    return json.dumps({infoType: data})
