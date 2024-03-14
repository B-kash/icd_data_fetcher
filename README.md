## Running for first time

- `npm install` to install dependencies
- `node ./index.js`

## Running later on
- `node ./index.js`

It will create json files for each url in the `https://icd.who.int/browse/2024-01/mms/en`. Every child will have its own file. For the URL, `https://icd.who.int/browse/2024-01/mms/en#1612485599`, filename will be `1612485599.json`. All the files are stored in `child_data` directory.
If the file already exists, it will skip the whole process. so its better to already delete the preexisting file if you already have. Feel free to update the script to your needs
