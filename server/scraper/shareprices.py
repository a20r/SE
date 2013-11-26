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
            indexes.append(str(data.string))
    return indexes