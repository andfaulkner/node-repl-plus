----------------------------------------------------------------------------------------------------
# node-cli-plus

Enhanced CLI configurable for a specific project.
Install and place .nodeplus file in project root directory to configure.

----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------

Setup
-----

1. npm install node-cli-plus --save-dev

2. Create a .nodeplus file in the project root. See below for basic example.

3. Run in project with `npx nodeplus`

----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
Example nodeplus config file
----------------------------

```javascript
/*------------------------------- ALLOW IMPORT OF TYPESCRIPT FILES -------------------------------*/
// Install with npm install --save-dev module-alias to make this work.
require('module-alias/register');

/*=========================== ADD ENVIRONMENT VARIABLES TO process.env ===========================*/
const path = require('path');

// Reference to root path of project.
// Install with npm install --save-dev app-root-path
const {path: rootPath} = require('app-root-path');

// Grab project config.
// Install with npm install --save dotenv
const {config: envConfig} = require('dotenv');

// Activate environment variables in a .env file.
// Assumes env file is at ./config/env/.env relative to project root.
envConfig({path: path.join(rootPath, `./config/env/.env`)});

/*================================== REPLACE EXISTING FUNCTIONS ==================================*/
// Override fetch to use the same fetching mechanism as the frontend. Must ts-ignore for this to work.
const fetchNew = require('isomorphic-fetch');
// @ts-ignore
fetch = fetchNew;

/*=================================== ADD TOP-LEVEL VARIABLES ====================================*/
/**
 * Add global temp for convenience (automatically referenceable).
 * Call "temp" in the CLI to access its value, including assigning a new value
 */
global.temp = null;

//================================ CUSTOM FUNCTIONS CAN BE ADDED =================================//
/*----------------------------------- Fetch from API function ------------------------------------*/
/**
 * Perform fetch from local route.
 *
 * @param {string} route Route to make request to
 * @param {string} [method] Optional GET, PUT, or POST
 * @param {object} [body] Object to JSON stringify and send w/ request (if POST or PUT)
 * @param {boolean} [verbose] If true, log more.
 */
const apiFetch = (route, method = 'GET', body = {}, verbose = false) => {
    let reqRoute = route.match(/^\//g) ? `http://localhost:${process.env['PORT']}${route}` : route;
    if (!reqRoute.match(/^https?:\/\//g)) {
        reqRoute = `http://${reqRoute}`;
    }
    if (verbose) console.log('apiFetch :: request route (reqRoute):', reqRoute);

    // True if a body object containing content was given
    const isBody = body && Object.keys(body).length > 0;
    if (verbose) console.log('apiFetch :: isBody?', isBody);

    let resStore;

    const headers = {
        ...(isBody ? {Accept: 'application/json', 'Content-Type': 'application/json'} : {})
    };

    if (verbose) {
        console.log(`apiFetch :: headers:`, headers);
        console.log(`apiFetch :: body:`, body);
    }

    // Make actual request
    return (
        fetch(reqRoute, {
            headers,
            method,
            mode: 'cors',
            body: isBody ? JSON.stringify(body) : undefined,
            credentials: 'include'
        })
            // Assume response JSON
            .then(res => {
                console.log(`res:`, res);
                resStore = res;
                return res.text();
            })
            // If response not JSON, try handling it as text
            .catch(err => {
                console.log(`err:`, err, `err keys:`, Object.keys(err));
                if (err && err.type === 'invalid-json') return resStore.text();
                throw err;
            })
            // Log result and return it
            .then(data => {
                console.log(data);
                return data;
            })
            // Handle error when all other options fail
            .catch(err => console.log(`Failed to fetch from route "${route}" with error:`, err))
    );
};

// Attach replDescription__ property to a function to make the description appear in the CLI help
// output for the associated function.
apiFetch.__repl_description__ = `Make API request to local server, with all config (e.g. auth headers) take care of.`;

/*--------------------------------------------- DB -----------------------------------------------*/
// Can add a DB connector, and a function to automatically make calls to the database via the automatically created connection.


/*----------------------------------- MISC ADDITIONAL IMPORTS ------------------------------------*/
// `npm install --save array-sort` to get access to this
const arraySort = require('array-sort');
// `npm install --save mathjs` to get access to this
const mathJs = require('mathjs');

/*-------------------------------------------- EXPORT --------------------------------------------*/
// Anything exported here becomes accessible at the top level in the CLI e.g. this would work:
//    apiFetch(`/api/posts`, 'GET').then(posts => { console.log(posts); temp = posts; });
module.exports = {
    apiFetch,
    arraySort,
    mathJs,
};

```
