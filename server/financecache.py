
from flask import request, redirect, url_for, abort, jsonify
import rethinkdb as r
import yahoofin as yf
import json
from app import app, db
import datetime, time
import threading

REALTIME_IN_USE = False
HISTORICAL_IN_USE = False
FOLLOWING_IN_USE = False

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

    Arguments:
    stockName -- symbols representing stock name
    infoType -- type of information that is needed
    
    Return:
    Dictionary of the requested data using the given values
    
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
            except:
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
    """
    Updates all stock in the database.
    
    """
    for stockName in db.STOCK_MAP.keys():
        while REALTIME_IN_USE or HISTORICAL_IN_USE or FOLLOWING_IN_USE:
            pass
        try:
            db.MUTEX.acquire()
            getStock(stockName, "all")
        finally:
            db.MUTEX.release()

    db.UPDATING_REALTIME = False

def updateAllHistorical():
    """
    Updates historical data in the database
    
    """
    now = datetime.datetime.fromtimestamp(getTime())
    fiveDaysAgo = datetime.datetime.fromtimestamp(
        getTime() - daysToSeconds(5)
    )
    for stockName in db.STOCK_MAP.keys():
        while HISTORICAL_IN_USE or REALTIME_IN_USE or FOLLOWING_IN_USE:
            pass
        try:
            db.MUTEX.acquire()
            getHistoricalData(stockName, fiveDaysAgo)
        except IOError:
            print "uh oh"
        finally:
            db.MUTEX.release()
    db.UPDATING_HISTORICAL = False


@app.route("/follow", methods = ["POST"])
def followStock():
    global FOLLOWING_IN_USE

    FOLLOWING_IN_USE = True

    db.MUTEX.acquire()

    try:
        userData = r.table(db.USER_TABLE).get_all(
            request.cookies.get(db.AUTH_COOKIE),
            index = db.USER_SECONDARY_KEY
        )[0].run(db.CONN)
    finally:
        db.MUTEX.release()

    FOLLOWING_IN_USE = False
    if userData:
        stockName = request.form["stock_name"]
        if not stockName in db.STOCK_MAP.keys():
            return jsonify(
                error = 1,
                message = "Cannot follow an imaginary stock"
            )

        if not stockName in userData[db.STOCKS_FOLLOWING_KEY]:
            userData[db.STOCKS_FOLLOWING_KEY].append(stockName)
            FOLLOWING_IN_USE = True
            try:
                db.MUTEX.acquire()
                r.table(db.USER_TABLE).get(userData["username"]).update(
                    userData
                ).run(db.CONN)
            finally:
                db.MUTEX.release()

            FOLLOWING_IN_USE = False
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
    global FOLLOWING_IN_USE

    FOLLOWING_IN_USE = True
    try:
        db.MUTEX.acquire()
        userData = r.table(db.USER_TABLE).get_all(
            request.cookies.get(db.AUTH_COOKIE),
            index = db.USER_SECONDARY_KEY
        )[0].run(db.CONN)
    finally:
        db.MUTEX.release()
    FOLLOWING_IN_USE = False

    print userData
    if userData:
        return json.dumps(userData[db.STOCKS_FOLLOWING_KEY])
    else:
        return json.dumps(list())

@app.route("/get_stocks/<stockName>/<infoType>", methods = ["GET"])
def giveRealtimeStock(stockName, infoType):
    return json.dumps(getStock(stockName, infoType))

@app.route("/get_stocks/<stockName>", methods = ["GET"])
def giveRealtimeStockAll(stockName):
    global REALTIME_IN_USE
    REALTIME_IN_USE = True
    resp = dict()
    try:
        db.MUTEX.acquire()
        resp = json.dumps(getStock(stockName, "all"))
    finally:
        db.MUTEX.release()
    REALTIME_IN_USE = False
    return resp

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

    return json.dumps(historicalData)

@app.route("/get_historical_stocks/<stockName>", methods = ["GET"])
def giveHistoricalData(stockName):
    global HISTORICAL_IN_USE
    HISTORICAL_IN_USE = True
    now = datetime.datetime.fromtimestamp(getTime())
    fiveDaysAgo = datetime.datetime.fromtimestamp(
        getTime() - daysToSeconds(5)
    )

    resp = dict()
    try:
        db.MUTEX.acquire()
        resp = json.dumps(
            getHistoricalData(stockName, fiveDaysAgo)
        )
    finally:
        db.MUTEX.release()
    HISTORICAL_IN_USE = False
    return resp

@app.route("/get_stock_direct/<stockName>/<infoType>", methods = ["GET"])
def getStockDirect(stockName, infoType):
    stockName = stockName.upper()
    stock = yf.StockInfo(stockName)
    data = getattr(stock, infoType, None)()
    return json.dumps({infoType: data})
