import os
import requests

# List of ISO 3166-1 alpha-2 country codes
country_codes = [
"US","FR","DE","AF","AX","AL","DZ","AS","AD","AO","AI","AQ","AG","AR","AM","AW","AU","AT","AZ","BS","BH","BD","BB","BY","BE","BZ","BJ","BM","BT","BO","BQ","BA",
"BW","BV","BR","IO","BN","BG","BF","BI","KH","CM","CA","CV","KY","CF","TD","CL","CN","CX","CC","CO","KM","CG","CD","CK","CR","CI","HR","CU","CW","CY","CZ","DK",
"DJ","DM","DO","EC","EG","SV","GQ","ER","EE","ET","FK","FO","FJ","FI","GF","PF","TF","GA","GM","GE","GH","GI","GR","GL","GD","GP","GU","GT","GG","GN","GW","GY",
"HT","HM","VA","HN","HK","HU","IS","IN","ID","IR","IQ","IE","IM","IL","IT","JM","JP","JE","JO","KZ","KE","KI","KP","KR","XK","KW","KG","LA","LV","LB","LS","LR",
"LY","LI","LT","LU","MO","MK","MG","MW","MY","MV","ML","MT","MH","MQ","MR","MU","YT","MX","FM","MD","MC","MN","ME","MS","MA","MZ","MM","NA","NR","NP","NL","NC",
"NZ","NI","NE","NG","NU","NF","MP","NO","OM","PK","PW","PS","PA","PG","PY","PE","PH","PN","PL","PT","PR","QA","RE","RO","RU","RW","BL","SH","KN","LC","MF","PM",
"VC","WS","SM","ST","SA","SN","RS","SC","SL","SG","SX","SK","SI","SB","SO","ZA","GS","SS","ES","LK","SD","SR","SZ","SE","CH","SY","TW","TJ","TZ","TH","TL","TG",
"TK","TO","TT","TN","TR","TM","TC","TV","UG","UA","AE","GB","UM","UY","UZ","VU","VE","VN","VG","VI","WF","EH","YE","ZM","ZW"
]

# Create a folder to store the flags
os.makedirs("flags", exist_ok=True)

# Download each flag
for code in country_codes:
    url = f"https://flagcdn.com/80x60/{code.lower()}.png"
    response = requests.get(url)
    if response.status_code == 200:
        with open(f"flags/{code}.png", "wb") as f:
            f.write(response.content)
        print(f"Saved: {code}.png")
    else:
        print(f"Failed to download: {code}.png")