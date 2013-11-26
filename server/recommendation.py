import scraper
from app import app

@app.route("/recommend", methods = ["GET"])
def getRecommendations():
    recommending = recommend()
    if recommending:
    	recommending.reverse()
        return jsonify(
            error = 0,
            message = "Recommends are ready",
            stocks = recommending
        )
    else:
    	return jsonify(
            error = 1,
            message = "No recommendations were found",
            stocks = list()
        )

def recommend():
    # dictionary for recommended stocks scraped from websites
    recommended = {}
    for sr in scraper.scrapers:
        dictionary = dict.fromkeys(sr());
        recommended = add(recommended, dictionary)

    # stocks we are recommending
    recommending = []
    for index in sorted(recommended, key=recommended.get, reverse=True):
    	recommending.append(index)
    # select only five best recommendations
    recommending = recommending[len(recommended) - 5: len(recommended)]
    return recommending

def add(recommended, dictionary):
	value = 1
	# add values from 1 to len(dictionary) to stocks
	for index in dictionary.keys():
		dictionary[index] = value
		value += 1
	# combine both dictionaries
	for index in dictionary.keys():
		if recommended.has_key(index):
			recommended[index] += dictionary[index]
		else:
			recommended[index] = dictionary[index]
	return recommended
