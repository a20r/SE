from bs4 import BeautifulSoup
import urllib2

url = "http://www.digitallook.com/cgi-bin/dlmedia/security.cgi?csi=50058&action=brokerrecommendations&username=&ac"

def scrape():
    content = urllib2.urlopen(url).read()
    soup = BeautifulSoup(content)
    div = soup.find_all("div", class_="secondColContent")
    rows = div[1].table.find_all('tr')
    indexes = []
    for row in rows:
        data = row.td
        if data != None:
            indexes.append(str(data.a.string))
    return indexes