
import server
import sys

""" Main """
if __name__ == "__main__":
    if len(sys.argv) == 1:
        server.run("localhost", 8000)
    else:
        server.run(sys.argv[1], sys.argv[2])

