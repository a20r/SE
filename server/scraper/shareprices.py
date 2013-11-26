from bs4 import BeautifulSoup
import urllib2

url = "http://shareprices.com/risers/ftse100"

def scrape():
    content = urllib2.urlopen(url).read()
    soup = BeautifulSoup(content)
    table = soup.find_all("table", class_="tables")
    rows = table[1].find_all('tr')
    indexes = []
    for row in rows:
        data = row.td
        if str(data.string) != "Epic":
            index = str(data.string)
            #remove dot from the end of string
            if index[-1] != '.':
                indexes.append(index)
            else:
                indexes.append(index[:-1])
    return indexes
