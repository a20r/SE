#!/usr/bin/env python
#
#  Copyright (c) 2007-2008, Corey Goldberg (corey@goldb.org)
#
#  license: GNU LGPL
#
#  This library is free software; you can redistribute it and/or
#  modify it under the terms of the GNU Lesser General Public
#  License as published by the Free Software Foundation; either
#  version 2.1 of the License, or (at your option) any later version.
#
# Made into class by Alexander Wallar on December 17, 2011

import urllib

class StockInfo:
    """
    Constructor
    """
    def __init__(self, __symbol):
        self.symbol = __symbol

    def __request(self, stat):
        url = (
            'http://finance.yahoo.com/d/quotes.csv?s=%s&f=%s' %
            (self.symbol, stat)
        )

        return urllib.urlopen(url).read().strip().strip('"')

    def __trytype(self, maybeVar, toType):
        try:
            return toType(maybeVar)
        except ValueError:
            return maybeVar

    def all(self):
        """
        Get all available quote data for the given ticker symbol.
        Returns a dictionary.
        """
        values = self.__request('l1c1va2xj1b4j4dyekjm3m4rr5p5p6s7').split(',')
        data = {}
        data['price'] = values[0]
        data['change'] = values[1]
        data['volume'] = values[2]
        data['avg_daily_volume'] = values[3]
        data['stock_exchange'] = values[4]
        data['market_cap'] = values[5]
        data['book_value'] = values[6]
        data['ebitda'] = values[7]
        data['dividend_per_share'] = values[8]
        data['dividend_yield'] = values[9]
        data['earnings_per_share'] = values[10]
        data['fifty_two_week_high'] = values[11]
        data['fifty_two_week_low'] = values[12]
        data['fifty_day_moving_avg'] = values[13]
        data['two_hundred_day_moving_avg'] = values[14]
        data['price_earnings_ratio'] = values[15]
        data['price_earnings_growth_ratio'] = values[16]
        data['price_sales_ratio'] = values[17]
        data['price_book_ratio'] = values[18]
        data['short_ratio'] = values[19]

        for key in data:
            data[key] = self.__trytype(data[key], float)

        return data

    def price(self):
        return self.__trytype(self.__request('l1'), float)

    def change(self):
        return self.__trytype(self.__request('c1'), float)

    def volume(self):
        return self.__trytype(self.__request('v'), float)

    def avg_daily_volume(self):
        return self.__trytype(self.__request('a2'), float)

    def stock_exchange(self):
        return self.__trytype(self.__request('x'), float)

    def market_cap(self):
        return self.__trytype(self.__request('j1'), float)

    def book_value(self):
        return self.__trytype(self.__request('b4'), float)

    def ebitda(self):
        return self.__trytype(self.__request('j4'), float)

    def dividend_per_share(self):
        return self.__trytype(self.__request('d'), float)

    def dividend_yield(self):
        return self.__trytype(self.__request('y'), float)

    def earnings_per_share(self):
        return self.__trytype(self.__request('e'), float)

    def fifty_two_week_high(self):
        return self.__trytype(self.__request('k'), float)

    def fifty_two_week_low(self):
        return self.__trytype(self.__request('j'), float)

    def fiftyday_moving_avg(self):
        return self.__trytype(self.__request('m3'), float)

    def two_hundred_day_moving_avg(self):
        return self.__trytype(self.__request('m4'), float)

    def price_earnings_ratio(self):
        return self.__trytype(self.__request('r'), float)

    def price_earnings_growth_ratio(self):
        return self.__trytype(self.__request('r5'), float)

    def price_sales_ratio(self):
        return self.__trytype(self.__request('p5'), float)

    def price_book_ratio(self):
        return self.__trytype(self.__request('p6'), float)

    def short_ratio(self):
        return self.__trytype(self.__request('s7'), float)

    def historical_prices(self, start_date, end_date):
        """
        Get historical prices for the given ticker symbol.
        Date format is 'YYYYMMDD'

        Returns a nested list.
        """
        url = 'http://ichart.yahoo.com/table.csv?s=%s&' % self.symbol + \
              'd=%s&' % str(int(end_date[4:6]) - 1) + \
              'e=%s&' % str(int(end_date[6:8])) + \
              'f=%s&' % str(int(end_date[0:4])) + \
              'g=d&' + \
              'a=%s&' % str(int(start_date[4:6]) - 1) + \
              'b=%s&' % str(int(start_date[6:8])) + \
              'c=%s&' % str(int(start_date[0:4])) + \
              'ignore=.csv'
        days = urllib.urlopen(url).readlines()
        data = [day[:-2].split(',') for day in days]
        return data
