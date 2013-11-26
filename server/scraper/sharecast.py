from BeautifulSoup import BeautifulSoup
import urllib2

url = "http://sharecast.com/indices/ftse-100-ukx.html"

def scrape():
    content = urllib2.urlopen(url).read()
    soup = BeautifulSoup(content)
    table = soup.find_all("table", class_="block100")
    rows = table[0].find_all('tr')
    print rows[0]
    indexes = []
    for row in rows:
        data = row.td
        if data != None:
            href = data.a['href']
            i = href.find('=')+1
            indexes.append(str(href[i:]))
    return indexes
