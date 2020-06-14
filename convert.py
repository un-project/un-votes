import copy
import csv
from enum import Enum

countries = {}
resolutions = {}


class Vote(Enum):
    YES = 1
    ABSTAIN = 2
    NO = 3
    ABSENT = 8
    NOT_A_MEMBER = 9


with open('UNVotes.csv', newline='') as csvfile:
    reader = csv.DictReader(csvfile, delimiter=',', quotechar='"')
    for row in reader:
        rcid = row['rcid']
        ccode = row['ccode']

        if ccode not in countries:
            country = row['Country']
            country_name = row['Countryname']
            countries[ccode] = {
                'Country': country,
                'Countryname': country_name
            }

        if rcid in resolutions:
            vote = row['vote']
            resolutions[rcid][ccode] = vote
        else:
            vote = row['vote']
            row[ccode] = vote
            del row['vote']
            del row['member']
            del row['ccode']
            del row['Country']
            del row['Countryname']
            resolutions[rcid] = row

for ccode1, val in countries.items():
    ccodes = list(countries.keys())
    ccodes.remove(ccode1)
    with open(f"{ccode1}.csv", 'w', newline='') as csvfile:
        fieldnames = [
            'rcid', 'year', 'session', 'abstain', 'yes', 'no', 'importantvote',
            'date', 'unres', 'amend', 'para', 'short', 'descr', 'me', 'nu',
            'di', 'hr', 'co', 'ec', 'ident', 'resid'
        ] + list(countries)
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for _, res in resolutions.items():
            row = copy.deepcopy(res)
            if ccode1 not in row:
                for ccode2 in ccodes:
                    row[ccode2] = ''
            else:
                vote1 = Vote(int(row[ccode1]))
                if vote1 == Vote.ABSENT or vote1 == Vote.NOT_A_MEMBER:
                    for ccode2 in ccodes:
                        row[ccode2] = ''
                else:
                    for ccode2 in ccodes:
                        if ccode2 in row:
                            vote2 = Vote(int(row[ccode2]))
                            if vote1 == vote2:
                                score = 2
                            elif vote2 == Vote.ABSENT or vote2 == Vote.NOT_A_MEMBER:
                                score = ''
                            elif vote1 == Vote.ABSTAIN or vote2 == Vote.ABSTAIN:
                                score = -1
                            else:
                                score = -2
                            row[ccode2] = score
            writer.writerow(row)

with open('countries.csv', 'w', newline='') as csvfile:
    fieldnames = ['ccode', 'Country', 'Countryname']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    for ccode, val in countries.items():
        writer.writerow({
            'ccode': ccode,
            'Country': val['Country'],
            'Countryname': val['Countryname']
        })

with open('resolutions.csv', 'w', newline='') as csvfile:
    fieldnames = [
        'rcid', 'year', 'session', 'abstain', 'yes', 'no', 'importantvote',
        'date', 'unres', 'amend', 'para', 'short', 'descr', 'me', 'nu', 'di',
        'hr', 'co', 'ec', 'ident', 'resid'
    ] + list(countries)
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(resolutions.values())
