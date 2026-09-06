import json, urllib.request, urllib.parse, os
cs = json.load(open(os.path.expanduser('~/.config/configstore/firebase-tools.json')))
data = urllib.parse.urlencode({'client_id':'563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com','client_secret':'j9iVZfS8kkCEFUPaAeJV0sAi','refresh_token':cs['tokens']['refresh_token'],'grant_type':'refresh_token'}).encode()
at = json.load(urllib.request.urlopen(urllib.request.Request('https://oauth2.googleapis.com/token', data=data)))['access_token']
r = json.load(urllib.request.urlopen(urllib.request.Request('https://firestore.googleapis.com/v1/projects/dragon-news-rrhs/databases/(default)/collectionGroups/-/indexes', headers={'Authorization':'Bearer '+at})))
states = [i['state'] for i in r.get('indexes', [])]
print(' '.join(states) or 'NONE')
