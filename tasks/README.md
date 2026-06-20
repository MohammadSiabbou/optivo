## Overview
This is a management service for photographers and studios.

### Features
it will give them the ability to:
- manage thier shoots
- build custom aesthetic order pages
- show previews (protected by a watermark and lower quality) 
- share the final photos after the project is done with full quality and the ability of the ones having the link (protected by password optionally )

## Architecture
This project is OOP oriented.
We will use Aurora PostgreSQL aws for the DB client, the DB connection logic should be in a DBClient class which implements a IDBClient interface, which contains the basic typesafe methods , insert, update, delete, list, find -> returns a single column based on the filters, and an excute function which excutes the query as is, withotu 