
from flask import request, redirect, url_for, abort, jsonify
import rethinkdb as r
import yahoofin as yf
import json
from app import app, db
import datetime, time
import threading

def getTime(toConvert = None):
    """
    Get current time in seconds or convert
    given time in seconds

    Arguments:
    toConvert -- time to convert into seconds

    Return:
    Time in seconds
    """
    if toConvert == None:
        return time.mktime(
            datetime.datetime.now().timetuple()
        )
    else:
        return time.mktime(
            toConvert.timetuple()
        )

def daysToSeconds(dayInt):
    """
    Get days in seconds

    """
    return dayInt * 24 * 60 * 60

def dateToString(dateToConvert):
    """
    Convert date into string

    Arguments:
    dateToConvert -- date to convert

    Return:
    Converted date as a string

    """
    return "".join(
        str(i) for i in [
            dateToConvert.year,
            dateToConvert.month,
            dateToConvert.day
        ]
    )

def tryFloat(value):
    """
    Try to convert given value into a float

    Arguments:
    value -- value to convert

    Return:
    Float value of the given value if convertion
    was successful, otherwise return the same
    given value

    """
    try:
        return float(value)
    except:
        return value

def createHistoryDictList(histList):
    """
    Creates a list of dictionaries that
    corresponds to historical data

    Arguments:
    histList -- list of list of historical data

    Return:
    Created list

    """
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
    """
    Gets historical data of the given stock name
    from the given start date

    Arguments:
    stockName -- symbols representing stock name
    startDate -- date to get historical data from

    Return:
    Dictionary of historical data using the given values

    """
    conn = r.connect(db = db.DB)
    stockName = stockName.upper()
    startDate = dateToString(startDate)
    endDate = dateToString(datetime.datetime.now())

    if not stockName in db.STOCK_MAP.keys():
        return dict(
            error = 1,
            message = "The info you want is not what I can give"
        )

    stock = yf.StockInfo(stockName + db.IN_LONDON)
    cachedData = r.table(db.HISTORICAL_TABLE).get(stockName).run(conn)
    infoDict = dict()

    if cachedData == None:
        print "\n-- DB -- " + stockName + " == Inserting New Information ==\n"
        histList = stock.historical_prices(startDate, endDate)
        infoDict["history_list"] = createHistoryDictList(histList)
        infoDict["index"] = stockName
        infoDict["name"] = db.STOCK_MAP[stockName]
        infoDict["timestamp"] = getTime()
        r.table(db.HISTORICAL_TABLE).insert(infoDict).run(conn)
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
            ).run(conn)
        else:
            print "\n-- DB -- " + stockName + " == Using Cached Data ==\n"
            infoDict = cachedData

    infoDict["name"] = db.STOCK_MAP[stockName]
    return infoDict

def getStock(stockName, infoType):
    """
    Gets the stock either from the database or from the web
    depending on how long it has been since the last database
    update for that stock

    Arguments:
    stockName -- symbols representing stock name
    infoType -- type of information that is needed

    Return:
    Dictionary of the requested data using the given values

    """
    stockName = stockName.upper()

    conn = r.connect(
        db = db.DB
    )

    if not stockName in db.STOCK_MAP.keys():
        return dict(
            error = 1,
            message = "The info you want is not what I can give"
        )

    stock = yf.StockInfo(stockName + db.IN_LONDON)
    cachedData = r.table(db.CACHE_TABLE).get(stockName).run(conn)
    infoDict = dict()

    if cachedData == None:
        print "\n-- DB -- " + stockName + " == Inserting New Information ==\n"
        infoDict = stock.all()
        infoDict["index"] = stockName
        infoDict["timestamp"] = getTime()
        infoDict["name"] = db.STOCK_MAP[stockName]
        r.table(db.CACHE_TABLE).insert(infoDict).run(conn)
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
                ).run(conn)
            except:
                pass
        else:
            print "\n-- DB -- " + stockName + " == Using Cached Data ==\n"
            infoDict = cachedData

    if infoType == "all":
        return infoDict
    else:
        return {infoType: infoDict[infoType]}

