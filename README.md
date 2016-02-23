
## CarrotJuice

### Dependencies
- Zika branch of [Resources / MagicBox](https://github.com/mikefab/resources/tree/zika) must be running
- If you don' have token: NODE_ENV=development nodemon server.js 8002

### Setup 
- npm install
- bower install
- Change config-example.js to config.js
- Add your email address to whitelist array
- nodemon server.js
- Sign up with email address

# Developer API

#### dictionary
- divis_kind: division kind - Any polygon that can be drawn on a map. Kinds inlcude: admin, cell. 
- country_iso: ISO 3166-1 alpha-2 – two-letter country codes

### Routes

- /api/diagonal/:divis_kind/:country_iso
 
Called from function: `fetch_matrix_then_draw`
 
Fetches diagonal of the mobility matrix. i.e. the number of people who've made two calls from the same tower. We think this is a measure of population density. It's a dynamic estimate. It changes from day.

Currently fetches matrix for one single day

The max value of the Diagonal of matrix is used to normalize all diagonal values. These values are used in the opacity of polygon colors to represent population density.


- /api/division/:divis_kind/:country_iso

Called from function: `fetch_geojson_for_divisions`

Fetches geojson for either admin 2 polygons or voranoi cells to be displayed on map.

TODO(mikefab): Change 'division' to 'geojson'

## Notes

- Clicking is not enabled (coming soon)