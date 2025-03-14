const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'neo4j+s://dd200c03.databases.neo4j.io',
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || 'neo4j',
    process.env.NEO4J_PASSWORD || '24C06gLS9P7Jn8vOxd9OMRAsq-YlPBRUJrjEmuzo_kY'
  )
);

const session = driver.session();

module.exports = { driver, session };
