const { ApolloServer } = require('apollo-server');
const typeDefs = require('./ressources/typeDefs');
const resolvers = require('./ressources/query'); 

const server = new ApolloServer({ typeDefs, resolvers });


module.exports= server;

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});