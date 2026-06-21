## Overview
This is a management service for photographers and studios.

### Features
it will give them the ability to:
- manage thier shoots
- build custom aesthetic order pages
- show previews (protected by a watermark and lower quality) 
- share the final photos after the project is done with full quality and the ability of the ones having the link (protected by password optionally )

## Architecture
- This project is OOP.
- each feature will be its own folder with subfolders inside modules/ for validation, usecases, services, repositories, in services and repositories each one will have the port (interface file) and the implementation class
- We will use Aurora PostgreSQL aws for the DB client
- You can use a package that helps with db migrations and query building
- We will have Ports which are interfaces later to be implemented, this includes stuff like services, repositories..
- the DB connection logic should be in a DBClient class:
 implements a IDBClient interface, which contains the basic typesafe methods , insert, update, delete, list, find -> returns a single column based on the filters, and an excute function which excutes the query as is (with sql-injection safety), only used when really needed and none of the others could serve that usecase
- Each table should have a service class which will have the DB client injected in it and use it to do data fetching/manipulation
- We will usecases here, each task (eg save order) should be a usecase, usecases are classes with one function ->excute(takes the payload here), they only use Ports 
- the validation logic should be defined in a single place rather than sperate frontend/backend, that validation logic will be used in the frontend for a reactive and user friendly and in the backend (use cases) to run validation again for those payloads
 the tests should be defined with each module with the folder name tests/ and it should mirror the structure of the folders of the file being tested, for example a test for clients/services/clientsService.ts should be in tests/services/clientsService.test.ts

## Rules
- never make architecture decisions for yourself, always ask the user, we need to keep the architecture clean.
- never commit unless asked to
- always write tests for your code, with as much coverage as we can. use vitest
- never write user side strings as static, we need i18n support here, for now we will have just english but we might add new languages later so dont use static strings
- dont repeat code, always look for a function before adding it, if a function close to it exists base on it or edit it if its easier