def updateAllRealtime():
    """
    Updates all stock in the database.

    """
    for stockName in db.STOCK_MAP.keys():
        getStock(stockName, "all")

    db.UPDATING_REALTIME = False

def historicalDictToList(historicalData):
    return [
        historicalData["Date"],
        historicalData["Open"],
        historicalData["High"],
        historicalData["Low"],
        historicalData["Close"],
        historicalData["Volume"],
        historicalData["Adj Close"]
    ]

def updateAllHistorical():
    """
    Updates historical data in the database

    """
    now = datetime.datetime.fromtimestamp(getTime())
    fiveDaysAgo = datetime.datetime.fromtimestamp(
        getTime() - daysToSeconds(5)
    )
    for stockName in db.STOCK_MAP.keys():
        try:
            historicalData = getHistoricalData(stockName, fiveDaysAgo)
            with open(
                "static/data/" + stockName.lower() + ".csv",
                "w+"
            ) as f:
                f.write(historicalDataToList(historicalData))
        except IOError as e:
            print "I/O error({0}): {1}".format(e.errno, e.strerror)
    db.UPDATING_HISTORICAL = False

@app.route("/get_stocks/<stockName>/<infoType>", methods = ["GET"])
def giveRealtimeStock(stockName, infoType):
    """
    Returns json for the requested stock information

    """
    return json.dumps(getStock(stockName, infoType))

@app.route("/get_stocks/<stockName>", methods = ["GET"])
def giveRealtimeStockAll(stockName):
    """
    Returns json for the requested stock

    """
    resp = json.dumps(getStock(stockName, "all"))
    return resp

@app.route("/get_stocks", methods = ["GET"])
def giveAllRealtimeData(stocksToGet = None):
    """
    Returns json for requested data - all real time data

    """
    if stocksToGet == None:
        stocksToGet = db.STOCK_MAP.keys()
    conn = r.connect(
        db = db.DB
    )
    updateThread = threading.Thread(
        target = updateAllRealtime
    )

    stockData = dict()
    for stockName in stocksToGet:
        stockData[stockName] = r.table(db.CACHE_TABLE).get(
            stockName
        ).run(conn)

    if not db.UPDATING_REALTIME:
        db.UPDATING_REALTIME = True
        updateThread.start()

    return json.dumps(stockData)

@app.route("/get_historical_stocks", methods = ["GET"])
def giveAllHistoricalData(stocksToGet = None):
    """
    Returns json for requested data - all historical data

    """
    if stocksToGet == None:
        stocksToGet = db.STOCK_MAP.keys()

    conn = r.connect(
        db = db.DB
    )
    updateThread = threading.Thread(
        target = updateAllHistorical
    )

    historicalData = [
        r.table(db.HISTORICAL_TABLE).get(stockName).run(conn)
        for stockName in stocksToGet
    ]

    if not db.UPDATING_HISTORICAL:
        db.UPDATING_HISTORICAL = True
        updateThread.start()

    return json.dumps(historicalData)

@app.route("/get_historical_stocks/<stockName>", methods = ["GET"])
def giveHistoricalData(stockName):
    """
    Returns json for the historical
    data for the requested stock

    """
    now = datetime.datetime.fromtimestamp(getTime())
    fiveDaysAgo = datetime.datetime.fromtimestamp(
        getTime() - daysToSeconds(5)
    )

    resp = json.dumps(
        getHistoricalData(stockName, fiveDaysAgo)
    )
    return resp

@app.route("/get_stock_direct/<stockName>/<infoType>", methods = ["GET"])
def getStockDirect(stockName, infoType):
    """
    Returns json for requested stock directly from yahoo

    """
    stockName = stockName.upper()
    stock = yf.StockInfo(stockName)
    data = getattr(stock, infoType, None)()
    return json.dumps({infoType: data})


