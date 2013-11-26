from bs4 import BeautifulSoup
import urllib2

url = "http://www.hl.co.uk/shares/stock-market-summary/ftse-100/risers?g=1d"

def scrape():
    """Returns a list of stocks that are scraped 
    from the url that has recommended (top risers) stocks"""
    req = urllib2.Request(url, headers={'User-Agent' : "Magic Browser"})
    con = urllib2.urlopen( req )
    content = con.read()
    soup = BeautifulSoup(content)
    table = soup.find_all("table", class_="darker-headed-table")
    rows = table[0].find_all('tr')
    indexes = []
    for row in rows:
        data = row.td
        if data != None:
            index = str(data.string)
            #remove dot from the end of string
            if index[-1] != '.':
                indexes.append(index)
            else:
                indexes.append(index[:-1])
    return indexes
