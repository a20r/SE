
from flask import request, redirect, url_for, abort, jsonify
import rethinkdb as r
import yahoofin as yf
import json
from app import app, db
import datetime, time
import threading

REALTIME_IN_USE = False
HISTORICAL_IN_USE = False

def getTime(toConvert = None):
    if toConvert == None:
        return time.mktime(
            datetime.datetime.now().timetuple()
        )
    else:
        return time.mktime(
            toConvert.timetuple()
        )

def daysToSeconds(dayInt):
    return dayInt * 24 * 60 * 60

def dateToString(dateToConvert):
    return "".join(
        str(i) for i in [
            dateToConvert.year,
            dateToConvert.month,
            dateToConvert.day
        ]
    )

def tryFloat(value):
    try:
        return float(value)
    except:
        return value

def createHistoryDictList(histList):
    if histList[0][0][0] == "<":
        return [dict()]

    return [
        dict(
            (
                histList[0][i],
                tryFloat(histList[j][i])
            ) for i in range(len(histList[0]))
        ) for j in range(1, len(histList))
    ]


def getHistoricalData(stockName, startDate):
    stockName = stockName.upper()
    startDate = dateToString(startDate)
    endDate = dateToString(datetime.datetime.now())

    if not stockName in db.STOCK_MAP.keys():
        return dict(
            error = 1,
            message = "The info you want is not what I can give"
        )

    stock = yf.StockInfo(stockName + db.IN_LONDON)
    cachedData = r.table(db.HISTORICAL_TABLE).get(stockName).run(db.CONN)
    infoDict = dict()

    if cachedData == None:
        print "\n-- DB -- " + stockName + " == Inserting New Information ==\n"
        histList = stock.historical_prices(startDate, endDate)
        infoDict["history_list"] = createHistoryDictList(histList)
        infoDict["index"] = stockName
        infoDict["name"] = db.STOCK_MAP[stockName]
        infoDict["timestamp"] = getTime()
        r.table(db.HISTORICAL_TABLE).insert(infoDict).run(db.CONN)
    else:
        elapsedTime = (
            getTime() -
            cachedData["timestamp"]
        )
        if elapsedTime > db.HISTORICAL_INTERVAL:
            print "\n-- DB -- " + stockName + "  == Updating Database ==\n"
            histList = stock.historical_prices(startDate, endDate)
            infoDict["history_list"] = createHistoryDictList(histList)
            infoDict["index"] = stockName
            infoDict["timestamp"] = getTime()
            r.table(db.HISTORICAL_TABLE).get(stockName).update(
                infoDict
            ).run(db.CONN)
        else:
            print "\n-- DB -- " + stockName + " == Using Cached Data ==\n"
            infoDict = cachedData

    # del infoDict["timestamp"]
    infoDict["name"] = db.STOCK_MAP[stockName]
    return infoDict

def getStock(stockName, infoType):
    """
    Gets the stock either from the database or from the web
    depending on how long it has been since the last database
    update for that stock
    """
    stockName = stockName.upper()

    if not stockName in db.STOCK_MAP.keys():
        return dict(
            error = 1,
            message = "The info you want is not what I can give"
        )

    stock = yf.StockInfo(stockName + db.IN_LONDON)
    cachedData = r.table(db.CACHE_TABLE).get(stockName).run(db.CONN)
    infoDict = dict()

    if cachedData == None:
        print "\n-- DB -- " + stockName + " == Inserting New Information ==\n"
        infoDict = stock.all()
        infoDict["index"] = stockName
        infoDict["timestamp"] = getTime()
        infoDict["name"] = db.STOCK_MAP[stockName]
        r.table(db.CACHE_TABLE).insert(infoDict).run(db.CONN)
    else:
        elapsedTime = (
            getTime() -
            cachedData["timestamp"]
        )
        if elapsedTime > db.UPDATE_INTERVAL:
            print "\n-- DB -- " + stockName + "  == Updating Database ==\n"
            infoDict = stock.all()
            infoDict["index"] = stockName
            infoDict["timestamp"] = getTime()
            try:
                r.table(db.CACHE_TABLE).get(stockName).update(
                    infoDict
                ).run(db.CONN)
            except OverflowError, DecodeError:
                pass
        else:
            print "\n-- DB -- " + stockName + " == Using Cached Data ==\n"
            infoDict = cachedData

    # del infoDict["timestamp"]

    if infoType == "all":
        return infoDict
    else:
        return {infoType: infoDict[infoType]}

