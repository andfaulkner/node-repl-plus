#!/usr/bin/env node

// @ts-check

/* POLYFILL BROWSER WINDOW OBJECT */
// @ts-ignore
const JSDOM = require('jsdom');
const jsDom = new JSDOM.JSDOM();

/**
 * Try to find a .nodeplus file in current directory
 * Add all items found in it to global
 */
const augmentations = {};
try {
    const nodeplus = require(process.cwd() + `/.nodeplus`);
    // @ts-ignore
    const {AWS, ...fields} = nodeplus;
    console.log(`nodeplus:`, {AWS: Object.keys(AWS), ...fields});
    Object.keys(nodeplus).forEach(key => (augmentations[key] = nodeplus[key]));
    // console.log(`augmentations:`, augmentations);
} catch (e) {
    console.log(`nodeplus augmentations not found`);
}

// Note that this accepts augmentations

Object.defineProperty(global, 'window', {value: jsDom.window, enumerable: false});
Object.defineProperty(global, 'document', {value: jsDom.window.document, enumerable: false});
Object.defineProperty(global, 'navigator', {value: jsDom.window.navigator, enumerable: false});

/*------------------------------------ THIRD-PARTY COMPONENTS ------------------------------------*/
require('./augment-global-prototypes/augment-global-prototypes');

const moment = require('moment');
const lodash = require('lodash');

// @ts-ignore
const madUtils = require('mad-utils/lib/node');

const fs = require('fs');
const util = require('util');
const fetch = require('isomorphic-fetch');

// ShellJS
const shellJS = require('shelljs');

let packageJson;

try {
    packageJson = JSON.parse(fs.readFileSync('./package.json').toString());
} catch (err) {
    console.error(`Error:`, err);
}

/*--------------------------------------- PROJECT MODULES ----------------------------------------*/
// Grab custom CLI commands from nodeplus-repl-setup
const {bindPropsToRepl, cd, ls, inspect, keys, displayProps} = require('./nodeplus-repl-setup');

/*--------------------------------- REPL NODE ENVIRONMENT SETUP ----------------------------------*/
/*
 * Configure default inspect options.
 */
util.inspect.defaultOptions.colors = true;
util.inspect.defaultOptions.depth = 2;
util.inspect.defaultOptions.breakLength = 100;
util.inspect.defaultOptions.showHidden = false;
util.inspect.defaultOptions.maxArrayLength = Infinity;

/**
 * Augment all functions with toS function providing a function source output that
 * is more readble in a REPL environment
 */
Object.defineProperty(global.Function.prototype, `toS`, {
    get: function toS() {
        const s = this && this.toString();
        if (s) {
            // @ts-ignore
            const args = inspect.getArgs(this);
            console.log(``);
            console.log(madUtils.deindent`
                /**
                *  @name ${this.name}
                *  ${args ? '\n*  @param ' + args.join(`\n*  @param `) : ``}
                */`);
            const splitStr = s.split(`\n`);
            if (splitStr.length === 1) return splitStr[0];
            console.log(splitStr.join('\n'));
        }
        // String designed to display as blank line
        return '--<__BLOCK_OUTPUT__>--';
    },
    configurable: false,
    enumerable: false
});

/*------------------------------------- CONFIG REPL CONTEXT --------------------------------------*/
/**
 * Properties to bind to repl context (available at top level in repl)
 */
const ctxProps = {
    // Shell
    cd,
    ls: {val: ls, mutable: true},
    cat: shellJS.cat,
    chmod: shellJS.chmod,
    cp: shellJS.cp,
    dirs: shellJS.dirs,
    echo: shellJS.echo,
    exec: shellJS.exec,
    exit: shellJS.exit,
    find: shellJS.find,
    grep: shellJS.grep,
    uniq: shellJS.uniq,
    which: shellJS.which,
    touch: shellJS.touch,
    test: shellJS.test,
    sort: shellJS.sort,
    tail: shellJS.tail,
    head: shellJS.head,
    ln: shellJS.ln,
    mkdir: shellJS.mkdir,
    mv: shellJS.mv,
    popd: shellJS.popd,
    pushd: shellJS.pushd,
    rm: shellJS.rm,
    sed: shellJS.sed,
    ['set']: shellJS.set,

    // Helper libraries
    lodash,
    moment,
    madUtils,
    m_: madUtils,
    ld: lodash,
    fetch,

    Function,

    // Logging & object info-related
    inspect,
    // @ts-ignore
    getArgs: inspect.getArgs,
    keys,
    packageJson: packageJson ? packageJson : null,

    // Overwritable temp storage
    ...augmentations
};

/**
 * Add global temp for convenience (gets used by REPL).
 */
global.temp = null;

/*----------------------------------------- DESCRIPTIONS -----------------------------------------*/
/**
 * Object containing all __repl_description__ data (for use in help text).
 * @type Record<string, string>
 */
const descAdditions = Object.keys(augmentations).reduce((acc, key) => {
    if (augmentations[key].__repl_description__) acc[key] = augmentations[key].__repl_description__;
    return acc;
}, {});

/**
 * Extra descriptions for bound properties.
 * @type Record<string, string>
 */
const descriptions = {
    _: `Result of last command`,
    ld: `lodash alias`,
    m_: `mad-utils alias`,
    // TODO pwd description not showing
    pwd: `Show current working directory (like pwd in bash)`,
    temp: `Predefined temporary global variable used for storing results of function calls`,
    Function: `Standard global has added property 'toS' for displaying as a clean string`,
    ...descAdditions
};

/**
 * Attach props to REPL (note: this is done in the bindPropsToRepl function), including all
 * descriptions. Return repl object with all properties bound to its global namespace.
 */
const repl = bindPropsToRepl(ctxProps, descriptions, `> `);

/*--------------------------------------- CUSTOM COMMANDS ----------------------------------------*/
/**
 * Filtered repl history without numbered lines
 */
repl.defineCommand(`help_added_globals`, {
    help: `Display custom objects/functions added to the top-level context`,
    action: () => displayProps(ctxProps, descriptions)
});

/**
 * Add alias for exit
 */
repl.defineCommand(`quit`, {
    help: `Exit the REPL (alias)`,
    action: () => process.exit()
});

/*---------------------------------------- ADD TO CONTEXT ----------------------------------------*/
Reflect.defineProperty(repl.context, 'pwd', {
    get: function () {
        return process.cwd();
    }
});
