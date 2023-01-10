1.4.2 (2023-01-10)
==================
-   Upgrade mad-utils from v0.93 to v0.96



----------------------------------------------------------------------------------------------------
1.3.0 (2022-05-12)
==================
-   Rename package to node-repl-plus
-   Rename history file to `.node_repl_plus_history` (to match new package name)



----------------------------------------------------------------------------------------------------
1.2.0 (2022-05-11)
==================
Commands
--------
-   New '.quit' top-level command (alias to .exit).

Shell
-----
-   Remove echo, exec, popd, pushd, sed, set, and test from top level

Descriptions
------------
(Shown when .help_added_globals called, & on REPL boot)

### Formatting
-   Pad all keys before description by the length of the longest key value
-   "Natural sort" keys within each section

### Descriptions
-   Add descriptions for:
    -   temp
    -   packageJson
-   Add periods to the end of all descriptions

### Essential descriptions
-   Create new "essential descriptions" section that sits below other descriptions
    -   Separated by "-----------"
-   Handles new "__essential_defs__" array on export object from a project .nodeplus file.
    -   Property contains array of fields to treat as essential.
    -   Any field in there goes in the "Essential descriptions" section.
    -   If no `__repl_description__` property is attached to that object/function
        it creates a generic description e.g. "fsAsync function".

Misc
----
-   Removed app-root-path module
-   Removed common-tags module
-   More JSDoc typing fixes, removed more unused code



----------------------------------------------------------------------------------------------------
1.1.0 (2022-05-10)
==================
History file
------------
-   History file renamed '.node_cli_plus_history'
-   History file moved to PWD (process.env.PWD)

Project config/docs
-------------------
-   Add README.md file
-   Add example .nodeplus config file
-   Add .editorconfig file
-   Add CHANGELOG
-   Add prettier

Shell
-----
-   `cd` command now allows navigation above project root

Misc
----
-   Remove redundant repl.history child folder (this is handled by the installed module).