def updateAllRealtime():
    for stockName in db.STOCK_MAP.keys():
        while REALTIME_IN_USE or HISTORICAL_IN_USE:
            pass
        try:
            db.MUTEX.acquire()
            getStock(stockName, "all")
        finally:
            db.MUTEX.release()

def updateAllHistorical():
    now = datetime.datetime.fromtimestamp(getTime())
    fiveDaysAgo = datetime.datetime.fromtimestamp(
        getTime() - daysToSeconds(5)
    )

    for stockName in db.STOCK_MAP.keys():
        while HISTORICAL_IN_USE or REALTIME_IN_USE:
            pass
        try:
            db.MUTEX.acquire()
            getHistoricalData(stockName, fiveDaysAgo)
        except IOError:
            print "uh oh"
        finally:
            db.MUTEX.release()

@app.route("/get_stocks/<stockName>/<infoType>", methods = ["GET"])
def giveRealtimeStock(stockName, infoType):
    return json.dumps(getStock(stockName, infoType))

@app.route("/get_stocks/<stockName>", methods = ["GET"])
def giveRealtimeStockAll(stockName):
    return json.dumps(getStock(stockName, "all"))

@app.route("/get_stocks", methods = ["GET"])
def giveAllRealtimeData(stocksToGet = None):
    if stocksToGet == None:
        stocksToGet = db.STOCK_MAP.keys()
    global REALTIME_IN_USE
    updateThread = threading.Thread(
        target = updateAllRealtime
    )

    stockData = dict()
    REALTIME_IN_USE = True
    db.MUTEX.acquire()
    try:
        for stockName in stocksToGet:
            stockData[stockName] = r.table(db.CACHE_TABLE).get(
                stockName
            ).run(db.CONN)
    finally:
        db.MUTEX.release()
    REALTIME_IN_USE = False
    if not db.UPDATING_REALTIME:
        db.UPDATING_REALTIME = True
        updateThread.start()
        db.UPDATING_REALTIME = False

    return json.dumps(stockData)

@app.route("/get_historical_stocks", methods = ["GET"])
def giveAllHistoricalData(stocksToGet = None):
    if stocksToGet == None:
        stocksToGet = db.STOCK_MAP.keys()

    global HISTORICAL_IN_USE
    updateThread = threading.Thread(
        target = updateAllHistorical
    )

    HISTORICAL_IN_USE = True
    db.MUTEX.acquire()
    try:
        historicalData = [
            r.table(db.HISTORICAL_TABLE).get(stockName).run(db.CONN)
            for stockName in stocksToGet
        ]
    finally:
        db.MUTEX.release()
    HISTORICAL_IN_USE = False

    if not db.UPDATING_HISTORICAL:
        db.UPDATING_HISTORICAL = True
        updateThread.start()
        db.UPDATING_HISTORICAL = False

    return json.dumps(historicalData)

@app.route("/get_historical_stocks/<stockName>", methods = ["GET"])
def giveHistoricalData(stockName):
    now = datetime.datetime.fromtimestamp(getTime())
    fiveDaysAgo = datetime.datetime.fromtimestamp(
        getTime() - daysToSeconds(5)
    )

    return json.dumps(
        getHistoricalData(stockName, fiveDaysAgo)
    )

@app.route("/get_stock_direct/<stockName>/<infoType>", methods = ["GET"])
def getStockDirect(stockName, infoType):
    stockName = stockName.upper()
    stock = yf.StockInfo(stockName)
    data = getattr(stock, infoType, None)()
    return json.dumps({infoType: data})
