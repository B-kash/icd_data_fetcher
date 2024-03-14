const fs = require('fs');
const axios = require('axios');
const { dirname } = require('path');
const client_id = '2d9c1036-ada8-45e8-a17a-006cd730fe19_483820a8-0600-4fd5-b372-7ca96aabe7b8';
const client_secret = 'ZnR0WQzRHGpSehzSOSad0OYGG44zKFnFMrVsHBwWBPw='
let tokenData = {}; // Object to store token and its expiration time

// Function to fetch access token
async function fetchAccessToken() {
    try {
        const response = await axios.post('https://icdaccessmanagement.who.int/connect/token', {
            client_id: client_id,
            client_secret: client_secret,
            Scope: 'icdapi_access',
            grant_type: 'client_credentials'
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return {
            token: response.data.access_token,
            expiresIn: Date.now() + (response.data.expires_in * 1000) // Convert seconds to milliseconds
        };
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Function to check if token is expired
function isTokenExpired() {
    return tokenData.expiresIn ? tokenData.expiresIn <= Date.now() : true;
}

// Function to fetch data from a URL with a token in the header
async function fetchData(url, token) {
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'API-Version': 'v2',
                'Accept-Language': 'en',
            }
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Function to save data to a JSON file
function saveToFile(data, filename) {
    fs.writeFileSync(filename, JSON.stringify(data, null, 4));
    console.log(`Saved child data to ${filename}`);
}

// Function to extract filename from URL
function getFilenameFromUrl(url) {
    const parts = url.split('/release/11/2024-01/mms');
    return parts[parts.length - 1].length > 0 ? replaceFirstOccurrence(parts[parts.length - 1], '/', '').replaceAll('/','-') + '.json' : 'icd11.json';
}

function replaceFirstOccurrence(string, toReplace, replaceWith) {
    return string.replace(toReplace, replaceWith);
}

// Function to process child URLs and foundationChildElsewhere linearization references recursively
async function processUrls(urls, outputDirectory) {
    try {
        for (const url of urls) {
            const filename = getFilenameFromUrl(url);
            const filepath = `${outputDirectory}/${filename}`;

            if (!fs.existsSync(filepath)) {
                const data = await fetchData(url, tokenData.token);
                saveToFile(data, filepath);

                const linearizationReferences = [];

                if (data.foundationChildElsewhere) {
                    data.foundationChildElsewhere.forEach(ref => linearizationReferences.push(ref.linearizationReference));
                }

                if (data.exclusion) {
                    data.exclusion.forEach(exclusion => linearizationReferences.push(exclusion.linearizationReference));
                }

                if(data.parent && data.parent.length > 0) {
                    data.parent.forEach(parent => linearizationReferences.push(parent));
                }

                await processUrls(linearizationReferences, dirname(filepath));
            } else {
                console.log(`File ${filename} already exists. Skipping fetch.`);
            }
        }
    } catch (error) {
        console.error('Error processing URLs:', error);
    }
}

// Main function
async function fetchDataAndSaveToFiles(apiUrl, outputDirectory) {
    try {
        if (isTokenExpired()) {
            tokenData = await fetchAccessToken();
        }

        const responseData = await fetchData(apiUrl, tokenData.token);
        const childUrls = responseData.child || [];
        saveToFile(responseData, `${outputDirectory}/icd11.json`);

        // Process child URLs
        await processUrls(childUrls, outputDirectory);
    } catch (error) {
        console.error('Error fetching or saving data:', error);
    }
}

// Main function call
const apiUrl = 'https://id.who.int/icd/release/11/2024-01/mms';
const outputDirectory = 'child_data';

if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory);
}

fetchDataAndSaveToFiles(apiUrl, outputDirectory);
