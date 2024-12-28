const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'neo4j+s://513c02fb.databases.neo4j.io',
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || 'neo4j',
    process.env.NEO4J_PASSWORD || 't1dLqE3Y8wwKeuYE1pxif1CxUhGXvPyhOpXdHqHvJtM'
  )
);

const session = driver.session();

module.exports = { driver, session };
